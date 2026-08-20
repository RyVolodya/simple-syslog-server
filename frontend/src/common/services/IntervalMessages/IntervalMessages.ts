import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export interface RetentionSetting { days: number; }
export const settingsApi=createApi({reducerPath:"settingsApi",baseQuery:fetchBaseQuery({baseUrl:"/api/",credentials:"include"}),tagTypes:["Retention"],endpoints:(builder)=>({
  getInterval:builder.query<RetentionSetting,void>({query:()=>"settings/retention",providesTags:["Retention"]}),
  updateInterval:builder.mutation<RetentionSetting,RetentionSetting>({query:(body)=>({url:"settings/retention",method:"PUT",body}),invalidatesTags:["Retention"]}),
})});
export const {useGetIntervalQuery,useUpdateIntervalMutation}=settingsApi;
