// Query keys
export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
};

export const LeadListQueryKey = [...leadKeys.lists()] as const;
export const LeadActiveQueryKey = [
  ...leadKeys.lists(),
  { active: true },
] as const;
export const LeadArchivedQueryKey = [
  ...leadKeys.lists(),
  { archived: true },
] as const;
