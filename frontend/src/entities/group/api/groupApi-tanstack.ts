import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Group,
  GroupsResponse,
  CreateGroupDTO,
  UpdateGroupDTO,
  GroupMember,
} from "../model/types";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

const API_BASE_URL = NEXT_PUBLIC_BACKEND_API_URL || '/api';

// API functions
const fetchGroups = async (): Promise<GroupsResponse> => {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  return response.json();
};

const fetchGroupById = async (id: string): Promise<Group> => {
  const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch group');
  }
  return response.json();
};

const createGroup = async (groupData: CreateGroupDTO): Promise<Group> => {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(groupData),
  });
  if (!response.ok) {
    throw new Error('Failed to create group');
  }
  return response.json();
};

const updateGroup = async ({ id, body }: { id: string; body: UpdateGroupDTO }): Promise<Group> => {
  const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update group');
  }
  return response.json();
};

const deleteGroup = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to delete group');
  }
};

const addGroupMember = async ({ groupId, userId }: { groupId: string; userId: string }): Promise<GroupMember> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error('Failed to add group member');
  }
  return response.json();
};

const removeGroupMember = async ({ groupId, userId }: { groupId: string; userId: string }): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to remove group member');
  }
};

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

// Hooks
export const useGetGroupsQuery = (enabled = true) => {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: fetchGroups,
    enabled,
  });
};

export const useGetGroupByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => fetchGroupById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useUpdateGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.id) });
    },
  });
};

export const useDeleteGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useAddGroupMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addGroupMember,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
    },
  });
};

export const useRemoveGroupMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeGroupMember,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
    },
  });
};
