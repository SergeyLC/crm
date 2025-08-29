import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";
import {
  Contact,
  ContactExt,
  UpdateContactDTO,
  CreateContactDTO,
} from "./types";

export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({
    baseUrl: NEXT_PUBLIC_BACKEND_API_URL,
    credentials: "include",
  }),
  tagTypes: ["Contacts"],
  endpoints: (build) => ({
    getContacts: build.query<ContactExt[], void>({
      query: () => "contacts",
      providesTags: ["Contacts"],
    }),
    getContactById: build.query<Contact, string>({
      query: (id) => `contacts/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Contacts", id }],
    }),
    createContact: build.mutation<Contact, CreateContactDTO>({
      query: (body) => ({
        url: "contacts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contacts"],
    }),
    updateContact: build.mutation<
      Contact,
      { id: string; body: UpdateContactDTO }
    >({
      query: ({ id, body }) => ({
        url: `contacts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Contacts", id }],
    }),
    deleteContact: build.mutation<void, string>({
      query: (id) => ({
        url: `contacts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contacts"],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactApi;
