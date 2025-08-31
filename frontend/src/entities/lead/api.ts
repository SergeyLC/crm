import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";
import {
  Lead,
  LeadExt,
  CreateLeadDTO,
  UpdateLeadDTO,
} from "@/entities/lead/types";

export const leadApiReducerPath = "leadApi";

export const leadApi = createApi({
  reducerPath: "leadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: NEXT_PUBLIC_BACKEND_API_URL || '/api',
    credentials: "include",
  }),
  tagTypes: ["Leads", "Lead"],
  endpoints: (build) => ({
    getLeads: build.query<LeadExt[], void>({
      query: () => "leads",
      providesTags: ["Leads"],
    }),
    getArchivedLeads: build.query<LeadExt[], void>({
      query: () => "leads/archived",
      providesTags: ["Leads"],
    }),
    getLeadById: build.query<LeadExt, string>({
      query: (id) => `leads/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Lead", id }],
    }),
    createLead: build.mutation<Lead, CreateLeadDTO>({
      query: (body) => ({
        url: "leads",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leads"],
    }),
    updateLead: build.mutation<Lead, { id: string; body: UpdateLeadDTO }>({
      query: ({ id, body }) => ({
        url: `leads/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Leads", id }],
    }),
    deleteLead: build.mutation<void, string>({
      query: (id) => ({
        url: `leads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leads"],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetArchivedLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useLazyGetLeadByIdQuery,
} = leadApi;
