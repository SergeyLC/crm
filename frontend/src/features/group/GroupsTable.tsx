"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import {
  useGetGroupsQuery,
  useDeleteGroupMutation,
  Group,
} from '@/entities/group';
import { useSnackbar } from 'notistack';
import { useUserPermissions } from '@/entities/user';
import { GroupManagementDialog } from './GroupManagementDialog';

export function GroupsTable() {
  const { t, ready } = useTranslation('group');
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState<Group | null>(null);

  // Queries
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const { canCreateGroup, canEditGroups } = useUserPermissions();

  // Mutations
  const deleteGroupMutation = useDeleteGroupMutation();
  const { enqueueSnackbar } = useSnackbar();

  const handleDelete = async (id: string) => {
    try {
      // Directly call DELETE on the backend and surface its message
      const result = await deleteGroupMutation.mutateAsync(id);

      // result may be an object with { message }
      let message = t('notifications.groupDeleted');
      if (result && typeof result === 'object' && 'message' in result) {
        message = String((result as Record<string, unknown>).message as string);
      }
      try {
        enqueueSnackbar(String(message), { variant: 'success' });
      } catch {
        // ignore snackbar errors (e2e/test env)
      }
    } catch (error: unknown) {
      console.error('Error deleting group:', error);
      // Try to show error message from error instance
      let msg = t('notifications.deleteFailed') || 'Failed to delete group';
      try {
        if (error instanceof Error && error.message) msg = error.message;
      } catch {
        // ignore
      }
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  // Confirmation dialog state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [groupPendingDelete, setGroupPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const openConfirmDelete = (id: string, name: string) => {
    setGroupPendingDelete({ id, name });
    setConfirmDeleteOpen(true);
  };

  const closeConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    setGroupPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!groupPendingDelete) return;
    const id = groupPendingDelete.id;
    closeConfirmDelete();
    await handleDelete(id);
  };

  const openManagementDialog = (group: Group | null) => {
    setSelectedGroupForManagement(group);
    setManagementDialogOpen(true);
  };

  const closeManagementDialog = () => {
    setManagementDialogOpen(false);
    setSelectedGroupForManagement(null);
  };

  // Don't render if translations are not ready
  if (!ready) {
    return <div>Loading translations...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">{t("table.title")}</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openManagementDialog(null)}
            sx={{ mr: 1 }}
            disabled={!canCreateGroup}
          >
            {t("table.action.create")}
          </Button>
        </Box>
      </Box>

      {groupsLoading ? (
        <Typography>{t("table.loading")}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="groups table">
            <TableHead>
              <TableRow>
                <TableCell>{t("table.column.name")}</TableCell>
                <TableCell>{t("table.column.leader")}</TableCell>
                <TableCell>{t("table.column.members")}</TableCell>
                <TableCell>{t("table.column.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} sx={{ p: 0 }}>
                  <TableCell sx={{ pt: 0, pb: 0 }}>{group.name}</TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>{group.leader.name}</TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    {group.members.length} {t("members.table.count")}
                  </TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    <IconButton
                      data-testid={`group-edit-${group.id}`}
                      onClick={() => openManagementDialog(group)}
                      disabled={!canEditGroups}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => openConfirmDelete(group.id, group.name)}
                      disabled={deleteGroupMutation.isPending || !canEditGroups}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Group Management Dialog */}
      <GroupManagementDialog
        open={managementDialogOpen}
        onClose={closeManagementDialog}
        group={selectedGroupForManagement}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteOpen} onClose={closeConfirmDelete} aria-labelledby="confirm-delete-title">
        <DialogTitle id="confirm-delete-title">{t('confirmDelete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirmDelete.message', { name: groupPendingDelete?.name ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDelete}>{t('buttons.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteGroupMutation.isPending}>
            {t('confirmDelete.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
