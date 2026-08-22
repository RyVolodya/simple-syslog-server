import { Router } from "express";
import { pool } from "../db";

const router = Router();

const deviceSelect = `
  SELECT id,
         fromhost AS ip,
         reported_hostname AS "reportedHostname",
         syslog_hostname_is_valid(reported_hostname) AS "reportedHostnameValid",
         name AS alias,
         syslog_device_display_name(name, reported_hostname, fromhost) AS name,
         first_seen AS "firstSeen",
         last_seen AS "lastSeen",
         (SELECT COUNT(*)::int FROM systemevents s WHERE s.fromhost = devices.fromhost) AS "messageCount"
  FROM devices
`;

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`${deviceSelect}
      ORDER BY syslog_device_display_name(name, reported_hostname, fromhost), fromhost
    `);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${deviceSelect} WHERE id = $1`, [Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ message: "Device not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const alias = String(req.body?.name ?? "").trim();
    const { rows } = await pool.query(
      `UPDATE devices SET name = NULLIF($1, '') WHERE id = $2
       RETURNING id`,
      [alias, Number(req.params.id)],
    );
    if (!rows[0]) return res.status(404).json({ message: "Device not found" });

    const result = await pool.query(`${deviceSelect} WHERE id = $1`, [Number(req.params.id)]);
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});


router.delete("/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid device id" });
    }

    const deviceResult = await client.query(
      `SELECT id, fromhost
       FROM devices
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );

    const device = deviceResult.rows[0];
    if (!device) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Device not found" });
    }

    const messageResult = await client.query(
      `SELECT EXISTS(
         SELECT 1
         FROM systemevents
         WHERE fromhost = $1
       ) AS "hasMessages"`,
      [device.fromhost],
    );

    if (Boolean(messageResult.rows[0]?.hasMessages)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Device still has syslog messages and cannot be deleted.",
      });
    }

    await client.query("DELETE FROM devices WHERE id = $1", [id]);
    await client.query("COMMIT");

    res.json({ ok: true, id });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
});

export default router;
