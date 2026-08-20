import http from "http";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import routes from "../routes";
import { wss } from "../websocket/wss";
import { listenLogs } from "../logs/listener";
import { startCron } from "../cron";
import { getUserBySessionCookie } from "../auth/session";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api", routes);

export const server = http.createServer(app);
server.on("upgrade", async (req, socket, head) => {
  try {
    if (req.url !== "/ws") return socket.destroy();
    const user = await getUserBySessionCookie(req.headers.cookie);
    if (!user) return socket.destroy();
    (req as any).user = user;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } catch { socket.destroy(); }
});

listenLogs().catch((e) => console.error("PostgreSQL listeners failed", e));
startCron();
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err); res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});
export default app;
