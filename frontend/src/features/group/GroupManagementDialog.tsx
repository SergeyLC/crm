"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Edit, PersonAdd } from "@mui/icons-material";
import { GroupFormData, GroupManagementDialogProps } from "./types";
import { useGroupManagement } from "./hooks/useGroupManagement";
import { GroupDetailsForm } from "./ui/GroupDetailsForm";
import { MembersTable } from "./ui/MembersTable";
import { SelectUsersDialog } from "@/shared/ui";

export function GroupManagementDialog({
  open,
  onClose,
  group,
}: GroupManagementDialogProps) {
  const { t, ready } = useTranslation("group");
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Добавляем состояние для отслеживания успешного создания группы
  const [groupCreated, setGroupCreated] = useState(false);

  const {
    control,
    handleSubmit,
    errors,
    membersToAdd,
    setMembersToAdd,
    membersToRemove,
    setMembersToRemove,
    currentMembers,
    availableUsers,
    users,
    hasUnsavedChanges,
    handleSaveAllChanges,
    watchedLeaderId,
    updateGroupMutation,
    createGroupMutation,
    addMemberMutation,
    removeMemberMutation,
    isSaving,
    pendingMemberOps,
    reset, // Добавляем функцию reset из useGroupManagement
  } = useGroupManagement(group);

  // Event handlers
  const handleRemoveMemberFromQueue = (userId: string) => {
    if (membersToRemove.includes(userId)) return;
    // Remove from add queue if it was there
    setMembersToAdd((prev) => prev.filter((id) => id !== userId));
    setMembersToRemove((prev) => [...prev, userId]);
  };

  const handleUndoAddMember = (userId: string) => {
    setMembersToAdd((prev) => prev.filter((id) => id !== userId));
  };

  const handleUndoRemoveMember = (userId: string) => {
    setMembersToRemove((prev) => prev.filter((id) => id !== userId));
  };

  const handleOpenAddMembersDialog = () => {
    setSelectedUsers([]);
    setAddMembersDialogOpen(true);
  };

  const handleCloseAddMembersDialog = () => {
    setAddMembersDialogOpen(false);
    setSelectedUsers([]);
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirmAddMembers = () => {
    // Add selected users to the queue, avoiding duplicates
    const newMembersToAdd = selectedUsers.filter(
      (userId) =>
        !membersToAdd.includes(userId) &&
        !currentMembers.some((member) => member.userId === userId)
    );
    setMembersToAdd((prev) => [...prev, ...newMembersToAdd]);
    // Remove from remove queue if they were marked for removal
    setMembersToRemove((prev) => prev.filter((id) => !newMembersToAdd.includes(id)));
    handleCloseAddMembersDialog();
  };
  
  // Модифицируем функцию сохранения, чтобы отслеживать успешное создание группы
  const handleSaveGroup = async (
    data: GroupFormData
  ) => {
    const result = await handleSaveAllChanges(data);

    // Если мы в режиме создания и операция была успешной
    if (isCreateMode && result) {
      setGroupCreated(true);
    }

    return result;
  };
  
  // Отслеживаем завершение создания группы
  useEffect(() => {
    // Если группа была создана успешно
    if (groupCreated) {
      // Очищаем форму
      reset({
        name: '',
        leaderId: '',
      });
      
      // Сбрасываем списки членов
      setMembersToAdd([]);
      setMembersToRemove([]);
      
      // Сбрасываем флаг создания группы
      setGroupCreated(false);
    }
  }, [groupCreated, reset, setMembersToAdd, setMembersToRemove]);

  const isCreateMode = !group;
  const isAnyPending =
    updateGroupMutation.isPending ||
    createGroupMutation.isPending ||
    addMemberMutation.isPending ||
    removeMemberMutation.isPending;

  // Don't render if translations are not ready
  if (!ready) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ position: 'relative' }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Edit />
            <Typography variant="h6">
              {isCreateMode
                ? t("dialog.title.create")
                : t("dialog.title.edit", { name: group.name })}
            </Typography>
            {hasUnsavedChanges() && (
              <Chip
                label={t("dialog.unsavedChanges")}
                color="warning"
                size="small"
              />
            )}
              {isSaving && pendingMemberOps > 0 && (
                <Chip
                  label={t('dialog.savingOperations', { count: pendingMemberOps })}
                  color="info"
                  size="small"
                  icon={<CircularProgress size={14} color="inherit" />}
                />
              )}
          </Box>
          <IconButton
            aria-label={t('buttons.close')}
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            {/* Group Details Section */}
            <GroupDetailsForm control={control} errors={errors} users={users} />

            <Divider />

            {/* Members Section */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  {t("sections.members", {
                    count: Array.from(new Set([
                      ...currentMembers.map((m) => m.userId),
                      ...membersToAdd,
                    ])).length,
                  })}
                </Typography>
                {!isCreateMode && (
                  <Button
                    data-testid="group-add-members"
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddMembersDialog}
                    size="small"
                  >
                    {t("buttons.addMember")}
                  </Button>
                )}
                {isCreateMode && (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddMembersDialog}
                    size="small"
                  >
                    {t("buttons.addMembers")}
                  </Button>
                )}
              </Box>

              <MembersTable
                membersToAdd={membersToAdd}
                membersToRemove={membersToRemove}
                currentMembers={currentMembers}
                users={users}
                watchedLeaderId={watchedLeaderId}
                isCreateMode={isCreateMode}
                onUndoAddMember={handleUndoAddMember}
                onUndoRemoveMember={handleUndoRemoveMember}
                onRemoveMember={handleRemoveMemberFromQueue}
                isRemovePending={removeMemberMutation.isPending}
                isAddPending={addMemberMutation.isPending}
                isSaving={isSaving}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t("buttons.cancel")}</Button>
          <Button
            data-testid="group-save-all"
            onClick={handleSubmit(handleSaveGroup)}
            variant="contained"
            disabled={!hasUnsavedChanges() || isAnyPending}
            startIcon={isAnyPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isCreateMode
              ? t("buttons.createGroup")
              : hasUnsavedChanges()
                ? t("buttons.saveAllChanges")
                : t("buttons.noChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      <SelectUsersDialog
        open={addMembersDialogOpen}
        title={t("dialog.addMembers.title")}
        description={t("dialog.addMembers.description")}
        confirmButtonText={t("buttons.addSelectedMembers", { count: selectedUsers.length })}
        onClose={handleCloseAddMembersDialog}
        availableUsers={availableUsers}
        selectedUserIds={selectedUsers}
        onToggleUser={handleToggleUserSelection}
        onConfirm={handleConfirmAddMembers}
        isPending={addMemberMutation.isPending}
        isSaving={isSaving}
        emptyListMessage={t("messages.noAvailableUsers")}
        emptyListSubMessage={t("messages.allUsersAreMembers")}
      />
    </>
  );
}
