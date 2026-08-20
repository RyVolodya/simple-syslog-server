import { pool } from "../db/pool";
import { broadcast } from "../websocket/broadcaster";
import { PoolClient } from "pg";

// Зберігаємо клієнта, щоб він не був зібраний збирачем сміття
let statsClient: PoolClient | null = null;
let statsInterval: NodeJS.Timeout | null = null;

// Функція для отримання та відправки stats
async function fetchAndBroadcastStats() {
  try {
    const devices = await pool.query(
      "SELECT COUNT(DISTINCT fromhost) AS devices_count FROM systemevents",
    );

    const messages = await pool.query("SELECT COUNT(*) AS messages_count FROM systemevents");

    const payload = {
      devices: Number(devices.rows[0].devices_count),
      messages: Number(messages.rows[0].messages_count),
    };

    broadcast("stats", payload);
    console.log(">>> STATS EVENT SENT", payload);
  } catch (e) {
    //console.error("[REALTIME STATS ERROR]", e);
  }
}

export async function getStats() {
  try {
    const client = await pool.connect();
    statsClient = client; // Зберігаємо посилання

    // Обробка помилок підключення
    client.on("error", (err) => {
      console.error("❌ [stats_channel] Client error:", err);
      statsClient = null;
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
      // Спробуємо перепідключитися через 5 секунд
      setTimeout(() => {
       // console.log("🔄 [stats_channel] Attempting to reconnect...");
        getStats().catch(console.error);
      }, 30000);
    });

    await client.query("LISTEN stats_channel");
   // console.log("📡 PostgreSQL LISTEN stats_channel ENABLED");

    client.on("notification", async (msg) => {
     // console.log("📨 [stats_channel] NOTIFICATION received:", msg.channel, msg.payload);
      await fetchAndBroadcastStats();
    });

    // Періодичне оновлення як fallback (кожні 5 секунд)
    // Це гарантує, що дані оновлюються навіть якщо тригер не спрацьовує
    statsInterval = setInterval(() => {
      console.log("🔄 [stats_channel] Periodic stats refresh");
      fetchAndBroadcastStats();
    }, 30000);

    //console.log("✅ [stats_channel] Client connected and listening");
  } catch (error) {
    console.error("❌ [stats_channel] Failed to connect:", error);
    statsClient = null;
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  }
}
