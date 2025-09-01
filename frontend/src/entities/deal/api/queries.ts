import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Deal,
  DealExt,
  CreateDealDTO,
  UpdateDealDTO,
  DealStatus,
  DealStage,
} from '@/entities/deal/model/types';

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

// Hooks
export const useGetDealsQuery = (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}) => {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => fetchDeals(params),
  });
};

export const useGetDealByIdQuery = (id: string) => {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => fetchDealById(id),
    enabled: !!id,
  });
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
