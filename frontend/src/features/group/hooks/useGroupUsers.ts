"use client";
import { Group } from '@/entities/group';
import { useGetUsersQuery } from '@/entities/user';
import { useMemo } from 'react';

// Custom hook for managing group users
export function useGroupUsers(
  group: Group | null,
  membersToAdd: string[],
  membersToRemove: string[],
  watchedLeaderId: string
) {
  // Queries
  const { data: users = [] } = useGetUsersQuery();

  // Get current members (excluding those marked for removal and ensure uniqueness)
  const currentMembers = useMemo(() => {
    return group?.members.filter(
      (member, index, self) => 
        !membersToRemove.includes(member.userId) && 
        self.findIndex(m => m.userId === member.userId) === index
    ) || [];
  }, [group, membersToRemove]);

  // Get available users (not already members and not in add queue)
  const availableUsers = useMemo(() => {
    return users.filter(user =>
      !currentMembers.some(member => member.userId === user.id) &&
      !membersToAdd.includes(user.id) &&
      user.id !== watchedLeaderId
    );
  }, [users, currentMembers, membersToAdd, watchedLeaderId]);

  return {
    users,
    currentMembers,
    availableUsers,
  };
}
