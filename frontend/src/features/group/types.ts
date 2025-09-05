// Types for Group Management
import { Group } from '@/entities/group';
import { User } from '@/entities/user';

export interface GroupFormData {
  name: string;
  leaderId: string;
}

export interface GroupManagementDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group | null;
}

export interface AddMembersDialogProps {
  open: boolean;
  onClose: () => void;
  availableUsers: User[];
  selectedUsers: string[];
  onToggleUser: (userId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  isSaving?: boolean;
}
