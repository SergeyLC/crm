import {
  User,
} from "@/shared/generated/prisma-client";

export type { User };

export type CreateUserDTO = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserDTO = Partial<CreateUserDTO>;
