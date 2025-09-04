"use client";
import { useAuth } from "./useAuth";
import { UserRole } from "../model/types";

/**
 * Hook to get the current user's role
 *
 * @returns The current user's role or null if not authenticated
 *
 * @example
 * ```tsx
 * const userRole = useClient();
 *
 * if (userRole === "ADMIN") {
 *   // Show admin features
 * }
 * ```
 */
export const useClient = (): UserRole | null => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return user.role;
};

/**
 * Hook to check if the current user has a specific role
 *
 * @param role The role to check for
 * @returns True if the user has the specified role
 *
 * @example
 * ```tsx
 * const isAdmin = useHasRole("ADMIN");
 *
 * if (isAdmin) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export const useHasRole = (role: UserRole): boolean => {
  const userRole = useClient();
  return userRole === role;
};

/**
 * Hook to check if the current user is an admin
 *
 * @returns True if the user is an admin
 *
 * @example
 * ```tsx
 * const isAdmin = useIsAdmin();
 *
 * return (
 *   <div>
 *     {isAdmin && <AdminButton />}
 *     <RegularContent />
 *   </div>
 * );
 * ```
 */
export const useIsAdmin = (): boolean => {
  return useHasRole("ADMIN");
};

/**
 * Hook to check if the current user is an employee
 *
 * @returns True if the user is an employee
 *
 * @example
 * ```tsx
 * const isEmployee = useIsEmployee();
 *
 * if (isEmployee) {
 *   return <EmployeeDashboard />;
 * }
 * ```
 */
export const useIsEmployee = (): boolean => {
  return useHasRole("EMPLOYEE");
};
