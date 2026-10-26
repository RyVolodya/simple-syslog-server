import { getStatsDevices } from "../services/statsDevices";
import { broadcast } from "../websocket/broadcaster";
import { startPeriodicStats } from "./periodicStats";

export async function listenDeviceStats() {
  startPeriodicStats("devices", 5000, async () => {
    broadcast("device_stats", await getStatsDevices());
  });
}
