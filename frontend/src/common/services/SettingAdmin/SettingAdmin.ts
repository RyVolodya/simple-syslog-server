import { createApi,fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export type UserRole="administrator"|"operator";
export interface Admin { login:string; password?:string; role?:UserRole; }
export interface User { id:number; login:string; role:UserRole; created_at?:string; }
export interface NewUser { login:string; password:string; role:UserRole; }
export interface UpdateUser { id:number; login?:string; password?:string; currentPassword?:string; role?:UserRole; }
export const adminApi=createApi({reducerPath:"adminApi",baseQuery:fetchBaseQuery({baseUrl:"/api",credentials:"include"}),tagTypes:["Admin","Users"],endpoints:(builder)=>({
  getAdmin:builder.query<Admin,void>({query:()=>"admin",providesTags:["Admin"]}),
  getUsers:builder.query<User[],void>({query:()=>"admin/users",providesTags:["Users"]}),
  addUser:builder.mutation<User,NewUser>({query:(body)=>({url:"admin/users",method:"POST",body}),invalidatesTags:["Users"]}),
  updateUser:builder.mutation<User,UpdateUser>({query:({id,...body})=>({url:`admin/users/${id}`,method:"PATCH",body}),invalidatesTags:["Users","Admin"]}),
  deleteUser:builder.mutation<void,number>({query:(id)=>({url:`admin/users/${id}`,method:"DELETE"}),invalidatesTags:["Users"]}),
})});
export const {useGetAdminQuery,useGetUsersQuery,useAddUserMutation,useUpdateUserMutation,useDeleteUserMutation}=adminApi;
