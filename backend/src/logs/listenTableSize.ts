import { pool } from "../db/pool";
import { broadcast } from "../websocket/broadcaster";
import { convertSize } from "../utils/convertSize";
import { startPeriodicStats } from "./periodicStats";

export async function listenTableSize() {
  startPeriodicStats("table_size", 30000, async () => {
    const result = await pool.query("SELECT pg_total_relation_size('systemevents') AS size_bytes");
    const bytes = Number(result.rows[0].size_bytes);
    broadcast("table_size", convertSize(bytes));
  });
}
