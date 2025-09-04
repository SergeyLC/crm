# User Entity - Hooks

## Overview

The user entity provides hooks for user-related functionalities and permissions.

## Available Components

### `PermissionGuard`
Component that conditionally renders children based on user permissions.

```tsx
import { PermissionGuard, UserPermission } from "@/entities/user";

function App() {
  return (
    <div>
      <PermissionGuard permission="canViewUsers">
        <UserManagement />
      </PermissionGuard>
      
      <PermissionGuard 
        permission={UserPermission.CAN_EDIT_USERS}
        fallback={<div>Access denied</div>}
      >
        <EditUserForm />
      </PermissionGuard>
    </div>
  );
}
```

**Props:**
- `permission`: `UserPermissionKey | UserPermission` - The permission to check
- `children`: `React.ReactNode` - Content to render if permission is granted
- `fallback?`: `React.ReactNode` - Optional content to render if permission is denied (defaults to `null`)

### `MultiplePermissionGuard`
Advanced component that can check multiple permissions with AND/OR logic.

```tsx
import { MultiplePermissionGuard, UserPermission } from "@/entities/user";

function App() {
  return (
    <div>
      {/* Require ALL permissions (AND logic) */}
      <MultiplePermissionGuard 
        permissions={["canViewUsers", "canEditUsers"]} 
        strategy="and"
      >
        <AdminPanel />
      </MultiplePermissionGuard>
      
      {/* Require ANY permission (OR logic) */}
      <MultiplePermissionGuard 
        permissions={[UserPermission.CAN_VIEW_DEALS, UserPermission.CAN_VIEW_LEADS]} 
        strategy="or"
        fallback={<div>No sales access</div>}
      >
        <SalesDashboard />
      </MultiplePermissionGuard>
    </div>
  );
}
```

**Props:**
- `permissions`: `(UserPermissionKey | UserPermission)[]` - Array of permissions to check
- `strategy?`: `'and' | 'or'` - Strategy for checking multiple permissions (defaults to `'and'`)
- `children`: `React.ReactNode` - Content to render if permission is granted
- `fallback?`: `React.ReactNode` - Optional content to render if permission is denied (defaults to `null`)

### `withPermission` HOC
Higher-Order Component for wrapping existing components with permission checks.

```tsx
import { withPermission, UserPermission } from "@/entities/user";

// Single permission
const ProtectedUserManagement = withPermission("canViewUsers")(UserManagement);

// Multiple permissions with AND logic
const ProtectedAdminPanel = withPermission(
  ["canViewUsers", "canEditUsers"], 
  "and"
)(AdminPanel);

// Multiple permissions with OR logic
const ProtectedSalesDashboard = withPermission(
  [UserPermission.CAN_VIEW_DEALS, UserPermission.CAN_VIEW_LEADS], 
  "or"
)(SalesDashboard);

// With custom fallback component
const ProtectedEditForm = withPermission(
  "canEditUsers",
  "and",
  AccessDeniedComponent
)(EditUserForm);

// Usage
function App() {
  return (
    <div>
      <ProtectedUserManagement />
      <ProtectedAdminPanel />
      <ProtectedSalesDashboard />
    </div>
  );
}
```

**Parameters:**
- `permission`: `UserPermissionKey | UserPermission | (UserPermissionKey | UserPermission)[]` - Permission(s) to check
- `strategy?`: `'and' | 'or'` - Strategy for multiple permissions (defaults to `'and'`)
- `fallback?`: `React.ComponentType<P>` - Optional fallback component to render if permission is denied

## Available Hooks

### `useCurrentUser()`
Returns information about the current user.

```tsx
import { useCurrentUser } from "@/entities/user";

function UserProfile() {
  const user = useCurrentUser();

  if (!user) return <div>Not logged in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### `useCanAdmin()`
Checks if the user has admin rights.

```tsx
import { useCanAdmin } from "@/entities/user";

function AdminPanel() {
  const canAdmin = useCanAdmin();

  if (!canAdmin) return null;

  return <AdminControls />;
}
```

### `useCanEmployee()`
Checks if the user has employee or admin rights.

```tsx
import { useCanEmployee } from "@/entities/user";

function EmployeeTools() {
  const canEmployee = useCanEmployee();

  return (
    <div>
      {canEmployee && <EmployeeSpecificTools />}
      <CommonTools />
    </div>
  );
}
```

### `useUserPermissions()`
Returns an object with detailed permission flags.

```tsx
import { useUserPermissions, UserPermissions, UserPermissionKey } from "@/entities/user";

function PermissionChecker() {
  const permissions: UserPermissions = useUserPermissions();
  
  // Using the permission key type for type-safe access
  const checkPermission = (permission: UserPermissionKey): boolean => {
    return permissions[permission];
  };
  
  return (
    <div>
      {checkPermission("canViewUsers") && <UserList />}
      {checkPermission("canEditUsers") && <EditUserButton />}
    </div>
  );
}
```

## Re-exported Auth Hooks

The following hooks are re-exported from the auth feature for easier access:

- `useClient()` - Current user's role
- `useHasRole(role)` - Checks for specific role
- `useIsAdmin()` - Checks for admin role
- `useIsEmployee()` - Checks for employee role

## Available Types

### `UserPermissionKey`
Union type containing all available permission keys:

```typescript
type UserPermissionKey =
  | "canViewAll"
  | "canViewUsers"
  | "canViewDeals"
  | "canViewLeads"
  | "canEditUsers"
  | "canDeleteRecords"
  | "canViewReports"
  | "canCreateLeads"
  | "canEditLeads"
  | "canDeleteLeads";
```

### `UserPermission`
Enum with permission constants:

```typescript
enum UserPermission {
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
}
```

**Usage examples:**
```tsx
import { UserPermission, UserPermissionKey } from "@/entities/user";

// Using enum for constants
const requiredPermission = UserPermission.CAN_EDIT_USERS;

// Converting enum to union type
function hasPermission(userPermissions: UserPermissions, permission: UserPermission): boolean {
  return userPermissions[permission as UserPermissionKey];
}

// Using in components
<PermissionGuard permission={UserPermission.CAN_VIEW_USERS}>
  <UserList />
</PermissionGuard>

<PermissionGuard permission={UserPermission.CAN_VIEW_DEALS}>
  <DealsList />
</PermissionGuard>

<PermissionGuard permission={UserPermission.CAN_VIEW_LEADS}>
  <LeadsList />
</PermissionGuard>
```

### `UserPermissions`
Interface with detailed permission flags:

```typescript
interface UserPermissions {
  canViewAll: boolean;      // View all data
  canViewUsers: boolean;    // View user accounts
  canViewDeals: boolean;    // View deals
  canViewLeads: boolean;    // View leads
  canEditUsers: boolean;    // Edit users
  canDeleteRecords: boolean; // Delete records
  canViewReports: boolean;   // View reports
  canCreateLeads: boolean;   // Create leads
  canEditLeads: boolean;     // Edit leads
  canDeleteLeads: boolean;   // Delete leads
  role: UserRole | null;     // Current role
  isAdmin: boolean;          // Is admin
  isEmployee: boolean;       // Is employee
}
```

## Architecture

These hooks are placed in the user entity because they contain user-related logic, but internally use the auth feature for authentication. This follows the FSD principle of clear separation of responsibilities.
