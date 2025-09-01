import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";
import {
  Lead,
  LeadExt,
  CreateLeadDTO,
  UpdateLeadDTO,
} from "@/entities/lead/types";

const API_BASE_URL = NEXT_PUBLIC_BACKEND_API_URL || '/api';

// API functions
const fetchLeads = async (): Promise<LeadExt[]> => {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }
  return response.json();
};

const fetchArchivedLeads = async (): Promise<LeadExt[]> => {
  const response = await fetch(`${API_BASE_URL}/leads/archived`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch archived leads');
  }
  return response.json();
};

const fetchLeadById = async (id: string): Promise<LeadExt> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch lead');
  }
  return response.json();
};

const createLead = async (body: CreateLeadDTO): Promise<Lead> => {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to create lead');
  }
  return response.json();
};

const updateLead = async ({ id, body }: { id: string; body: UpdateLeadDTO }): Promise<Lead> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update lead');
  }
  return response.json();
};

const deleteLead = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to delete lead');
  }
};

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  archived: () => [...leadKeys.all, 'archived'] as const,
};

// Hooks
export const useGetLeadsQuery = (enabled = true) => {
  return useQuery({
    queryKey: leadKeys.lists(),
    queryFn: fetchLeads,
    enabled,
  });
};

export const useGetArchivedLeadsQuery = (enabled = true) => {
  return useQuery({
    queryKey: leadKeys.archived(),
    queryFn: fetchArchivedLeads,
    enabled,
  });
};

export const useGetLeadByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => fetchLeadById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.archived() });
    },
  });
};

export const useUpdateLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLead,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.archived() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) });
    },
  });
};

export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.archived() });
    },
  });
};

export const useLazyGetLeadByIdQuery = () => {
  const queryClient = useQueryClient();

  return async (id: string): Promise<LeadExt | undefined> => {
    const data = queryClient.getQueryData<LeadExt[]>(leadKeys.lists());
    const lead = data?.find((lead) => lead.id === id);

    if (lead) {
      return lead;
    }

    // If not in cache, fetch it
    try {
      return await fetchLeadById(id);
    } catch (error) {
      console.error('Failed to fetch lead by id:', error);
      return undefined;
    }
  };
};
