import { getStats } from "./listenLogs";
import { listenLast24 } from "./listenLast-24h";
import { listenTableSize } from "./listenTableSize";
import { listenDeviceStats } from "./listenStatDevice";
import { listenMessageStats } from "./listenMessageStats";

export async function listenLogs(): Promise<void> {
  await getStats();
  await listenLast24();
  await listenTableSize();
  await listenDeviceStats();
  await listenMessageStats();
}
