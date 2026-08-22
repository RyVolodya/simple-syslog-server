import { Router } from "express";
import { pool } from "../db";

const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT d.id,
             syslog_device_display_name(d.name, d.reported_hostname, d.fromhost) AS name
      FROM devices d
      WHERE EXISTS (
        SELECT 1
        FROM systemevents s
        WHERE s.fromhost = d.fromhost
      )
      ORDER BY syslog_device_display_name(d.name, d.reported_hostname, d.fromhost), d.fromhost
    `);
    res.json(rows);
  } catch (error) { next(error); }
});
export default router;
