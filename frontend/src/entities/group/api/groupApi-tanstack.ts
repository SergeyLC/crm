import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  Group,
  GroupsResponse,
  CreateGroupDTO,
  UpdateGroupDTO,
  GroupMember,
  GroupRole,
} from "../model/types";
import { UsersResponse, UserExt } from '@/entities/user';
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

const deleteGroup = async (id: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: 'DELETE',
    credentials: "include",
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    // Try to read a JSON error body, otherwise read text
  let errorBody: unknown = null;
    try {
      if (contentType.includes('application/json')) {
    errorBody = await response.json();
      } else {
        const text = await response.text();
    errorBody = { message: text };
      }
  } catch {
    // ignore parse errors
    }
    let message = 'Failed to delete group';
    try {
      if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
    message = String((errorBody as Record<string, unknown>).message as string);
      }
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  // On success, return parsed JSON if present so callers can show backend messages
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return { message: 'Group deleted' };
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
    // Keep previous data while refetching to avoid UI briefly falling back to parent props
    keepPreviousData: true,
  } as UseQueryOptions<Group, Error, Group, ReturnType<typeof groupKeys.detail>>);
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
    // Optimistic update: immediately add member to group's detail cache
    onMutate: async (variables: { groupId: string; userId: string }) => {
      const { groupId, userId } = variables;

      await queryClient.cancelQueries({ queryKey: groupKeys.detail(groupId) });
      await queryClient.cancelQueries({ queryKey: groupKeys.lists() });

      const previousGroup = queryClient.getQueryData<Group>(groupKeys.detail(groupId));
      const previousList = queryClient.getQueryData<GroupsResponse>(groupKeys.lists());

      // Try to get user info from users cache to build a GroupMember preview
  const usersCache = queryClient.getQueryData<UsersResponse>(['users', 'list']);
  const newUser: UserExt | { id: string; name: string; email: string } = usersCache?.find((u) => u.id === userId) || { id: userId, name: '…', email: '' };

      const optimisticMember: Partial<GroupMember> = {
        id: `optimistic-${userId}`,
        groupId,
        userId,
  user: newUser as UserExt,
        joinedAt: new Date().toISOString(),
        role: GroupRole.MEMBER,
      };

      if (previousGroup) {
        queryClient.setQueryData<Group>(groupKeys.detail(groupId), {
          ...previousGroup,
          members: [...previousGroup.members, optimisticMember as GroupMember],
        });
      }

      // Also optimistically update the groups list if present
      if (previousList) {
        queryClient.setQueryData<GroupsResponse>(groupKeys.lists(),
          previousList.map((g) =>
            g.id === groupId ? { ...g, members: [...g.members, optimisticMember as GroupMember] } : g
          )
        );
      }

      return { previousGroup, previousList };
    },
    onError: (err, variables, context: { previousGroup?: Group; previousList?: GroupsResponse } | undefined) => {
      const { groupId } = variables as { groupId: string; userId: string };
      if (context?.previousGroup) {
        queryClient.setQueryData<Group>(groupKeys.detail(groupId), context.previousGroup);
      }
      if (context?.previousList) {
        queryClient.setQueryData<GroupsResponse>(groupKeys.lists(), context.previousList);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useRemoveGroupMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeGroupMember,
    // Optimistic update: immediately remove member from group's detail cache
    onMutate: async (variables: { groupId: string; userId: string }) => {
      const { groupId, userId } = variables;

      await queryClient.cancelQueries({ queryKey: groupKeys.detail(groupId) });
      await queryClient.cancelQueries({ queryKey: groupKeys.lists() });

      const previousGroup = queryClient.getQueryData<Group>(groupKeys.detail(groupId));
      const previousList = queryClient.getQueryData<GroupsResponse>(groupKeys.lists());

      if (previousGroup) {
        queryClient.setQueryData<Group>(groupKeys.detail(groupId), {
          ...previousGroup,
          members: previousGroup.members.filter((m) => m.userId !== userId),
        });
      }

      if (previousList) {
        queryClient.setQueryData<GroupsResponse>(groupKeys.lists(),
          previousList.map((g) =>
            g.id === groupId ? { ...g, members: g.members.filter((m) => m.userId !== userId) } : g
          )
        );
      }

      return { previousGroup, previousList };
    },
    onError: (err, variables, context: { previousGroup?: Group; previousList?: GroupsResponse } | undefined) => {
      const { groupId } = variables as { groupId: string; userId: string };
      if (context?.previousGroup) {
        queryClient.setQueryData<Group>(groupKeys.detail(groupId), context.previousGroup);
      }
      if (context?.previousList) {
        queryClient.setQueryData<GroupsResponse>(groupKeys.lists(), context.previousList);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};
