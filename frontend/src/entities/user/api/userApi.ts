import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  User, 
  UserExt, 
  UsersResponse, 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserStatus 
} from "../model/types";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared";

export const userApi = createApi({
  reducerPath: "userApi",
    baseQuery: fetchBaseQuery({
      baseUrl: NEXT_PUBLIC_BACKEND_API_URL || '/api',
      credentials: "include",
    }),
//   baseQuery: baseQueryWithAuth,
  tagTypes: ["Users", "User"],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    
    getUserById: builder.query<UserExt, string>({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    
    createUser: builder.mutation<User, CreateUserDTO>({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),
    
    updateUser: builder.mutation<User, { id: string; body: UpdateUserDTO }>({
      query: ({ id, body }) => ({
        url: `users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Users",
        { type: "User", id },
      ],
    }),
    
    updateUserStatus: builder.mutation<User, { id: string; status: UserStatus }>({
      query: ({ id, status }) => ({
        url: `users/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      // Оптимистичное обновление
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        // Патч для кеша getUsers
        const patchUsers = dispatch(
          userApi.util.updateQueryData("getUsers", undefined, (draft) => {
            const userIndex = draft.findIndex((user) => user.id === id);
            if (userIndex !== -1) {
              draft[userIndex].status = status;
            }
          })
        );
        
        // Патч для кеша getUserById
        const patchUser = dispatch(
          userApi.util.updateQueryData("getUserById", id, (draft) => {
            draft.status = status;
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchUsers.undo();
          patchUser.undo();
        }
      },
      invalidatesTags: (result, error, { id }) => [
        "Users",
        { type: "User", id },
      ],
    }),
    
    blockUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `users/${id}/block`,
        method: "PATCH",
      }),
      // Оптимистичное обновление
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Патч для кеша getUsers
        const patchUsers = dispatch(
          userApi.util.updateQueryData("getUsers", undefined, (draft) => {
            const userIndex = draft.findIndex((user) => user.id === id);
            if (userIndex !== -1) {
              draft[userIndex].status = "BLOCKED";
            }
          })
        );
        
        // Патч для кеша getUserById
        const patchUser = dispatch(
          userApi.util.updateQueryData("getUserById", id, (draft) => {
            draft.status = "BLOCKED";
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchUsers.undo();
          patchUser.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        "Users",
        { type: "User", id },
      ],
    }),
    
    unblockUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `users/${id}/unblock`,
        method: "PATCH",
      }),
      // Оптимистичное обновление
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Патч для кеша getUsers
        const patchUsers = dispatch(
          userApi.util.updateQueryData("getUsers", undefined, (draft) => {
            const userIndex = draft.findIndex((user) => user.id === id);
            if (userIndex !== -1) {
              draft[userIndex].status = "ACTIVE";
            }
          })
        );
        
        // Патч для кеша getUserById
        const patchUser = dispatch(
          userApi.util.updateQueryData("getUserById", id, (draft) => {
            draft.status = "ACTIVE";
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchUsers.undo();
          patchUser.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        "Users",
        { type: "User", id },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useLazyGetUserByIdQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
} = userApi;