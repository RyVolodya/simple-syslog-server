import { pool } from "../db";
import { broadcast } from "../websocket/broadcaster";
import { startPeriodicStats } from "./periodicStats";

async function getMessageStats() {
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

export async function listenMessageStats() {
  startPeriodicStats("severity", 5000, async () => {
    broadcast("message_stats", await getMessageStats());
  });
}
