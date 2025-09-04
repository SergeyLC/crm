"use client";
import { useClient, useHasRole, useIsAdmin, useIsEmployee, useAuth } from "../../../features/auth";
import { UserPermissions } from "../types";

/**
 * User slice hooks - Wrapper for auth hooks with user-focused interface
 */

// Re-export auth hooks for easier access
export { useClient, useHasRole, useIsAdmin, useIsEmployee };

/**
 * Hook to get current user information
 * @returns Current user object or null
 */
export const useCurrentUser = () => {
  // Here could be extended user information from the user entity later
  // For now we use the auth information
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user can perform admin actions
 * @returns True if user has admin privileges
 */
export const useCanAdmin = () => {
  return useIsAdmin();
};

/**
 * Hook to check if user can perform employee actions
 * @returns True if user has employee or admin privileges
 */
export const useCanEmployee = () => {
  const isEmployee = useIsEmployee();
  const isAdmin = useIsAdmin();
  return isEmployee || isAdmin;
};

/**
 * Hook to get user permissions based on role
 * @returns Object with permission flags as UserPermissions
 */
export const useUserPermissions = (): UserPermissions => {
  const role = useClient();
  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();

  return {
    canViewAll: isAdmin,
    canViewUsers: isAdmin || isEmployee,
    canViewDeals: isAdmin || isEmployee,
    canViewLeads: isAdmin || isEmployee,
    canEditUsers: isAdmin,
    canDeleteRecords: isAdmin,
    canViewReports: isAdmin || isEmployee,
    canCreateLeads: isAdmin || isEmployee,
    canEditLeads: isAdmin || isEmployee,
    canDeleteLeads: isAdmin,
    canViewGroups: isAdmin || isEmployee,
    canEditGroups: isAdmin,
    canCreateGroup: isAdmin,
    role,
    isAdmin,
    isEmployee,
  };

};
