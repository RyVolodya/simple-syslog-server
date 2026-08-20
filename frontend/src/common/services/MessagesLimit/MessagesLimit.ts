//ОТРИМУЮ  ПОВІДОЛЕННЯ ЗА ІНТЕРВАЛОМ  ТЕРМІН ЗБЕРІГАННЯ ПОВІДОМЛЕНЬ
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { MessageLimit } from "../../types/form.type";
export const messagesLimitApi = createApi({
  reducerPath: "messagesLimitApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/messages",
  }),

  endpoints: (builder) => ({
    getMessagesByLimit: builder.query<MessageLimit[], number>({
      query: (limit) => `messages-limit?limit=${limit}`,
    }),
  }),
});

export const { useGetMessagesByLimitQuery } = messagesLimitApi;
