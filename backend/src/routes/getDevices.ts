import { Router } from "express";
import { pool } from "../db";

const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id,
             syslog_device_display_name(name, reported_hostname, fromhost) AS name
      FROM devices
      ORDER BY syslog_device_display_name(name, reported_hostname, fromhost), fromhost
    `);
    res.json(rows);
  } catch (error) { next(error); }
});
export default router;
