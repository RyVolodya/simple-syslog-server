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
         last_seen AS "lastSeen"
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

export default router;
