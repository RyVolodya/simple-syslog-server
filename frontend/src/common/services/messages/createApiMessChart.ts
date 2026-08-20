import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const statsApi = createApi({
  reducerPath: "statsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  endpoints: (builder) => ({
    getStats: builder.query<any[], void>({
      query: () => "stats/messages",
    }),
  }),
});
export const { useGetStatsQuery } = statsApi;
