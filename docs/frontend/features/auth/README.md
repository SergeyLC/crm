# Auth Feature - Role Hooks

## Overview

This feature provides authentication and role-based access control hooks for the Loya.Care CRM system.

## Available Hooks

### `useClient()`
Returns the current user's role or `null` if not authenticated.

```tsx
import { useClient } from "@/features/auth";

function MyComponent() {
  const userRole = useClient();

  if (userRole === "ADMIN") {
    return <AdminPanel />;
  }

  return <RegularUserPanel />;
}
```

### `useHasRole(role)`
Checks if the current user has a specific role.

```tsx
import { useHasRole } from "@/features/auth";

function AdminButton() {
  const canEdit = useHasRole("ADMIN");

  if (!canEdit) return null;

  return <button>Edit Settings</button>;
}
```

### `useIsAdmin()`
Convenience hook to check if the current user is an admin.

```tsx
import { useIsAdmin } from "@/features/auth";

function AdminDashboard() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return <AdminDashboardContent />;
}
```

### `useIsEmployee()`
Convenience hook to check if the current user is an employee.

```tsx
import { useIsEmployee } from "@/features/auth";

function EmployeeTools() {
  const isEmployee = useIsEmployee();

  return (
    <div>
      {isEmployee && <EmployeeSpecificTools />}
      <CommonTools />
    </div>
  );
}
```

## Usage with AuthProvider

Make sure to wrap your app with `AuthProvider` to use these hooks:

```tsx
import { AuthProvider } from "@/features/auth";

function App() {
  return (
    <AuthProvider>
      <MyApp />
    </AuthProvider>
  );
}
```

## Available Roles

- `"ADMIN"` - Administrator with full access
- `"EMPLOYEE"` - Employee with limited access

## Error Handling

All hooks handle unauthenticated states gracefully:

- `useClient()` returns `null` when not authenticated
- `useHasRole()` returns `false` when not authenticated
- `useIsAdmin()` and `useIsEmployee()` return `false` when not authenticated
