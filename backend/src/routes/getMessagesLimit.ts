import { Router } from "express";
import { pool } from "../db";

const router = Router();
router.get("/messages-limit", async (req, res, next) => {
  try {
    const requested = Number(req.query.limit || 10);
    const limit = [10, 25, 50].includes(requested) ? requested : 10;
    const { rows } = await pool.query(`
      SELECT s.receivedat AS time,
             syslog_device_display_name(d.name, COALESCE(d.reported_hostname, s.reported_hostname), s.fromhost) AS "deviceId",
             s.message
      FROM systemevents s
      LEFT JOIN devices d ON d.fromhost = s.fromhost
      ORDER BY s.receivedat DESC
      LIMIT $1`, [limit]);
    res.json(rows);
  } catch (error) { next(error); }
});
export default router;
