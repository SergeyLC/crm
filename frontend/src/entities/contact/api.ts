import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NEXT_PUBLIC_API_URL } from "@/shared/config/urls";
import {
  Contact,
  ContactExt,
  UpdateContactDTO,
  CreateContactDTO,
} from "./types";

const API_BASE_URL = NEXT_PUBLIC_API_URL ? `${NEXT_PUBLIC_API_URL}/api` : '/api';

// API functions
const fetchContacts = async (): Promise<ContactExt[]> => {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }
  return response.json();
};

const fetchContactById = async (id: string): Promise<Contact> => {
  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contact');
  }
  return response.json();
};

const createContact = async (body: CreateContactDTO): Promise<Contact> => {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to create contact');
  }
  return response.json();
};

const updateContact = async ({ id, body }: { id: string; body: UpdateContactDTO }): Promise<Contact> => {
  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update contact');
  }
  return response.json();
};

const deleteContact = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to delete contact');
  }
};

// Query keys
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// Hooks
export const useGetContactsQuery = () => {
  return useQuery({
    queryKey: contactKeys.lists(),
    queryFn: fetchContacts,
  });
};

export const useGetContactByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => fetchContactById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateContactMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};

export const useUpdateContactMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
    },
  });
};

export const useDeleteContactMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};
