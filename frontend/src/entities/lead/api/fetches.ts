import { Lead, LeadExt, CreateLeadDTO, UpdateLeadDTO } from "@/entities/lead";

const API_BASE_URL = "/api";

// API functions
export const fetchLeads = async (): Promise<LeadExt[]> => {
  console.log(`fetchLeads from API: ${API_BASE_URL}/leads`);
  const response = await fetch(`${API_BASE_URL}/leads`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }
  return response.json();
};

export const fetchArchivedLeads = async (): Promise<LeadExt[]> => {
  const response = await fetch(`${API_BASE_URL}/leads/archived`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch archived leads");
  }
  return response.json();
};

export const fetchLeadById = async (id: string): Promise<LeadExt> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch lead");
  }
  return response.json();
};

export const createLead = async (body: CreateLeadDTO): Promise<Lead> => {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Failed to create lead", { cause: await response.json() });
  }
  return response.json();
};

export const updateLead = async ({
  id,
  body,
}: {
  id: string;
  body: UpdateLeadDTO;
}): Promise<Lead> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Failed to update lead", { cause: await response.json() });
  }
  return response.json();
};

export const deleteLead = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete lead");
  }
};
