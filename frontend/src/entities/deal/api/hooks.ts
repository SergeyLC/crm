import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DealExt, DealStatus } from "@/entities/deal";
import { DealStage } from "@/shared/generated/prisma";
import {
  fetchDeals,
  fetchLostDeals,
  fetchArchivedDeals,
  fetchWonDeals,
  fetchDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} from "./fetches";

import {
  DealActiveQueryKey,
  DealArchivedQueryKey,
  dealKeys,
  DealListQueryKey,
  DealLostQueryKey,
  DealWonQueryKey,
} from "./queryKeys";

import { QueryKeyType } from "@/shared";

type GetDealsChacheParams = {
  enabled?: boolean;
  initialData?: DealExt[];
  placeholderData?: DealExt[];
  queryKey?: QueryKeyType;
};

export const useGetActiveDealsQuery = (
  params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  },
  cacheParams?: GetDealsChacheParams
) => {
  const queryClient = useQueryClient();

  const initialData = cacheParams?.initialData;
  const placeholderData = cacheParams?.placeholderData;
  const enabled = !!(initialData ? false : cacheParams?.enabled ?? true);
  const queryKey = cacheParams?.queryKey || DealActiveQueryKey;
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDeals(params),
    enabled,
    initialData,
    placeholderData,
    staleTime: 0,
  });
  return { useQuery: query, queryKey };
};

export const useGetDealsQuery = (
  params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  },
  cacheParams?: GetDealsChacheParams
) => {
  const queryClient = useQueryClient();

  const initialData = cacheParams?.initialData?.length ? cacheParams?.initialData : undefined;
  const placeholderData = cacheParams?.placeholderData?.length ? cacheParams?.placeholderData : undefined;
  const enabled = !!(initialData ? false : cacheParams?.enabled ?? true);
  const queryKey = cacheParams?.queryKey || DealListQueryKey;
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDeals(params),
    enabled,
    initialData,
    placeholderData,
    staleTime: 0, // Always consider data stale
  });
  return { useQuery: query, queryKey };
};

export const useGetLostDealsQuery = (
  params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  },
  cacheParams?: GetDealsChacheParams
) => {
  const queryClient = useQueryClient();
  const initialData = cacheParams?.initialData?.length ? cacheParams?.initialData : undefined;
  const placeholderData = cacheParams?.placeholderData?.length ? cacheParams?.placeholderData : undefined ;
  const enabled = !!(initialData ? false : cacheParams?.enabled ?? true);
  const queryKey = cacheParams?.queryKey || DealLostQueryKey;
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLostDeals(params),
    enabled,
    initialData,
    placeholderData,
    staleTime: 0,
  });
  return { useQuery: query, queryKey };
};

export const useGetArchivedDealsQuery = (
  params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  },
  cacheParams?: GetDealsChacheParams
) => {
  const queryClient = useQueryClient();
  const initialData = cacheParams?.initialData?.length ? cacheParams?.initialData : undefined;
  const placeholderData = cacheParams?.placeholderData?.length ? cacheParams?.placeholderData : undefined;
  const enabled = !!(initialData ? false : cacheParams?.enabled ?? true);
  const queryKey = cacheParams?.queryKey || DealArchivedQueryKey;
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }
  const query = useQuery({
    queryKey,
    queryFn: () => fetchArchivedDeals(params),
    enabled,
    initialData,
    placeholderData,
    staleTime: 0,
  });
  return { useQuery: query, queryKey };
};

export const useGetWonDealsQuery = (
  params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  },
  cacheParams?: GetDealsChacheParams
) => {
  const queryClient = useQueryClient();
  const initialData = cacheParams?.initialData?.length ? cacheParams?.initialData : undefined;
  const placeholderData = cacheParams?.placeholderData?.length ? cacheParams?.placeholderData : undefined;
  const enabled = !!(initialData ? false : cacheParams?.enabled ?? true);
  const queryKey = cacheParams?.queryKey || DealWonQueryKey;
  // Invalidate the archived deals query if initialData is provided
  // to ensure we fetch the latest data
  if (initialData) {
    queryClient.setQueryData(queryKey, initialData);
  }

  const query = useQuery({
    queryKey,
    queryFn: () => fetchWonDeals(params),
    enabled,
    initialData,
    placeholderData,
    staleTime: 0,
  });
  return { useQuery: query, queryKey };
};

export const useGetDealByIdQuery = (id: string) => {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => fetchDealById(id),
    enabled: !!id,
    staleTime: 0,
  });
};

export const useLazyGetDealByIdQuery = () => {
  const queryClient = useQueryClient();
  return (id: string) => {
    return queryClient.fetchQuery({
      queryKey: dealKeys.detail(id),
      queryFn: () => fetchDealById(id),
    });
  };
};

export const useCreateDealMutation = (
  onSuccess?: (data: unknown) => void | undefined
) => {
  return useMutation({
    mutationFn: createDeal,
    onSuccess,
  });
};

export type UpdateDealMutationOnSuccess = (
  data: unknown,
  variables: unknown
) => void | undefined;
export type UpdateDealMutationOptions = {
  onSuccess?: UpdateDealMutationOnSuccess;
};

export const useUpdateDealMutation = (options?: UpdateDealMutationOptions) => {
  const { onSuccess } = options || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeal,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.id),
      });
      onSuccess?.(data, variables);
    },
  });
};

export const useDeleteDealMutation = (
  onSuccess: (data: unknown) => void | undefined
) => {
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });
};
