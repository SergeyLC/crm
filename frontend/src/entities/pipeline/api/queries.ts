import { Pipeline, CreatePipelineDTO, User, Group } from "../model/types";

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
    console.log("Fetching pipelines from API:", `/api/pipelines`);
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

// Re-export all hooks from the hooks file
export * from './hooks';
