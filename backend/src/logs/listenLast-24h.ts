//get Last Messages 24hours
import { pool } from "../db/pool";
import { getLast24Stats } from "../services/service.Last24Messages";
import { broadcast } from "../websocket/broadcaster";
import { PoolClient } from "pg";

// Зберігаємо клієнта, щоб він не був зібраний збирачем сміття
let last24Client: PoolClient | null = null;

export async function listenLast24() {
  try {
    const client = await pool.connect();
    last24Client = client; // Зберігаємо посилання

    // Обробка помилок підключення
    client.on("error", (err) => {
      //  console.error("❌ [log_updates] Client error:", err);
      last24Client = null;
      // Спробуємо перепідключитися через 5 секунд
      setTimeout(() => {
        //  console.log("🔄 [log_updates] Attempting to reconnect...");
        listenLast24().catch(console.error);
      }, 5000);
    });

    client.on("notification", async (msg) => {
      //  console.log("📨 [log_updates] NOTIFICATION received:", msg.channel, msg.payload);
      try {
        const stats = await getLast24Stats();
        broadcast("last24h_stats", stats);
        //   console.log(">>> LAST 24H STATS EVENT SENT", stats);
      } catch (e) {
        //  console.error("[LAST 24H STATS ERROR]", e);
      }
    });

    await client.query("LISTEN log_updates");
    // console.log("✅ LISTEN log_updates enabled");
    //console.log("✅ [log_updates] Client connected and listening");
  } catch (error) {
    //  console.error("❌ [log_updates] Failed to connect:", error);
    last24Client = null;
  }
}
