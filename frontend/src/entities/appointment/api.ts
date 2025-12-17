import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NEXT_PUBLIC_API_URL } from "@/shared/config/urls";
import { AppointmentExt, CreateAppointmentDTO, UpdateAppointmentDTO } from "./types";

const API_BASE_URL = NEXT_PUBLIC_API_URL || '/api';

// API functions
const fetchAppointments = async (): Promise<AppointmentExt[]> => {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }
  return response.json();
};

const fetchAppointmentById = async (id: string): Promise<AppointmentExt> => {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch appointment');
  }
  return response.json();
};

const createAppointment = async (body: CreateAppointmentDTO): Promise<AppointmentExt> => {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to create appointment');
  }
  return response.json();
};

const updateAppointment = async ({ id, body }: { id: string; body: UpdateAppointmentDTO }): Promise<AppointmentExt> => {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update appointment');
  }
  return response.json();
};

const deleteAppointment = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to delete appointment');
  }
};

// Query keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// Hooks
export const useGetAppointmentsQuery = () => {
  return useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: fetchAppointments,
  });
};

export const useGetAppointmentByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => fetchAppointmentById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
};

export const useUpdateAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
    },
  });
};

export const useDeleteAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
};
