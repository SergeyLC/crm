import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeadExt } from "@/entities/lead";
import {
  fetchLeads,
  fetchArchivedLeads,
  fetchLeadById,
  createLead,
  updateLead,
  deleteLead,
} from "./fetches";
import { QueryKeyType } from "@/shared/api";
import {
  leadKeys,
  LeadActiveQueryKey,
  LeadArchivedQueryKey,
} from "./queryKeys";

// Query keys
type GetLeadsCacheParams = {
  enabled?: boolean;
  initialData?: LeadExt[];
  queryKey?: QueryKeyType;
};

// Hooks
export const useGetLeadsQuery = (params?: GetLeadsCacheParams) => {
  const { initialData = undefined } = params || {};
  const enabled = params?.enabled && !initialData ? true : false;
  const queryKey = params?.queryKey || LeadActiveQueryKey;
  const queryClient = useQueryClient();
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: fetchLeads,
    enabled,
    initialData,
  });
  return { useQuery: query, queryKey };
};

export const useGetArchivedLeadsQuery = (params?: GetLeadsCacheParams) => {
  const { initialData = undefined } = params || {};
  const enabled = params?.enabled && !initialData ? true : false;
  const queryKey = params?.queryKey || LeadArchivedQueryKey;
  const queryClient = useQueryClient();
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: fetchArchivedLeads,
    enabled,
    initialData,
  });
  return { useQuery: query, queryKey };
};

export const useGetLeadByIdQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => fetchLeadById(id),
    enabled: !!id && enabled,
  });
};

export type UpdateLeadMutationOnSuccess = (
  data: unknown,
  variables: unknown
) => void | undefined;

export type UpdateLeadMutationOptions = {
  onSuccess?: UpdateLeadMutationOnSuccess;
};

export const useCreateLeadMutation = (
  onSuccess?: (data: unknown) => void | undefined
) => {
  return useMutation({
    mutationFn: createLead,
    onSuccess,
  });
};

export const useUpdateLeadMutation = (params?: UpdateLeadMutationOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess } = params || {};
  return useMutation({
    mutationFn: updateLead,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: leadKeys.detail(variables.id),
      });
      onSuccess?.(data, variables);
    },
  });
};

export const useDeleteLeadMutation = (
  onSuccess: (data: unknown) => void | undefined
) => {
  return useMutation({
    mutationFn: deleteLead,
    onSuccess,
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

    try {
      return await fetchLeadById(id);
    } catch (error) {
      console.error("Failed to fetch lead by id:", error);
      return undefined;
    }
  };
};
