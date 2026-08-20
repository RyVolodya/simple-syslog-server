import { pool } from "../db";
import { getStatsDevices } from "../services/statsDevices";
import { broadcast } from "../websocket/broadcaster";

export async function listenDeviceStats() {
  const client = await pool.connect();
  await client.query("LISTEN stats_channel");
  client.on("notification", async () => {
    try { broadcast("device_stats", await getStatsDevices()); }
    catch (err) { console.error("device stats broadcast error", err); }
  });
  client.on("error", () => setTimeout(() => listenDeviceStats().catch(console.error), 5000));
}
