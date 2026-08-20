import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../auth/security";
import { requireAuth } from "../auth/session";

const router = Router();
const usernameRe = /^[A-Za-z0-9]{5,}$/;
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const login = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    const { rows } = await pool.query(`SELECT id,login,password_hash,role,must_change_password FROM users WHERE login=$1`, [login]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ message: "Invalid username or password" });

    const token = createSessionToken();
    await pool.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
    await pool.query(`INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '24 hours')`, [user.id, hashSessionToken(token)]);
    res.cookie("sss_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true", maxAge: 24 * 60 * 60 * 1000, path: "/" });
    res.json({ id: Number(user.id), login: user.login, role: user.role, mustChangePassword: Boolean(user.must_change_password) });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, (req, res) => res.json((req as any).user));

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const sid = req.cookies?.sss_session;
    if (sid) await pool.query(`DELETE FROM sessions WHERE token_hash=$1`, [hashSessionToken(sid)]);
    res.clearCookie("sss_session", { path: "/" });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
    const auth = (req as any).user;
    const q = await pool.query(`SELECT password_hash FROM users WHERE id=$1`, [auth.id]);
    if (!q.rows[0] || !verifyPassword(currentPassword, q.rows[0].password_hash)) return res.status(400).json({ message: "Current password is incorrect" });
    await pool.query(`UPDATE users SET password_hash=$1,must_change_password=FALSE WHERE id=$2`, [hashPassword(newPassword), auth.id]);
    const sid = req.cookies?.sss_session;
    if (sid) await pool.query(`DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2`, [auth.id, hashSessionToken(sid)]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.put("/username", requireAuth, async (req, res, next) => {
  try {
    const auth = (req as any).user;
    if (auth.role !== "administrator") return res.status(403).json({ message: "Administrator access required" });
    const login = String(req.body?.login || "").trim();
    if (!usernameRe.test(login)) return res.status(400).json({ message: "Username must be at least 5 characters and contain letters and numbers only" });
    await pool.query(`UPDATE users SET login=$1 WHERE id=$2`, [login, auth.id]);
    res.json({ success: true, login });
  } catch (e: any) {
    if (e?.code === "23505") return res.status(409).json({ message: "Username already exists" });
    next(e);
  }
});

export default router;
