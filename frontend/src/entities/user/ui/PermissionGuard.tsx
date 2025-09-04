"use client";

import React from "react";
import { useUserPermissions } from "../hooks";
import { UserPermissionKey, UserPermission } from "../types";

interface PermissionGuardProps {
  /** Permission to check */
  permission: UserPermissionKey | UserPermission;
  /** Content to render if permission is granted */
  children: React.ReactNode;
  /** Optional fallback content to render if permission is denied */
  fallback?: React.ReactNode;
}

interface MultiplePermissionGuardProps {
  /** Array of permissions to check */
  permissions: (UserPermissionKey | UserPermission)[];
  /** Strategy for checking multiple permissions: 'and' (all required) or 'or' (any required) */
  strategy?: 'and' | 'or';
  /** Content to render if permission is granted */
  children: React.ReactNode;
  /** Optional fallback content to render if permission is denied */
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard component that conditionally renders children based on user permissions
 *
 * @example
 * ```tsx
 * <PermissionGuard permission="canViewUsers">
 *   <UserManagement />
 * </PermissionGuard>
 *
 * <PermissionGuard permission={UserPermission.CAN_EDIT_USERS} fallback={<AccessDenied />}>
 *   <EditUserForm />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const permissions = useUserPermissions();

  // Convert enum to string if needed
  const permissionKey = typeof permission === "string" ? permission : permission;

  // Check if user has the required permission
  const hasPermission = permissions[permissionKey as UserPermissionKey];

  // Render children if permission is granted, otherwise render fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * Advanced PermissionGuard that can check multiple permissions with AND/OR logic
 *
 * @example
 * ```tsx
 * // Require ALL permissions (AND logic)
 * <MultiplePermissionGuard permissions={["canViewUsers", "canEditUsers"]} strategy="and">
 *   <AdminPanel />
 * </MultiplePermissionGuard>
 *
 * // Require ANY permission (OR logic)
 * <MultiplePermissionGuard permissions={["canViewDeals", "canViewLeads"]} strategy="or">
 *   <SalesDashboard />
 * </MultiplePermissionGuard>
 * ```
 */
export const MultiplePermissionGuard: React.FC<MultiplePermissionGuardProps> = ({
  permissions,
  strategy = 'and',
  children,
  fallback = null,
}) => {
  const userPermissions = useUserPermissions();

  // Convert all permissions to strings
  const permissionKeys = permissions.map(perm =>
    typeof perm === "string" ? perm : perm
  );

  // Check permissions based on strategy
  const hasPermission = strategy === 'and'
    ? permissionKeys.every(key => userPermissions[key as UserPermissionKey])
    : permissionKeys.some(key => userPermissions[key as UserPermissionKey]);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;

/**
 * Higher-Order Component for permission checking
 *
 * @example
 * ```tsx
 * const ProtectedUserManagement = withPermission("canViewUsers")(UserManagement);
 * const ProtectedAdminPanel = withPermission(["canViewUsers", "canEditUsers"], "and")(AdminPanel);
 * ```
 */
export function withPermission<P extends object>(
  permission: UserPermissionKey | UserPermission | (UserPermissionKey | UserPermission)[],
  strategy: 'and' | 'or' = 'and',
  fallback?: React.ComponentType<P>
) {
  return function (WrappedComponent: React.ComponentType<P>) {
    const WithPermissionComponent = (props: P) => {
      const userPermissions = useUserPermissions();

      // Handle single permission
      if (!Array.isArray(permission)) {
        const permissionKey = typeof permission === "string" ? permission : permission;
        const hasPermission = userPermissions[permissionKey as UserPermissionKey];

        if (!hasPermission) {
          return fallback ? React.createElement(fallback, props) : null;
        }

        return <WrappedComponent {...props} />;
      }

      // Handle multiple permissions
      const permissionKeys = permission.map(perm =>
        typeof perm === "string" ? perm : perm
      );

      const hasPermission = strategy === 'and'
        ? permissionKeys.every(key => userPermissions[key as UserPermissionKey])
        : permissionKeys.some(key => userPermissions[key as UserPermissionKey]);

      if (!hasPermission) {
        return fallback ? React.createElement(fallback, props) : null;
      }

      return <WrappedComponent {...props} />;
    };

    WithPermissionComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithPermissionComponent;
  };
}
