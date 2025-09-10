import {
  User,
} from "@/shared/generated/prisma";
import { UserRole } from "../../features/auth/model/types";

export type { User };

export type CreateUserDTO = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserDTO = Partial<CreateUserDTO>;

/**
 * Available user permission types
 */
export type UserPermissionKey =
  | "canViewAll"
  | "canViewUsers"
  | "canViewDeals"
  | "canViewLeads"
  | "canEditUsers"
  | "canDeleteRecords"
  | "canViewReports"
  | "canCreateLeads"
  | "canEditLeads"
  | "canDeleteLeads"
  | "canViewGroups"
  | "canEditGroups"
  | "canCreateGroup";

/**
 * Enum for user permissions with string values
 */
export enum UserPermission {
  CAN_VIEW_ALL = "canViewAll",
  CAN_VIEW_USERS = "canViewUsers",
  CAN_VIEW_DEALS = "canViewDeals",
  CAN_VIEW_LEADS = "canViewLeads",
  CAN_EDIT_USERS = "canEditUsers",
  CAN_DELETE_RECORDS = "canDeleteRecords",
  CAN_VIEW_REPORTS = "canViewReports",
  CAN_CREATE_LEADS = "canCreateLeads",
  CAN_EDIT_LEADS = "canEditLeads",
  CAN_DELETE_LEADS = "canDeleteLeads",
  CAN_VIEW_GROUPS = "canViewGroups",
  CAN_EDIT_GROUPS = "canEditGroups",
  CAN_CREATE_GROUP = "canCreateGroup",
}

/**
 * User permissions object returned by useUserPermissions hook
 */
export interface UserPermissions {
  /** Can view all data in the system */
  canViewAll: boolean;
  /** Can view user accounts */
  canViewUsers: boolean;
  /** Can view deals */
  canViewDeals: boolean;
  /** Can view leads */
  canViewLeads: boolean;
  /** Can edit user accounts */
  canEditUsers: boolean;
  /** Can delete records from the system */
  canDeleteRecords: boolean;
  /** Can view reports and analytics */
  canViewReports: boolean;
  /** Can create new leads */
  canCreateLeads: boolean;
  /** Can edit existing leads */
  canEditLeads: boolean;
  /** Can delete leads */
  canDeleteLeads: boolean;
  /** Can view groups */
  canViewGroups: boolean;
  /** Can edit groups */
  canEditGroups: boolean;
  /** Can create new groups */
  canCreateGroup: boolean;
  /** Current user's role */
  role: UserRole | null;
  /** Whether user is admin */
  isAdmin: boolean;
  /** Whether user is employee */
  isEmployee: boolean;
}
