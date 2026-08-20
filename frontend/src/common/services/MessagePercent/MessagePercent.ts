import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MessageTypeStat {
  message_type: string;
  count: number;
  percent: number;
}

export const statsApi = createApi({
  reducerPath: "messagePercentApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    subscribeMessageStats: builder.query<MessageTypeStat[], void>({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(arg, { updateCachedData, cacheEntryRemoved }) {
        const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

        ws.onopen = () => {
          console.log("[WS MessagePercent] WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log("[WS MessagePercent] Message received:", msg);

            if (msg.type === "message_stats") {
              console.log("[WS MessagePercent] Processing message_stats:", msg.data);
              updateCachedData(() => {
                const newData = Array.isArray(msg.data) ? msg.data : [];
                console.log("[WS MessagePercent] Updated cache, new length:", newData.length);
                return newData;
              });
            } else {
              console.log("[WS MessagePercent] Ignoring message type:", msg.type);
            }
          } catch (e) {
            console.error("[WS MessagePercent] Parse error", e);
          }
        };

        ws.onerror = (error) => {
          console.error("[WS MessagePercent] WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("[WS MessagePercent] WebSocket closed");
        };

        await cacheEntryRemoved;
        ws.close();
      },
    }),
  }),
});

export const { useSubscribeMessageStatsQuery } = statsApi;
