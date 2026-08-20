import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const appNameApi = createApi({
  reducerPath: "appNameApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["AppName"],
  endpoints: (builder) => ({
    getAppName: builder.query<string, void>({
      query: () => "app/name",
      providesTags: ["AppName"],
    }),
    updateAppName: builder.mutation<void, string>({
      query: (newName) => ({
        url: "app/name",
        method: "PUT",
        body: { name: newName },
      }),
      invalidatesTags: ["AppName"],
    }),
  }),
});
export const { useGetAppNameQuery, useUpdateAppNameMutation } = appNameApi;
