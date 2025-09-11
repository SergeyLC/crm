import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { Pipeline, CreatePipelineDTO, User, Group, UpdatePipelineDTO } from "../model/types";
import { useCallback } from "react";

// Query Keys für Caching und Invalidierung
export const pipelineKeys = {
  all: ["pipelines"] as const,
  lists: () => [...pipelineKeys.all, "list"] as const,
  list: (filters: string) => [...pipelineKeys.lists(), { filters }] as const,
  details: () => [...pipelineKeys.all, "detail"] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
  userPipelines: () => [...pipelineKeys.all, "user"] as const,
  userPipelinesById: (userId: string) =>
    [...pipelineKeys.all, "user", userId] as const,
  users: () => ["users"] as const,
  groups: () => ["groups"] as const,
};

// API-Funktionen

// Pipeline API-Funktionen
export const fetchPipelines = async (): Promise<Pipeline[]> => {
    console.log("Fetching pipelines from API:", `$/api/pipelines`);
  const response = await fetch(`/api/pipelines`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch pipelines");
  }
  return response.json();
};

export const fetchPipelineById = async (id: string): Promise<Pipeline> => {
  const response = await fetch(`/api/pipelines/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch pipeline");
  }
  return response.json();
};

export const createPipeline = async (
  data: CreatePipelineDTO
): Promise<Pipeline> => {
  const response = await fetch("/api/pipelines", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create pipeline");
  }
  return response.json();
};

export const updatePipeline = async (
  id: string,
  data: Partial<CreatePipelineDTO>
): Promise<Pipeline> => {
  const response = await fetch(`/api/pipelines/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update pipeline");
  }
  return response.json();
};

export const deletePipeline = async (id: string): Promise<void> => {
  const response = await fetch(`/api/pipelines/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete pipeline");
  }
};

// User/Group Pipeline Zuweisungen
export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export const fetchGroups = async (): Promise<Group[]> => {
  const response = await fetch("/api/groups", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  return response.json();
};

export const assignUsersToPipeline = async (
  pipelineId: string,
  userIds: string[]
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to assign users to pipeline");
  }
};

export const removeUserFromPipeline = async (
  pipelineId: string,
  userId: string
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to remove user from pipeline");
  }
};

export const removeUsersFromPipeline = async (
  pipelineId: string,
  userIds: string[]
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/users/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to remove users from pipeline");
  }
};

export const assignGroupsToPipeline = async (
  pipelineId: string,
  groupIds: string[]
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ groupIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to assign groups to pipeline");
  }
};

export const removeGroupFromPipeline = async (
  pipelineId: string,
  groupId: string
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/groups/${groupId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to remove group from pipeline");
  }
};

export const removeGroupsFromPipeline = async (
  pipelineId: string,
  groupIds: string[]
): Promise<void> => {
  const response = await fetch(`/api/pipelines/${pipelineId}/groups/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ groupIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to remove groups from pipeline");
  }
};

export const fetchUserPipelines = async (
  userId: string
): Promise<Pipeline[]> => {
  const response = await fetch(`/api/pipelines/user/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user pipelines");
  }
  return response.json();
};

// React Query Hooks

// Alle Pipelines abrufen (Admin)
export const useAllPipelines = () => {
  return useQuery({
    queryKey: pipelineKeys.lists(),
    queryFn: fetchPipelines,
  });
};

// Pipeline nach ID abrufen
export const usePipeline = (id?: string, enabled?: boolean) => {
  return useQuery({
    queryKey: pipelineKeys.detail(id ?? ""),
    queryFn: () => fetchPipelineById(id ?? ""),
    enabled: !!id && enabled !== false,
  });   
};

// Pipeline erstellen
export const useCreatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
};

/**
 * "Lazy" Version von useCreatePipeline
 * Gibt Mutation-Objekt und eine Ausführungsfunktion zurück, die man später aufrufen kann
 */
export const useLazyCreatePipeline = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });

  const executeMutation = useCallback(
    (data: CreatePipelineDTO) => {
      return mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    ...mutation,
    execute: executeMutation,
  };
};

// Pipeline aktualisieren
export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePipelineDTO | UpdatePipelineDTO>;
    }) => updatePipeline(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
};

// Pipeline löschen
export const useDeletePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePipeline,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(id) });
    },
  });
};

/**
 * "Lazy" Version von useDeletePipeline
 * Gibt Mutation-Objekt und eine Ausführungsfunktion zurück, die man später aufrufen kann
 */
export const useLazyDeletePipeline = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deletePipeline,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(id) });
    },
  });

  const executeMutation = useCallback(
    (id: string) => {
      return mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    ...mutation,
    execute: executeMutation,
  };
};

// Alle Benutzer abrufen
export const useAllUsers = () => {
  return useQuery({
    queryKey: pipelineKeys.users(),
    queryFn: fetchUsers,
  });
};

// Alle Gruppen abrufen
export const useAllGroups = () => {
  return useQuery({
    queryKey: pipelineKeys.groups(),
    queryFn: fetchGroups,
  });
};

// Benutzer zu Pipeline zuweisen
export const useAssignUsersToPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      userIds,
    }: {
      pipelineId: string;
      userIds: string[];
    }) => assignUsersToPipeline(pipelineId, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
    },
  });
};

// Benutzer von Pipeline entfernen
export const useRemoveUserFromPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      userId,
    }: {
      pipelineId: string;
      userId: string;
    }) => removeUserFromPipeline(pipelineId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
    },
  });
};

// Mehrere Benutzer von Pipeline entfernen
export const useRemoveUsersFromPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      userIds,
    }: {
      pipelineId: string;
      userIds: string[];
    }) => removeUsersFromPipeline(pipelineId, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
};

// Gruppen zu Pipeline zuweisen
export const useAssignGroupsToPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      groupIds,
    }: {
      pipelineId: string;
      groupIds: string[];
    }) => assignGroupsToPipeline(pipelineId, groupIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
    },
  });
};

// Gruppe von Pipeline entfernen
export const useRemoveGroupFromPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      groupId,
    }: {
      pipelineId: string;
      groupId: string;
    }) => removeGroupFromPipeline(pipelineId, groupId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
    },
  });
};

// Mehrere Gruppen von Pipeline entfernen
export const useRemoveGroupsFromPipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      groupIds,
    }: {
      pipelineId: string;
      groupIds: string[];
    }) => removeGroupsFromPipeline(pipelineId, groupIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
    },
  });
};

// Pipeline für aktuellen Benutzer abrufen
export const useUserPipelines = (
  userId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: pipelineKeys.userPipelines(),
    queryFn: () => fetchUserPipelines(userId),
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
  });
};

// Hilfsfunktion für serverseitiges Prefetching
export const prefetchPipeline = async (
  queryClient: QueryClient,
  id: string
): Promise<void> => {
  await queryClient.prefetchQuery({
    queryKey: pipelineKeys.detail(id),
    queryFn: () => fetchPipelineById(id),
  });
};

export const prefetchPipelines = async (
  queryClient: QueryClient
): Promise<void> => {
  await queryClient.prefetchQuery({
    queryKey: pipelineKeys.lists(),
    queryFn: fetchPipelines,
  });
};

export const prefetchPipelinesByUserId = async (
  queryClient: QueryClient,
  userId: string
): Promise<void> => {
  await queryClient.prefetchQuery({
    queryKey: pipelineKeys.userPipelinesById(userId),
    queryFn: () => fetchUserPipelines(userId),
  });
};
