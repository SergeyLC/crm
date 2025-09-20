import { DealStatus } from "@/entities/deal";
import { DealStage } from "@/shared/generated/prisma";

// Query keys
export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (params?: {
    statuses?: DealStatus[];
    excludeStatuses?: DealStatus[];
    stages?: DealStage[];
    excludeStages?: DealStage[];
  }) => [...dealKeys.lists(), params].filter(Boolean),
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

export const DealListQueryKey = [...dealKeys.list()] as const;
export const DealActiveQueryKey = [
  ...dealKeys.list(),
  { active: true },
] as const;
export const DealArchivedQueryKey = [
  ...dealKeys.list(),
  { archived: true },
] as const;
export const DealWonQueryKey = [...dealKeys.list(), { won: true }] as const;
export const DealLostQueryKey = [...dealKeys.list(), { lost: true }] as const;
