import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  UserExt,
  UsersResponse,
  CreateUserDTO,
  UpdateUserDTO,
  UserStatus
} from "../model/types";
import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";

const API_BASE_URL = NEXT_PUBLIC_BACKEND_API_URL || '/api';

// API functions
const fetchUsers = async (): Promise<UsersResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const fetchUserById = async (id: string): Promise<UserExt> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
};

const createUser = async (userData: CreateUserDTO): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
};

const updateUser = async ({ id, body }: { id: string; body: UpdateUserDTO }): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
};

const updateUserStatus = async ({ id, status }: { id: string; status: UserStatus }): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update user status');
  }
  return response.json();
};

const blockUser = async (id: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}/block`, {
    method: 'PATCH',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to block user');
  }
  return response.json();
};

const unblockUser = async (id: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}/unblock`, {
    method: 'PATCH',
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error('Failed to unblock user');
  }
  return response.json();
};

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hooks
export const useGetUsersQuery = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
    enabled,
  });
};

export const useGetUserByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUserById(id),
    enabled: !!id && enabled,
  });
};

export const useLazyGetUserByIdQuery = () => {
  const queryClient = useQueryClient();

  return async (id: string): Promise<UserExt | undefined> => {
    const data = queryClient.getQueryData<UsersResponse>(userKeys.lists());
    const user = data?.find((user: UserExt) => user.id === id);

    if (user) {
      return user;
    }

    // If not in cache, fetch it
    try {
      return await fetchUserById(id);
    } catch (error) {
      console.error('Failed to fetch user by id:', error);
      return undefined;
    }
  };
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
};

export const useUpdateUserStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserStatus,
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData<UsersResponse>(userKeys.lists());
      const previousUser = queryClient.getQueryData<UserExt>(userKeys.detail(id));

      // Optimistically update the cache
      if (previousUsers) {
        queryClient.setQueryData<UsersResponse>(userKeys.lists(), 
          previousUsers.map((user: UserExt) =>
            user.id === id ? { ...user, status } : user
          )
        );
      }

      if (previousUser) {
        queryClient.setQueryData<UserExt>(userKeys.detail(id), {
          ...previousUser,
          status,
        });
      }

      return { previousUsers, previousUser };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(variables.id), context.previousUser);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
};

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: blockUser,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData<UsersResponse>(userKeys.lists());
      const previousUser = queryClient.getQueryData<UserExt>(userKeys.detail(id));

      // Optimistically update the cache
      if (previousUsers) {
        queryClient.setQueryData<UsersResponse>(userKeys.lists(), 
          previousUsers.map((user: UserExt) =>
            user.id === id ? { ...user, status: "BLOCKED" as UserStatus } : user
          )
        );
      }

      if (previousUser) {
        queryClient.setQueryData<UserExt>(userKeys.detail(id), {
          ...previousUser,
          status: "BLOCKED" as UserStatus,
        });
      }

      return { previousUsers, previousUser };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
    },
    onSettled: (data, error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unblockUser,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData<UsersResponse>(userKeys.lists());
      const previousUser = queryClient.getQueryData<UserExt>(userKeys.detail(id));

      // Optimistically update the cache
      if (previousUsers) {
        queryClient.setQueryData<UsersResponse>(userKeys.lists(), 
          previousUsers.map((user: UserExt) =>
            user.id === id ? { ...user, status: "ACTIVE" as UserStatus } : user
          )
        );
      }

      if (previousUser) {
        queryClient.setQueryData<UserExt>(userKeys.detail(id), {
          ...previousUser,
          status: "ACTIVE" as UserStatus,
        });
      }

      return { previousUsers, previousUser };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
    },
    onSettled: (data, error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
};
