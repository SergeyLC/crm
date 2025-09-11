"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useCreatePipeline,
  useUpdatePipeline,
  usePipeline,
  useAllGroups,
  useAssignGroupsToPipeline,
  useRemoveGroupFromPipeline,
  useAllUsers,
  useAssignUsersToPipeline,
  useRemoveUserFromPipeline,
  PipelineUser,
  PipelineGroup,
} from "@/entities/pipeline";
import { PipelineGroups } from "@/features/pipeline/ui/PipelineGroups";
import { PipelineUsers } from "@/features/pipeline/ui/PipelineUsers";
import { queryClient } from "@/shared/lib/query/client";

interface FormValues {
  name: string;
  description: string;
}

interface PipelineFormDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineId?: string;
}

export const PipelineFormDialog = ({
  open,
  onClose,
  pipelineId,
}: PipelineFormDialogProps) => {
  const { t } = useTranslation(["PipelineFormDialog"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Groups to remove (only stored locally until save)
  const [groupsToRemove, setGroupsToRemove] = useState<string[]>([]);

  // Users to add/remove (only stored locally until save)
  const [usersToRemove, setUsersToRemove] = useState<string[]>([]);
  const [usersToAdd, setUsersToAdd] = useState<string[]>([]);

  // New state for tracking groups to add
  const [groupsToAdd, setGroupsToAdd] = useState<string[]>([]);

  // Flag to disable fetching during mutations
  const [isPipelineUpdating, setIsPipelineUpdating] = useState(false);

  // Schema validation for the form
  const schema = yup.object({
    name: yup.string().required(t("errors.nameRequired")),
    description: yup.string().default(""),
  });

  // Query hooks - disable refetching during mutations
  const { data: pipeline } = usePipeline(
    pipelineId,
    !!pipelineId && !isPipelineUpdating && !isSubmitting // Disable fetching during updates
  );
  const { data: allGroups = [] } = useAllGroups();
  const { data: allUsers = [] } = useAllUsers();

  // Mutation hooks
  const createPipelineMutation = useCreatePipeline();
  const updatePipelineMutation = useUpdatePipeline();
  const assignGroupsMutation = useAssignGroupsToPipeline();
  const removeGroupMutation = useRemoveGroupFromPipeline();
  const assignUsersMutation = useAssignUsersToPipeline();
  const removeUserMutation = useRemoveUserFromPipeline();

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when dialog opens with pipeline data
  useEffect(() => {
    if (open && pipeline) {
      reset({
        name: pipeline.name,
        description: pipeline.description || "",
      });
      // Reset all local change trackers
      setGroupsToRemove([]);
      setUsersToRemove([]);
      setUsersToAdd([]);
      setGroupsToAdd([]);
    } else if (open && !pipelineId) {
      reset({
        name: "",
        description: "",
      });
      setGroupsToRemove([]);
      setUsersToRemove([]);
      setUsersToAdd([]);
      setGroupsToAdd([]);
    }

    // Reset state when dialog opens
    if (open) {
      setError(null);
      setSuccess(null);
    }
    if (!open) {
      setIsSubmitting(false);
      setIsPipelineUpdating(false);
    }
  }, [open, pipeline, pipelineId, reset]);

  // Available groups for selection (exclude those already assigned but include those marked for removal)
  const availableGroups = allGroups.filter((group) => {
    const isNotAssigned = !pipeline?.groups?.some(
      (pg) => pg.groupId === group.id
    );
    const isMarkedForRemoval = groupsToRemove.includes(group.id);

    // User is not in the pending add list
    const isNotPendingAdd = !groupsToAdd.includes(group.id);

    return (isNotAssigned || isMarkedForRemoval) && isNotPendingAdd;

    // !pipeline?.groups?.some((pg) => pg.groupId === group.id) ||
    // groupsToRemove.includes(group.id)
  });

  // Available users for selection (exclude those already assigned or newly added, but include those marked for removal)
  const availableUsers = allUsers.filter((user) => {
    // User is not assigned to pipeline OR user is marked for removal
    const isNotAssigned = !pipeline?.users?.some((pu) => pu.userId === user.id);
    const isMarkedForRemoval = usersToRemove.includes(user.id);

    // User is not in the pending add list
    const isNotPendingAdd = !usersToAdd.includes(user.id);

    return (isNotAssigned || isMarkedForRemoval) && isNotPendingAdd;
  });

  // Handle form submission (create or update)
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Suspend all data refetching during the update process
      setIsPipelineUpdating(true);

      // Optional: cancel any ongoing queries to prevent race conditions
      // await queryClient.cancelQueries({ queryKey: [pipelineId] });

      // Step 1: Create or update the pipeline
      let savedPipelineId = pipelineId; // Store ID for later use

      if (pipelineId) {
        // Update existing pipeline
        await updatePipelineMutation.mutateAsync({
          id: pipelineId,
          data,
        });
      } else {
        // Create new pipeline
        const savedPipeline = await createPipelineMutation.mutateAsync(data);
        savedPipelineId = savedPipeline.id; // Get new pipeline ID for subsequent operations
      }

      // Now use savedPipelineId for all subsequent operations

      // Step 2: Handle groups to add (if any)
      if (savedPipelineId && groupsToAdd.length > 0) {
        await assignGroupsMutation.mutateAsync({
          pipelineId: savedPipelineId,
          groupIds: groupsToAdd,
        });
      }

      // Step 3: Handle users to add (if any)
      if (savedPipelineId && usersToAdd.length > 0) {
        await assignUsersMutation.mutateAsync({
          pipelineId: savedPipelineId,
          userIds: usersToAdd,
        });
      }

      // Step 4: Handle users to remove (if any)
      if (savedPipelineId && usersToRemove.length > 0) {
        // Execute user removals sequentially to avoid race conditions
        for (const userId of usersToRemove) {
          await removeUserMutation.mutateAsync({
            pipelineId: savedPipelineId,
            userId,
          });
        }
      }

      // Step 5: Handle groups to remove (if any)
      if (savedPipelineId && groupsToRemove.length > 0) {
        // Execute group removals sequentially to avoid race conditions
        for (const groupId of groupsToRemove) {
          await removeGroupMutation.mutateAsync({
            pipelineId: savedPipelineId,
            groupId,
          });
        }
      }

      setSuccess(pipelineId ? t("successUpdated") : t("successCreated"));

      onClose();
      setTimeout(() => {
        if (savedPipelineId) {
          queryClient.invalidateQueries({
            queryKey: ["pipelines", "detail", savedPipelineId],
          });
        }
        queryClient.invalidateQueries({ queryKey: ["pipelines", "list"] });
      }, 100);
    } catch (err) {
      console.error("Error saving pipeline:", err);
      setError(t("errors.saveFailed"));
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setIsPipelineUpdating(false);
      }, 1000);
    }
  };

  // Handle adding groups to pipeline
  const handleAddGroups = useCallback(
    async (groupIds: string[]) => {
      // if (!pipelineId) return;

      // Get list of existing group IDs (not removed)
      const existingGroupIds =
        pipeline?.groups
          ?.filter((pg) => !groupsToRemove.includes(pg.groupId))
          .map((pg) => pg.groupId) || [];

      // Add groups to the local list for subsequent saving
      // Only if they do not already exist in the pipeline
      const newGroupIds = groupIds.filter(
        (id) =>
          // Not in the original list OR in the removed list
          !existingGroupIds.includes(id) || groupsToRemove.includes(id)
      );

      setGroupsToAdd((prev) => {
        // Filter out duplicates
        const filtered = newGroupIds.filter((id) => !prev.includes(id));
        return [...prev, ...filtered];
      });

      // If any groups were in the removal list, remove them from there
      setGroupsToRemove((prev) => prev.filter((id) => !groupIds.includes(id)));
    },
    [pipeline, groupsToRemove]
  );

  // Handle adding users to pipeline - Now just tracks additions locally
  const handleAddUsers = useCallback(async (userIds: string[]) => {
    // if (!pipelineId) return;

    // Add users to the local list of users to add
    setUsersToAdd((prev) => {
      // Filter out any users already in the list
      const newUserIds = userIds.filter((id) => !prev.includes(id));
      return [...prev, ...newUserIds];
    });

    // If any of these users were in the "to remove" list, remove them from that list
    setUsersToRemove((prev) => prev.filter((id) => !userIds.includes(id)));
  }, []);

  // Handle removing a group from pipeline
  const handleRemoveGroup = useCallback(
    async (groupId: string) => {
      if (!pipeline) return;

      // Add to groups to remove list instead of removing immediately
      // setGroupsToRemove((prev) => [...prev, groupId]);

      // First check if this group is in the "to add" list
      if (groupsToAdd.includes(groupId)) {
        // Simply remove from the "to add" list
        setGroupsToAdd((prev) => prev.filter((id) => id !== groupId));
      } else {
        // Add to groups to remove list
        setGroupsToRemove((prev) => {
          if (!prev.includes(groupId)) {
            return [...prev, groupId];
          }
          return prev;
        });
      }
    },
    [pipeline, groupsToAdd]
  );

  // Handle removing a user from pipeline - Now just tracks removals locally
  const handleRemoveUser = useCallback(
    async (userId: string) => {
      if (!pipeline) return;

      // First check if this user is in the "to add" list
      if (usersToAdd.includes(userId)) {
        // Simply remove from the "to add" list
        setUsersToAdd((prev) => prev.filter((id) => id !== userId));
      } else {
        // Add to users to remove list
        setUsersToRemove((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      }
    },
    [pipeline, usersToAdd]
  );

  // Calculate current pipeline groups
  const currentPipelineGroups = React.useMemo<PipelineGroup[]>(() => {
    // Source original group IDs (excluding those marked for removal)
    const originalGroupIds = (pipeline?.groups || [])
      .filter((pg) => !groupsToRemove.includes(pg.groupId))
      .map((pg) => pg.groupId);

    // Source original groups (excluding those marked for removal)
    const originalGroups = (pipeline?.groups || []).filter(
      (pg) => !groupsToRemove.includes(pg.groupId)
    );

    // Add new groups only if they don't exist in the original list
    const newGroups = groupsToAdd
      .filter((groupId) => !originalGroupIds.includes(groupId)) // Only truly new
      .map((groupId) => {
        const group = allGroups.find((g) => g.id === groupId);
        return {
          groupId,
          group: group || { id: groupId, name: "Unknown Group" },
          isPending: true,
        } as unknown as PipelineGroup;
      });

    return [...originalGroups, ...newGroups];
  }, [pipeline, groupsToRemove, groupsToAdd, allGroups]);

  // Calculate current pipeline users based on:
  // 1. Original pipeline users (excluding those marked for removal)
  // 2. New users to be added
  const currentPipelineUsers = React.useMemo<PipelineUser[]>(() => {
    // At first we create a set of all user IDs
    const allUserIds = new Set<string>();

    // Source original users (excluding those marked for removal)
    const originalUsers = (pipeline?.users || []).filter(
      (pu) => !usersToRemove.includes(pu.userId)
    );

    // Add their IDs to the set
    originalUsers.forEach((pu) => allUserIds.add(pu.userId));

    // Prepare new users (only those not in the original list)
    const newUsers = usersToAdd
      .filter((userId) => !allUserIds.has(userId)) // Only new IDs
      .map((userId) => {
        const user = allUsers.find((u) => u.id === userId);
        return {
          userId,
          user: user || { id: userId, name: "Unknown User" },
          isPending: true,
        } as unknown as PipelineUser;
      });

    // return unique merged list without duplicates
    return [...originalUsers, ...newUsers];
  }, [pipeline?.users, usersToRemove, usersToAdd, allUsers]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {pipelineId ? t("edit") : t("create")}
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* General information section */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
            {/* <Typography variant="subtitle1" fontWeight="bold">
              {t("general")}
            </Typography> */}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("name")}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("description")}
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Groups section */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 4 }}>
            {/* <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  {t("groups")}
                </Typography> */}
            <PipelineGroups
              pipelineId={pipelineId}
              pipelineGroups={currentPipelineGroups}
              availableGroups={availableGroups}
              onAddGroups={handleAddGroups}
              onRemoveGroup={handleRemoveGroup}
            />
          </Box>

          {/* Users section */}
          <Divider sx={{ my: 3 }} />
          <Box>
            {/* <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  {t("users")}
                  {(usersToAdd.length > 0 || usersToRemove.length > 0) && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="primary"
                      sx={{ ml: 2 }}
                    >
                      ({t("pendingChanges")})
                    </Typography>
                  )}
                </Typography> */}
            <PipelineUsers
              pipelineId={pipelineId}
              pipelineUsers={currentPipelineUsers}
              availableUsers={availableUsers}
              onAddUsers={handleAddUsers}
              onRemoveUser={handleRemoveUser}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={20} />}
          >
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
