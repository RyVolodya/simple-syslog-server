import { WebSocketServer } from "ws";
import { clients } from "./broadcaster";
import { pool } from "../db";
import { convertSize } from "../utils/convertSize";
import { getStatsDevices } from "../services/statsDevices";

export const wss = new WebSocketServer({ noServer: true });

async function getInitialStats() {
  const [devices, messages] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM devices"),
    pool.query("SELECT COUNT(*)::int AS count FROM systemevents"),
  ]);
  return {
    devices: Number(devices.rows[0]?.count ?? 0),
    messages: Number(messages.rows[0]?.count ?? 0),
  };
}

async function getInitialDbSize() {
  const q = await pool.query("SELECT pg_total_relation_size('systemevents') AS size_bytes");
  return convertSize(Number(q.rows[0]?.size_bytes ?? 0));
}

async function getInitialMessageStats() {
  const { rows } = await pool.query(`
    SELECT
      (priority & 7)::text AS message_type,
      COUNT(*)::int AS count,
      ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2)::float AS percent
    FROM systemevents
    WHERE receivedat >= NOW() - INTERVAL '24 hours'
    GROUP BY (priority & 7)
    ORDER BY count DESC
  `);
  return rows;
}

wss.on("connection", async (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));

  try {
    ws.send(JSON.stringify({ type: "connected", data: { ok: true } }));
    ws.send(JSON.stringify({ type: "stats", data: await getInitialStats() }));
    ws.send(JSON.stringify({ type: "table_size", data: await getInitialDbSize() }));
    ws.send(JSON.stringify({ type: "device_stats", data: await getStatsDevices() }));
    ws.send(JSON.stringify({ type: "message_stats", data: await getInitialMessageStats() }));
  } catch (error) {
    console.error("Initial websocket payload error", error);
  }
});
