//ОТРИМАННЯ ПРИСТРОЇВ ТА ПОВІДОМЛЕНЬ У ПРОЦЕНТНОМУ СПІВВІДНОШЕННІ
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface StatsPayload {
  device_id: string;
  messages: number;
  total_messages?: number;
  percent: number;
}

export const statsApi = createApi({
  reducerPath: "deviceStatsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    subscribeDevicesPercentStats: builder.query<StatsPayload[], void>({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(arg, { updateCachedData, cacheEntryRemoved }) {
        // ✔ створюємо вебсокет
        const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

        ws.onopen = () => {
          console.log("[WS DevicesPercent] WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            // ✔ парсимо дані
            const msg = JSON.parse(event.data);
            console.log("[WS DevicesPercent] Message received:", msg);

            if (msg.type === "device_stats" && Array.isArray(msg.data)) {
              console.log("[WS DevicesPercent] Processing device_stats:", msg.data);
              updateCachedData((draft: StatsPayload[]) => {
                // ✔ стираємо старі дані  в кеші
                draft.length = 0;
                // ✔ записуємо нові дані  в кеші
                msg.data.forEach((item: StatsPayload) => {
                  console.log("[WS DevicesPercent] Adding item:", item);
                  draft.push(item);
                });
                console.log("[WS DevicesPercent] Updated cache, new length:", draft.length);
              });
            } else {
              console.log("[WS DevicesPercent] Ignoring message type:", msg.type);
            }
          } catch (e) {
            console.error("[WS DevicesPercent] Parse error", e);
          }
        };

        ws.onerror = (error) => {
          console.error("[WS DevicesPercent] WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("[WS DevicesPercent] WebSocket closed");
        };

        // ✔ видаляємо кеш перед тим як закрити вебсокет
        await cacheEntryRemoved;
        ws.close();
      },
    }),
  }),
});
export const { useSubscribeDevicesPercentStatsQuery } = statsApi;
