import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Deal,
  DealExt,
  CreateDealDTO,
  UpdateDealDTO,
  DealStatus,
} from "@/entities/deal/model/types";
import { DealStage } from "@/shared/generated/prisma-client";

// API functions
const fetchDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set('statuses', params.statuses.join(','));
  if (params?.excludeStatuses) searchParams.set('excludeStatuses', params.excludeStatuses.join(','));
  if (params?.stages) searchParams.set('stages', params.stages.join(','));
  if (params?.excludeStages) searchParams.set('excludeStages', params.excludeStages.join(','));

  const response = await fetch(`/api/deals?${searchParams}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
};

const fetchLostDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set('statuses', params.statuses.join(','));
  if (params?.excludeStatuses) searchParams.set('excludeStatuses', params.excludeStatuses.join(','));
  if (params?.stages) searchParams.set('stages', params.stages.join(','));
  if (params?.excludeStages) searchParams.set('excludeStages', params.excludeStages.join(','));

  const response = await fetch(`/api/deals/lost?${searchParams}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch lost deals');
  return response.json();
};

const fetchArchivedDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set('statuses', params.statuses.join(','));
  if (params?.excludeStatuses) searchParams.set('excludeStatuses', params.excludeStatuses.join(','));
  if (params?.stages) searchParams.set('stages', params.stages.join(','));
  if (params?.excludeStages) searchParams.set('excludeStages', params.excludeStages.join(','));

  const response = await fetch(`/api/deals/archived?${searchParams}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch archived deals');
  return response.json();
};

const fetchWonDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set('statuses', params.statuses.join(','));
  if (params?.excludeStatuses) searchParams.set('excludeStatuses', params.excludeStatuses.join(','));
  if (params?.stages) searchParams.set('stages', params.stages.join(','));
  if (params?.excludeStages) searchParams.set('excludeStages', params.excludeStages.join(','));

  const response = await fetch(`/api/deals/won?${searchParams}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch won deals');
  return response.json();
};

// const fetchActiveDeals = async (params?: {
//   statuses?: DealStatus[];
//   excludeStatuses?: DealStatus[];
//   stages?: DealStage[];
//   excludeStages?: DealStage[];
// }): Promise<DealExt[]> => {
//   const searchParams = new URLSearchParams();
//   if (params?.statuses) searchParams.set('statuses', params.statuses.join(','));
//   if (params?.excludeStatuses) searchParams.set('excludeStatuses', params.excludeStatuses.join(','));
//   if (params?.stages) searchParams.set('stages', params.stages.join(','));
//   if (params?.excludeStages) searchParams.set('excludeStages', params.excludeStages.join(','));

//   const response = await fetch(`/api/deals/active?${searchParams}`, {
//     credentials: 'include',
//   });
//   if (!response.ok) throw new Error('Failed to fetch active deals');
//   return response.json();
// };

const fetchDealById = async (id: string): Promise<DealExt> => {
  const response = await fetch(`/api/deals/${id}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch deal');
  return response.json();
};

const createDeal = async (data: CreateDealDTO): Promise<Deal> => {
  const response = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create deal');
  return response.json();
};

const updateDeal = async ({ id, body }: { id: string; body: UpdateDealDTO }): Promise<Deal> => {
  const response = await fetch(`/api/deals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to update deal');
  return response.json();
};

const deleteDeal = async (id: string): Promise<void> => {
  const response = await fetch(`/api/deals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete deal');
};

// Query keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  }) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

export const useGetActiveDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}, enabled = true) => {
  return useQuery({
    queryKey: [...dealKeys.lists(), "active", params],
    queryFn: () => fetchDeals(params),
    enabled,
    staleTime: 0,
  });
};

export const useGetDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}, enabled = true) => {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => fetchDeals(params),
    enabled,
    staleTime: 0, // Always consider data stale
  });
};

export const useGetLostDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}, enabled = true) => {
  return useQuery({
    queryKey: [...dealKeys.lists(), 'lost', params],
    queryFn: () => fetchLostDeals(params),
    enabled,
    staleTime: 0,
  });
};

export const useGetArchivedDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}, enabled = true) => {
  return useQuery({
    queryKey: [...dealKeys.lists(), 'archived', params],
    queryFn: () => fetchArchivedDeals(params),
    enabled,
    staleTime: 0,
  });
};

export const useGetWonDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}, enabled = true) => {
  return useQuery({
    queryKey: [...dealKeys.lists(), 'won', params],
    queryFn: () => fetchWonDeals(params),
    enabled,
    staleTime: 0,
  });
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

export const useCreateDealMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
};

export const useUpdateDealMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
};

export const useDeleteDealMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
};
