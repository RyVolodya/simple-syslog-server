import { Router } from "express";
import { pool } from "../db";
import { hashPassword, verifyPassword } from "../auth/security";

const router = Router();
const usernameRe = /^[A-Za-z0-9]{5,}$/;
const roles = ["operator", "administrator"] as const;

function isAdministrator(req: any) {
  return req.user?.role === "administrator";
}

async function administratorCount() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role='administrator'`);
  return Number(rows[0]?.count || 0);
}

router.get("/", async (req, res) => {
  const auth = (req as any).user;
  res.json({ login: auth.login, role: auth.role });
});

router.get("/users", async (req, res, next) => {
  try {
    const auth = (req as any).user;
    const result = isAdministrator(req)
      ? await pool.query(`SELECT id,login,role,created_at FROM users ORDER BY role,login`)
      : await pool.query(`SELECT id,login,role,created_at FROM users WHERE id=$1`, [auth.id]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

router.post("/users", async (req, res, next) => {
  try {
    if (!isAdministrator(req)) return res.status(403).json({ message: "Administrator access required" });
    const login = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "operator");
    if (!usernameRe.test(login)) return res.status(400).json({ message: "Username must be at least 5 characters and contain letters and numbers only" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!roles.includes(role as any)) return res.status(400).json({ message: "Invalid role" });
    const { rows } = await pool.query(
      `INSERT INTO users(login,password_hash,role,must_change_password) VALUES($1,$2,$3,TRUE) RETURNING id,login,role,created_at`,
      [login, hashPassword(password), role],
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e?.code === "23505") return res.status(409).json({ message: "Username already exists" });
    next(e);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const auth = (req as any).user;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid user id" });

    const { rows } = await client.query(`SELECT id,login,role,password_hash FROM users WHERE id=$1`, [id]);
    const target = rows[0];
    if (!target) return res.status(404).json({ message: "User not found" });

    if (!isAdministrator(req)) {
      if (id !== auth.id) return res.status(403).json({ message: "Operators can edit only their own account" });
      const currentPassword = String(req.body?.currentPassword || "");
      const password = String(req.body?.password || "");
      if (!currentPassword || !verifyPassword(currentPassword, target.password_hash)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (password.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
      await client.query(`UPDATE users SET password_hash=$1,must_change_password=FALSE WHERE id=$2`, [hashPassword(password), id]);
      return res.json({ id, login: target.login, role: target.role });
    }

    const login = String(req.body?.login ?? target.login).trim();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role ?? target.role);
    if (!usernameRe.test(login)) return res.status(400).json({ message: "Username must be at least 5 characters and contain letters and numbers only" });
    if (password && password.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
    if (!roles.includes(role as any)) return res.status(400).json({ message: "Invalid role" });

    if (target.role === "administrator" && role !== "administrator" && (await administratorCount()) <= 1) {
      return res.status(400).json({ message: "At least one Administrator account is required" });
    }

    await client.query("BEGIN");
    if (password) {
      await client.query(
        `UPDATE users SET login=$1,role=$2,password_hash=$3,must_change_password=FALSE WHERE id=$4`,
        [login, role, hashPassword(password), id],
      );
    } else {
      await client.query(`UPDATE users SET login=$1,role=$2 WHERE id=$3`, [login, role, id]);
    }
    await client.query("COMMIT");
    res.json({ id, login, role });
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (e?.code === "23505") return res.status(409).json({ message: "Username already exists" });
    next(e);
  } finally { client.release(); }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    if (!isAdministrator(req)) return res.status(403).json({ message: "Administrator access required" });
    const auth = (req as any).user;
    const id = Number(req.params.id);
    if (id === auth.id) return res.status(400).json({ message: "You cannot delete your own account" });
    const { rows } = await pool.query(`SELECT role FROM users WHERE id=$1`, [id]);
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    if (rows[0].role === "administrator" && (await administratorCount()) <= 1) {
      return res.status(400).json({ message: "At least one Administrator account is required" });
    }
    await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
