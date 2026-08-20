import { Router } from "express";
import { pool } from "../db";
import { hashPassword } from "../auth/security";

const router = Router();
const usernameRe = /^[A-Za-z0-9]{5,}$/;

router.get("/", async (req, res) => {
  const auth = (req as any).user;
  res.json({ login: auth.login, role: auth.role });
});

router.put("/", async (req, res, next) => {
  try {
    const auth = (req as any).user;
    const login = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    if (!usernameRe.test(login)) return res.status(400).json({ message: "Username must be at least 5 characters and contain letters and numbers only" });
    if (password && password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (password) await pool.query(`UPDATE users SET login=$1,password_hash=$2,must_change_password=FALSE WHERE id=$3`, [login, hashPassword(password), auth.id]);
    else await pool.query(`UPDATE users SET login=$1 WHERE id=$2`, [login, auth.id]);
    res.json({ success: true });
  } catch (e: any) {
    if (e?.code === "23505") return res.status(409).json({ message: "Username already exists" });
    next(e);
  }
});

router.get("/users", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id,login,role,created_at FROM users ORDER BY role,login`);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/users", async (req, res, next) => {
  try {
    const login = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "operator");
    if (!usernameRe.test(login)) return res.status(400).json({ message: "Username must be at least 5 characters and contain letters and numbers only" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!["operator", "administrator"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const { rows } = await pool.query(`INSERT INTO users(login,password_hash,role,must_change_password) VALUES($1,$2,$3,TRUE) RETURNING id,login,role,created_at`, [login, hashPassword(password), role]);
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e?.code === "23505") return res.status(409).json({ message: "Username already exists" });
    next(e);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const auth = (req as any).user;
    const id = Number(req.params.id);
    if (id === auth.id) return res.status(400).json({ message: "You cannot delete your own account" });
    await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
