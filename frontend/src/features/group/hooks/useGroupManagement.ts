"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import {
  Group,
  useUpdateGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  GroupRole,
} from "@/entities/group";
import { UsersResponse, UserExt } from "@/entities/user";
import { groupSchema, GroupFormData } from "../validation";
import { useGroupUsers } from "./useGroupUsers";
// removed unused useQueryClient import

export function useGroupManagement(group: Group | null) {
  const { t, ready } = useTranslation("group");
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Local state for form data
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<string[]>([]);
  // Track in-flight per-member network operations started by this hook
  const [inFlightMemberRequests, setInFlightMemberRequests] =
    useState<number>(0);

  // React Hook Form setup
  const formMethods = useForm<GroupFormData>({
    resolver: yupResolver(groupSchema),
    defaultValues: {
      name: "",
      leaderId: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = formMethods;
  const watchedLeaderId = watch("leaderId");

  // Subscribe to detailed group data so this hook always uses the freshest source of truth
  const { data: freshGroup } = useGetGroupByIdQuery(
    group?.id ?? "",
    !!group?.id
  );
  const sourceGroup = freshGroup ?? group;

  // Use the separate users hook (sourceGroup is the authoritative group object)
  const { users, currentMembers, availableUsers } = useGroupUsers(
    sourceGroup,
    membersToAdd,
    membersToRemove,
    watchedLeaderId
  );

  // Queries
  useGetGroupsQuery();

  // Mutations
  const updateGroupMutation = useUpdateGroupMutation();
  const createGroupMutation = useCreateGroupMutation();
  const addMemberMutation = useAddGroupMemberMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();

  // isSaving should reflect both mutation hooks and any in-flight per-member ops
  const isSaving =
    inFlightMemberRequests > 0 ||
    addMemberMutation.isPending ||
    removeMemberMutation.isPending ||
    updateGroupMutation.isPending ||
    createGroupMutation.isPending;

  // Initialize form data when group changes
  useEffect(() => {
    if (sourceGroup) {
      // Edit mode (use freshest source)
      reset({
        name: sourceGroup.name,
        leaderId: sourceGroup.leaderId,
      });
      setMembersToAdd([]);
      setMembersToRemove([]);
    } else {
      // Create mode
      reset({
        name: "",
        leaderId: "",
      });
      setMembersToAdd([]);
      setMembersToRemove([]);
    }
  }, [sourceGroup, reset]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (group) {
      // Edit mode — compare against freshest source
      const currentValues = watch();
      const compareGroup = sourceGroup ?? group;
      return (
        currentValues.name !== compareGroup.name ||
        currentValues.leaderId !== compareGroup.leaderId ||
        membersToAdd.length > 0 ||
        membersToRemove.length > 0
      );
    } else {
      // Create mode
      const currentValues = watch();
      return (
        currentValues.name.trim() !== "" ||
        currentValues.leaderId !== "" ||
        membersToAdd.length > 0
      );
    }
  };

  const handleSaveAllChanges = async (formData: GroupFormData) => {
    // determine compareGroup outside try so we can reference it in catch for rollback
    const compareGroup = sourceGroup ?? group;
    // We'll prepare batch optimistic update for members: set the final
    // members list in cache so UI remains stable until all mutations finish.
    let previousGroupSnapshot: Group | undefined;
    let previousListSnapshot: Group[] | undefined;
    let finalOptimisticMembers: Group["members"] | undefined;

    try {
      let groupId: string;

      if (compareGroup) {
        // Update existing group (use freshest source)
        groupId = compareGroup.id;
        if (
          formData.name !== compareGroup.name ||
          formData.leaderId !== compareGroup.leaderId
        ) {
          await updateGroupMutation.mutateAsync({
            id: compareGroup.id,
            body: {
              name: formData.name,
              leaderId: formData.leaderId,
            },
          });
          enqueueSnackbar(t("notifications.groupUpdated"), {
            variant: "success",
          });
        }
      } else {
        // Create new group
        if (!formData.name.trim() || !formData.leaderId) {
          console.error("Group name and leader are required");
          return;
        }

        const newGroup = await createGroupMutation.mutateAsync({
          name: formData.name,
          leaderId: formData.leaderId,
        });
        groupId = newGroup.id;
        enqueueSnackbar(t("notifications.groupCreated"), {
          variant: "success",
        });
      }

      // Prepare and apply batch optimistic members update before firing per-member ops
      if (compareGroup) {
        previousGroupSnapshot = queryClient.getQueryData<Group>([
          "groups",
          "detail",
          compareGroup.id,
        ]);
        previousListSnapshot = queryClient.getQueryData<Group[]>([
          "groups",
          "list",
        ]);

        // Build final members: existing members minus removals + optimistic new members
        const existingMembers = compareGroup.members || [];
        const membersAfterRemoval = existingMembers.filter(
          (m) => !membersToRemove.includes(m.userId)
        );

        // Try to obtain user objects from users cache
        const usersCache = queryClient.getQueryData<UsersResponse>([
          "users",
          "list",
        ]);

        const optimisticNewMembers: Group["members"] = membersToAdd.map(
          (userId) => ({
            id: `optimistic-batch-${userId}`,
            groupId: compareGroup.id,
            userId,
            user:
              (usersCache?.find((u) => u.id === userId) as UserExt) ||
              ({ id: userId, name: "…", email: "" } as UserExt),
            joinedAt: new Date().toISOString(),
            role: GroupRole.MEMBER,
          })
        );

        finalOptimisticMembers = [
          ...membersAfterRemoval,
          ...optimisticNewMembers,
        ];

        // Apply to detail cache
        queryClient.setQueryData(["groups", "detail", compareGroup.id], {
          ...compareGroup,
          members: finalOptimisticMembers,
        } as Group);

        // Apply to groups list cache if present
        if (previousListSnapshot) {
          queryClient.setQueryData(
            ["groups", "list"],
            previousListSnapshot.map((g: Group) =>
              g.id === compareGroup.id
                ? { ...g, members: finalOptimisticMembers }
                : g
            )
          );
        }
      }

      // Use idempotent PUT to replace the group's members with the final list of userIds.
      // This keeps the frontend simple: compute the final userId set and send in one request.
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

      // Compute final list of userIds that should be members after save
      let finalUserIds: string[] = [];
      if (compareGroup && finalOptimisticMembers) {
        finalUserIds = finalOptimisticMembers.map((m) => m.userId);
      } else {
        // created group or no compareGroup: final is membersToAdd
        finalUserIds = [...membersToAdd];
      }

      const totalOps = finalUserIds.length;
      if (totalOps > 0) setInFlightMemberRequests(totalOps);

      // Send idempotent replace request
      const resp = await fetch(
        `${API_BASE_URL}/groups/${groupId}/members/batch`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(finalUserIds),
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Replace members request failed: ${text}`);
      }

      // consume response (final members list)
      await resp.json();

      enqueueSnackbar(t("notifications.membersUpdated"), {
        variant: "success",
      });

      // clear in-flight counter
      setInFlightMemberRequests(0);

      // Invalidate once to refresh authoritative state
      queryClient.invalidateQueries({
        queryKey: ["groups", "detail", groupId],
      });
      queryClient.invalidateQueries({ queryKey: ["groups", "list"] });

      // Reset local state and close dialog
      setMembersToAdd([]);
      setMembersToRemove([]);
      // ensure in-flight counter is cleared (defensive)
      setInFlightMemberRequests(0);
      // Note: No need to call refetchGroups() here as mutations already invalidate queries
      return true;
    } catch (error) {
      console.error("Error saving changes:", error);
      // Rollback optimistic batch if we snapshot previous
      try {
        if (previousGroupSnapshot && compareGroup) {
          queryClient.setQueryData(
            ["groups", "detail", compareGroup.id],
            previousGroupSnapshot
          );
        }
        if (previousListSnapshot) {
          queryClient.setQueryData(["groups", "list"], previousListSnapshot);
        }
      } catch (err) {
        console.error("Error rolling back optimistic update", err);
      }
      // ensure in-flight counter is cleared on error
      setInFlightMemberRequests(0);
      // Show error toast
      try {
        enqueueSnackbar(t("notifications.saveFailed"), { variant: "error" });
      } catch {
        // ignore toast errors during tests
      }
    }
    return false;
  };

  return {
    // Translation
    t,
    ready,

    // Form
    control,
    handleSubmit,
    errors,
    reset,
    watch,

    // State
    membersToAdd,
    setMembersToAdd,
    membersToRemove,
    setMembersToRemove,
    currentMembers,
    availableUsers,
    users,

    // Mutations
    updateGroupMutation,
    createGroupMutation,
    addMemberMutation,
    removeMemberMutation,
    // Internal state
    isSaving,
    // Number of in-flight per-member operations
    pendingMemberOps: inFlightMemberRequests,

    // Helpers
    hasUnsavedChanges,
    handleSaveAllChanges,
    watchedLeaderId,
  };
}
