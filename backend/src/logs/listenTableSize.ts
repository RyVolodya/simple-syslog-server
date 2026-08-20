import { pool } from "../db/pool";
import { broadcast } from "../websocket/broadcaster";
import { convertSize } from "../utils/convertSize";
import { PoolClient } from "pg";

// Зберігаємо клієнта, щоб він не був зібраний збирачем сміття
let tableSizeClient: PoolClient | null = null;

export async function listenTableSize() {
  try {
    const client = await pool.connect();
    tableSizeClient = client; // Зберігаємо посилання

    // Обробка помилок підключення
    client.on("error", (err) => {
      console.error("❌ [table_size_updates] Client error:", err);
      tableSizeClient = null;
      // Спробуємо перепідключитися через 5 секунд
      setTimeout(() => {
        console.log("🔄 [table_size_updates] Attempting to reconnect...");
        listenTableSize().catch(console.error);
      }, 5000);
    });

    await client.query("LISTEN table_size_updates");
    console.log("📡 LISTEN table_size_updates enabled");

    client.on("notification", async (msg) => {
      //console.log("📨 [table_size_updates] NOTIFICATION received:", msg.channel, msg.payload);
      try {
        const q = await client.query(`
          SELECT pg_total_relation_size('systemevents') AS size_bytes
        `);

        const bytes = Number(q.rows[0].size_bytes);
        const size = convertSize(bytes);
        broadcast("table_size", size);
        //console.log(">>> TABLE SIZE EVENT SENT", size);
      } catch (e) {
        // console.error("[TABLE SIZE ERROR]", e);
      }
    });

    // console.log("✅ [table_size_updates] Client connected and listening");
  } catch (error) {
    // console.error("❌ [table_size_updates] Failed to connect:", error);
    tableSizeClient = null;
  }
}
