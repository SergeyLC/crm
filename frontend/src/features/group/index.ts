// Main components
export { GroupsTable } from './GroupsTable';
export { GroupManagementDialog } from './GroupManagementDialog';

// Types
export type {
  GroupFormData,
  GroupManagementDialogProps,
  AddMembersDialogProps
} from './types';

// Validation
export { groupSchema } from './validation';
export type { GroupFormData as ValidationGroupFormData } from './validation';

// Hooks
export { useGroupManagement } from './hooks/useGroupManagement';

// Sub-components
export { AddMembersDialog } from './components/AddMembersDialog';
export { MembersTable } from './components/MembersTable';
export { GroupDetailsForm } from './components/GroupDetailsForm';
