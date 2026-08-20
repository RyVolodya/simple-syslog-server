// КОД ДЛЯ ФІЛЬТРАЦІЇ ПОВІДОМЛЕНЬ (ФОРМА)
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Message {
  id: number;
  time: string;
  device: string;
  content: string;
  type: string;
}

// Тип параметрів фільтра
export interface MessageFilters {
  device?: string;
  type?: string;
  start?: string;
  end?: string;
}

export const messagesApi = createApi({
  reducerPath: "messagesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    // 🟩 1. Отримати повідомлення за фільтрами
    getMessages: builder.query<Message[], MessageFilters>({
      query: ({ device, type, start, end }) => {
        const params = new URLSearchParams();
        if (device) params.append("device", device);
        if (type) params.append("type", type);
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        return `messages?${params.toString()}`;
      },
    }),

    // 🟨 3. Отримати останні N повідомлень (limit)
    getMessagesByLimit: builder.query<Message[], number>({
      query: (limit) => `messages?limit=${limit}`,
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,

  useGetMessagesByLimitQuery,
} = messagesApi;
