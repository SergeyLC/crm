import {
  User as PrismaUser,
  UserRole,
  UserStatus,
} from "@/shared/generated/prisma";

// Type for filtering users by status
export type UserStatusFilter = UserStatus | 'ALL';

// Exporting enums
export { UserRole, UserStatus };

// Base user type
export type User = PrismaUser;

// Extended user type with additional fields
export interface UserExt extends User {
  createdByUser?: User | null;
}

// DTO for creating a user
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  createdById?: string;
}

// DTO for updating a user
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

// Type for user response
export type UsersResponse = UserExt[];
