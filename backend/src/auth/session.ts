import { Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { hashSessionToken } from "./security";

export type AuthUser = { id: number; login: string; role: "administrator" | "operator"; mustChangePassword: boolean };

function parseCookie(header = "") {
  return Object.fromEntries(header.split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf("=");
    return [decodeURIComponent(i >= 0 ? v.slice(0, i) : v), decodeURIComponent(i >= 0 ? v.slice(i + 1) : "")];
  }));
}

export async function getUserBySessionCookie(cookieHeader?: string): Promise<AuthUser | null> {
  const sid = parseCookie(cookieHeader || "").sss_session;
  if (!sid) return null;
  const { rows } = await pool.query(`
    SELECT u.id, u.login, u.role, u.must_change_password
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at > NOW()
  `, [hashSessionToken(sid)]);
  const u = rows[0];
  if (!u) return null;
  return { id: Number(u.id), login: u.login, role: u.role, mustChangePassword: Boolean(u.must_change_password) };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserBySessionCookie(req.headers.cookie);
    if (!user) return res.status(401).json({ message: "Authentication required" });
    (req as any).user = user;
    next();
  } catch (e) { next(e); }
}

export function requireCompletedPasswordChange(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser | undefined;
  if (user?.mustChangePassword) return res.status(403).json({ message: "Password change required" });
  next();
}

export function requireAdministrator(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser | undefined;
  if (!user || user.role !== "administrator") return res.status(403).json({ message: "Administrator access required" });
  next();
}

export function blockOperatorWrites(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireAdministrator(req, res, next);
}
