import { UserPermissions } from "../types";
export const userHasPermission = (
  permissions: UserPermissions,
  permission: keyof UserPermissions
): boolean => {
  return !!permissions[permission];
};
