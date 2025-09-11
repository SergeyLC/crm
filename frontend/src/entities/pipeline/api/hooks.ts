import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { CreatePipelineDTO, UpdatePipelineDTO } from "../model/types";
import { useCallback } from "react";
import {
  pipelineKeys,
  fetchPipelines,
  fetchPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
  fetchUsers,
  fetchGroups,
  assignUsersToPipeline,
  removeUserFromPipeline,
  removeUsersFromPipeline,
  assignGroupsToPipeline,
  removeGroupFromPipeline,
  removeGroupsFromPipeline,
  fetchUserPipelines,
} from "./queries";

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
      queryClient.removeQueries({ queryKey: pipelineKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
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
