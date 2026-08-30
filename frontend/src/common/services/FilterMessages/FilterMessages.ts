import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MessageRow {
  id: number;
  time: string;
  deviceKey: number | null;
  deviceId: string | null;
  severity: number;
  severityLabel: string;
  message: string;
}

export interface Device {
  id: number;
  name: string;
}

export interface MessageQuery {
  deviceId?: string;
  type?: string;
  fromTime?: string;
  toTime?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessagesResponse {
  items: MessageRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExportMessagesResponse {
  items: MessageRow[];
  total: number;
  exported: number;
  truncated: boolean;
  maxRows: number;
}

export interface SeverityStat {
  severity: number;
  label: string;
  count: number;
}

export const messagesFilterApi = createApi({
  reducerPath: "messagesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getDevices: builder.query<Device[], void>({
      query: () => "/list-devices",
      keepUnusedDataFor: 0,
    }),
    getFilteredMessages: builder.query<MessagesResponse, MessageQuery>({
      query: ({ deviceId, type, fromTime, toTime, search, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (deviceId) params.append("deviceId", deviceId);
        if (type !== undefined && type !== "") params.append("type", type);
        if (fromTime) params.append("from", fromTime);
        if (toTime) params.append("to", toTime);
        if (search?.trim()) params.append("search", search.trim());
        params.append("page", String(page));
        params.append("limit", String(limit));
        return `/messages-filter?${params.toString()}`;
      },
    }),
    getSeverityStats: builder.query<SeverityStat[], void>({
      query: () => "/messages-filter/stats",
    }),
  }),
});

export const {
  useGetDevicesQuery,
  useGetFilteredMessagesQuery,
  useLazyGetFilteredMessagesQuery,
  useGetSeverityStatsQuery,
} = messagesFilterApi;
