import { BaseTableRowData } from "@/features/base-table";
import { UserRole, UserStatus } from "@/entities/user";

export interface UserTableRowData extends BaseTableRowData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}