import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AppointmentExt, CreateAppointmentDTO, UpdateAppointmentDTO } from "./types";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

export const appointmentApi = createApi({
  reducerPath: "appointmentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: NEXT_PUBLIC_BACKEND_API_URL,
    credentials: "include",
  }),
  tagTypes: ["Appointments"],
  endpoints: (build) => ({
    getAppointments: build.query<AppointmentExt[], void>({
      query: () => "appointments",
      providesTags: ["Appointments"],
    }),
    getAppointmentById: build.query<AppointmentExt, string>({
      query: (id) => `appointments/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Appointments", id }],
    }),
    createAppointment: build.mutation<AppointmentExt, CreateAppointmentDTO>({
      query: (body) => ({
        url: "appointments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),
    updateAppointment: build.mutation<
      AppointmentExt,
      { id: string; body: UpdateAppointmentDTO }
    >({
      query: ({ id, body }) => ({
        url: `appointments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Appointments", id },
      ],
    }),
    deleteAppointment: build.mutation<void, string>({
      query: (id) => ({
        url: `appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useGetAppointmentByIdQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
} = appointmentApi;