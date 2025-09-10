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
// export { AddMembersDialog } from './ui/AddMembersDialog';
export { MembersTable } from './ui/MembersTable';
export { GroupDetailsForm } from './ui/GroupDetailsForm';
