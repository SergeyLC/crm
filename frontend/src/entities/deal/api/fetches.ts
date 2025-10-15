import {
  Deal,
  DealExt,
  CreateDealDTO,
  UpdateDealDTO,
  DealStatus,
} from "@/entities/deal";
import { DealStage } from "@/shared/generated/prisma";

// API functions
export const fetchDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set("statuses", params.statuses.join(","));
  if (params?.excludeStatuses)
    searchParams.set("excludeStatuses", params.excludeStatuses.join(","));
  if (params?.stages) searchParams.set("stages", params.stages.join(","));
  if (params?.excludeStages)
    searchParams.set("excludeStages", params.excludeStages.join(","));

  const response = await fetch(`/api/deals?${searchParams}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch deals");
  return response.json();
};

export const fetchLostDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set("statuses", params.statuses.join(","));
  if (params?.excludeStatuses)
    searchParams.set("excludeStatuses", params.excludeStatuses.join(","));
  if (params?.stages) searchParams.set("stages", params.stages.join(","));
  if (params?.excludeStages)
    searchParams.set("excludeStages", params.excludeStages.join(","));

  const response = await fetch(`/api/deals/lost?${searchParams}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch lost deals");
  return response.json();
};

export const fetchArchivedDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set("statuses", params.statuses.join(","));
  if (params?.excludeStatuses)
    searchParams.set("excludeStatuses", params.excludeStatuses.join(","));
  if (params?.stages) searchParams.set("stages", params.stages.join(","));
  if (params?.excludeStages)
    searchParams.set("excludeStages", params.excludeStages.join(","));

  const response = await fetch(`/api/deals/archived?${searchParams}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch archived deals");
  return response.json();
};

export const fetchWonDeals = async (params?: {
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
  stages?: DealStage[];
  excludeStages?: DealStage[];
}): Promise<DealExt[]> => {
  const searchParams = new URLSearchParams();
  if (params?.statuses) searchParams.set("statuses", params.statuses.join(","));
  if (params?.excludeStatuses)
    searchParams.set("excludeStatuses", params.excludeStatuses.join(","));
  if (params?.stages) searchParams.set("stages", params.stages.join(","));
  if (params?.excludeStages)
    searchParams.set("excludeStages", params.excludeStages.join(","));

  const response = await fetch(`/api/deals/won?${searchParams}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch won deals");
  return response.json();
};

export const fetchDealById = async (id: string): Promise<DealExt> => {
  const response = await fetch(`/api/deals/${id}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch deal");
  return response.json();
};

export const createDeal = async (data: CreateDealDTO): Promise<Deal> => {
  const response = await fetch("/api/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create deal", { cause: await response.json() });
  }
  return response.json();
};

export const updateDeal = async ({
  id,
  body,
}: {
  id: string;
  body: UpdateDealDTO;
}): Promise<Deal> => {
  const response = await fetch(`/api/deals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Failed to update deal", { cause: await response.json() });
  }
  return response.json();
};

export const deleteDeal = async (id: string): Promise<void> => {
  const response = await fetch(`/api/deals/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete deal");
};
