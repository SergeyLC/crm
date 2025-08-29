import {
  User as PrismaUser,
  UserRole,
  UserStatus,
} from "@/shared/generated/prisma-client";

// Тип для фильтрации пользователей по статусу
export type UserStatusFilter = UserStatus | 'ALL';

// Экспортируем enum'ы
export { UserRole, UserStatus };

// Базовый тип пользователя
export type User = PrismaUser;

// Расширенный тип пользователя с дополнительными полями
export interface UserExt extends User {
  createdByUser?: User | null;
}

// DTO для создания пользователя
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  createdById?: string;
}

// DTO для обновления пользователя
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

// Тип для ответа с пользователями
export type UsersResponse = UserExt[];
