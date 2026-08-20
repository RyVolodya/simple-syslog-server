import { store } from "../redux/store";
import { setDbSize } from "../redux/services/getDbSize";

export function initDbSizeSocket() {
  const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

  ws.onopen = () => {
    // console.log("[WS DB Size] Connected");
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // console.log("[WS DB Size] Message received:", message);

      // Обробка повідомлення про розмір таблиці
      if (message.type === "table_size" && message.data) {
        const { value, unit } = message.data;
        if (typeof value === "number" && typeof unit === "string") {
          store.dispatch(setDbSize({ value, unit }));
          // console.log("[WS DB Size] Updated:", { value, unit });
        }
      }
    } catch (error) {
      // console.error("[WS DB Size] Parse error:", error);
    }
  };

  ws.onerror = (e) => {
    // console.error("[WS DB Size] Error:", e);
  };

  ws.onclose = () => {
    // console.log("[WS DB Size] Connection closed");
  };

  return ws;
}
