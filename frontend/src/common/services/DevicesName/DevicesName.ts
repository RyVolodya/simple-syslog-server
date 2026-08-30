import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Device } from "../../types/form.type";

export const devicesApi = createApi({
  reducerPath: "devicesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }), // твій бекенд
  tagTypes: ["Devices"],

  endpoints: (builder) => ({
    getDevices: builder.query<Device[], void>({
      query: () => "/devices",
      providesTags: ["Devices"],
    }),

    getDeviceById: builder.query<Device, number>({
      query: (id) => `/devices/${id}`,
    }),

    updateDeviceName: builder.mutation<Device, { id: number; name: string }>({
      query: ({ id, name }) => ({
        url: `/devices/${id}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Devices"],
    }),

    deleteDevice: builder.mutation<
      { ok: boolean; id: number; name: string; ip: string; deletedMessages: number },
      number
    >({
      query: (id) => ({
        url: `/devices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});

export const {
  useGetDevicesQuery,
  useGetDeviceByIdQuery,
  useUpdateDeviceNameMutation,
  useDeleteDeviceMutation,
} = devicesApi;
///----------------------------------------------------------
//import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

/*export interface StatsPayload {
  devices: number;
  messages: number;
}*/

/*export const statsApi = createApi({
  reducerPath: "statsApi",
  baseQuery: fakeBaseQuery(),
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

export const { useSubscribeStatsQuery } = statsApi;*/
