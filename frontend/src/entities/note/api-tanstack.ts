import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NEXT_PUBLIC_API_URL } from "@/shared/config/urls";
import { NoteExt, CreateNoteDTO, UpdateNoteDTO } from "./types";

const API_BASE_URL = NEXT_PUBLIC_API_URL || '/api';

// API functions
const fetchNotes = async (): Promise<NoteExt[]> => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

const fetchNoteById = async (id: string): Promise<NoteExt> => {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
};

const createNote = async (body: CreateNoteDTO): Promise<NoteExt> => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
};

const updateNote = async ({ id, body }: { id: string; body: UpdateNoteDTO }): Promise<NoteExt> => {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update note');
  }
  return response.json();
};

const deleteNote = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
};

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

// Hooks
export const useGetNotesQuery = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: fetchNotes,
  });
};

export const useGetNoteByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => fetchNoteById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};

export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
    },
  });
};

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};
