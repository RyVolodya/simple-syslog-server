import { pool } from "../db/pool";
import { broadcast } from "../websocket/broadcaster";
import { startPeriodicStats } from "./periodicStats";

export async function getStats() {
  startPeriodicStats("totals", 5000, async () => {
    const [devices, messages] = await Promise.all([
      pool.query("SELECT COUNT(DISTINCT fromhost) AS devices_count FROM systemevents"),
      pool.query("SELECT COUNT(*) AS messages_count FROM systemevents"),
    ]);
    const payload = {
      devices: Number(devices.rows[0].devices_count),
      messages: Number(messages.rows[0].messages_count),
    };
    broadcast("stats", payload);
  });
}
