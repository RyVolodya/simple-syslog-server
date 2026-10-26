import { getLast24Stats } from "../services/service.Last24Messages";
import { broadcast } from "../websocket/broadcaster";
import { startPeriodicStats } from "./periodicStats";

export async function listenLast24() {
  startPeriodicStats("last24h", 10000, async () => {
    broadcast("last24h_stats", await getLast24Stats());
  });
}
