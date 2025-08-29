import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { NoteExt, CreateNoteDTO, UpdateNoteDTO } from "./types";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

export const noteApi = createApi({
  reducerPath: "noteApi",
  baseQuery: fetchBaseQuery({
    baseUrl: NEXT_PUBLIC_BACKEND_API_URL,
    credentials: "include",
  }),
  tagTypes: ["Notes"],
  endpoints: (build) => ({
    getNotes: build.query<NoteExt[], void>({
      query: () => "notes",
      providesTags: ["Notes"],
    }),
    getNoteById: build.query<NoteExt, string>({
      query: (id) => `notes/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Notes", id }],
    }),
    createNote: build.mutation<NoteExt, CreateNoteDTO>({
      query: (body) => ({
        url: "notes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notes"],
    }),
    updateNote: build.mutation<NoteExt, { id: string; body: UpdateNoteDTO }>({
      query: ({ id, body }) => ({
        url: `notes/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Notes", id }],
    }),
    deleteNote: build.mutation<void, string>({
      query: (id) => ({
        url: `notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notes"],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useGetNoteByIdQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = noteApi;