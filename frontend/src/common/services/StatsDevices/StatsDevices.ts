//ОТРИМУЮ ПРИСТРОЇ ТА ПОВІДОЛЕННЯ
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export interface StatsPayload {
  devices: number;
  messages: number;
}

export const statsApi = createApi({
  reducerPath: "statsDevicesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    subscribeStats: builder.query<StatsPayload, void>({
      queryFn: () => ({ data: { devices: 0, messages: 0 } }),

      async onCacheEntryAdded(arg, { updateCachedData, cacheEntryRemoved }) {
        const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

        ws.onopen = () => {
          console.log("[WS Stats] Connected");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("[WS Stats] Message received:", message);

            // Обробляємо тільки повідомлення типу "stats"
            if (message.type === "stats" && message.data) {
              const statsData = message.data;
              if (typeof statsData.devices === "number" && typeof statsData.messages === "number") {
                console.log("[WS Stats] Updating cache with:", statsData);
                // Використовуємо функцію оновлення, щоб гарантувати оновлення навіть якщо значення однакові
                updateCachedData((draft) => {
                  draft.devices = statsData.devices;
                  draft.messages = statsData.messages;
                });
                console.log("[WS Stats] Cache updated");
              }
            }
          } catch (error) {
            console.error("[WS Stats] Parse error:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[WS Stats] Error:", error);
        };

        ws.onclose = () => {
          console.log("[WS Stats] Connection closed");
        };

        await cacheEntryRemoved;
        ws.close();
      },
    }),
  }),
});

export const { useSubscribeStatsQuery } = statsApi;
