import cron from "node-cron";
import { pool } from "./db";
export function startCron() {
  cron.schedule("0 2 * * *", async () => {
    try {
      const r = await pool.query("SELECT retention_days FROM settings WHERE id=1");
      const days = Number(r.rows[0]?.retention_days ?? 365);
      const result = await pool.query("DELETE FROM systemevents WHERE receivedat < NOW() - make_interval(days => $1)", [days]);
      await pool.query("DELETE FROM sessions WHERE expires_at <= NOW()");
      console.log(`Retention: deleted ${result.rowCount ?? 0} messages older than ${days} day(s)`);
    } catch (e) { console.error("Retention job error", e); }
  });
}
