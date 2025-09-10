import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { Pipeline, CreatePipelineDTO, User, Group, UpdatePipelineDTO } from "../model/types";
import { apiRequest } from "@/shared/api/apiRequest";
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
  return apiRequest.get("/api/pipelines");
};

export const fetchPipelineById = async (id: string): Promise<Pipeline> => {
  return apiRequest.get(`/api/pipelines/${id}`);
};

export const createPipeline = async (
  data: CreatePipelineDTO
): Promise<Pipeline> => {
  return apiRequest.post("/api/pipelines", data);
};

export const updatePipeline = async (
  id: string,
  data: Partial<CreatePipelineDTO>
): Promise<Pipeline> => {
  return apiRequest.put(`/api/pipelines/${id}`, data);
};

export const deletePipeline = async (id: string): Promise<void> => {
  return apiRequest.delete(`/api/pipelines/${id}`);
};

// User/Group Pipeline Zuweisungen
export const fetchUsers = async (): Promise<User[]> => {
  return apiRequest.get("/api/users");
};

export const fetchGroups = async (): Promise<Group[]> => {
  return apiRequest.get("/api/groups");
};

export const assignUsersToPipeline = async (
  pipelineId: string,
  userIds: string[]
): Promise<void> => {
  return apiRequest.post(`/api/pipelines/${pipelineId}/users`, { userIds });
};

export const removeUserFromPipeline = async (
  pipelineId: string,
  userId: string
): Promise<void> => {
  return apiRequest.delete(`/api/pipelines/${pipelineId}/users/${userId}`);
};

export const removeUsersFromPipeline = async (
  pipelineId: string,
  userIds: string[]
): Promise<void> => {
  return apiRequest.post(`/api/pipelines/${pipelineId}/users/remove`, {
    userIds,
  });
};

export const assignGroupsToPipeline = async (
  pipelineId: string,
  groupIds: string[]
): Promise<void> => {
  return apiRequest.post(`/api/pipelines/${pipelineId}/groups`, { groupIds });
};

export const removeGroupFromPipeline = async (
  pipelineId: string,
  groupId: string
): Promise<void> => {
  return apiRequest.delete(`/api/pipelines/${pipelineId}/groups/${groupId}`);
};

export const removeGroupsFromPipeline = async (
  pipelineId: string,
  groupIds: string[]
): Promise<void> => {
  return apiRequest.post(`/api/pipelines/${pipelineId}/groups/remove`, {
    groupIds,
  });
};

export const fetchUserPipelines = async (
  userId: string
): Promise<Pipeline[]> => {
  return apiRequest.get(`/api/pipelines/user/${userId}`);
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
