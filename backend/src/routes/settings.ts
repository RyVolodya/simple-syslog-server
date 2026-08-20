import { Router } from "express";
import { pool } from "../db";
const router = Router();
router.get("/retention", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT retention_days FROM settings WHERE id=1");
    res.json({ days: Number(rows[0]?.retention_days ?? 365) });
  } catch (e) { next(e); }
});
router.put("/retention", async (req, res, next) => {
  try {
    const days = Number(req.body?.days);
    if (!Number.isInteger(days) || days < 1 || days > 36500) return res.status(400).json({ message: "Retention must be between 1 and 36500 days" });
    await pool.query("UPDATE settings SET retention_days=$1 WHERE id=1", [days]);
    res.json({ days });
  } catch (e) { next(e); }
});
export default router;
