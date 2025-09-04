// Group entity types
import { User } from '@/entities/user';

export interface Group {
  id: string;
  name: string;
  leaderId: string;
  leader: User;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: User;
  joinedAt: string;
  role: GroupRole;
}

export enum GroupRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

// DTOs
export interface CreateGroupDTO {
  name: string;
  leaderId: string;
}

export interface UpdateGroupDTO {
  name?: string;
  leaderId?: string;
}

export interface AddGroupMemberDTO {
  userId: string;
}

// Response types
export type GroupsResponse = Group[];
