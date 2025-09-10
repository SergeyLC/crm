import type {
  Pipeline as PrismaPipeline,
  User as PrismaUser,
  Group as PrismaGroup,
  PipelineUser as PrismaPipelineUser,
  PipelineGroup as PrismaPipelineGroup,
} from "@/shared/generated/prisma";

/**
 * Pipeline-Entität, die eine Pipeline im System repräsentiert
 */
export type Pipeline = PrismaPipeline & {
  users: PipelineUser[];
  groups: PipelineGroup[];
};

/**
 * Verbindung zwischen Pipeline und Benutzer
 */
export type PipelineUser = PrismaPipelineUser & {
  user: PrismaUser;
};

/**
 * Verbindung zwischen Pipeline und Gruppe
 */
export type PipelineGroup = PrismaPipelineGroup & {
  group: PrismaGroup;
};

export type CreatePipelineDTO = Omit<Pipeline, "id" | "createdAt" | "updatedAt" | "users" | "groups"> & {
  userIds?: string[];
  groupIds?: string[];
};
export type UpdatePipelineDTO = Partial<CreatePipelineDTO>;

export type User = PrismaUser;
export type Group = PrismaGroup;