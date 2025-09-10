"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import {
  useGetGroupsQuery,
  useDeleteGroupMutation,
  Group,
} from "@/entities/group";
import { useSnackbar } from "notistack";
import { useUserPermissions } from "@/entities/user";
import { GroupManagementDialog } from "./GroupManagementDialog";
import { ConfirmDeleteDialog } from "@/shared/ui";

export function GroupsTable() {
  const { t, ready } = useTranslation("group");
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [selectedGroupForManagement, setSelectedGroupForManagement] =
    useState<Group | null>(null);

  // Queries
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const { canCreateGroups } = useUserPermissions();

  // Mutations
  const deleteGroupMutation = useDeleteGroupMutation();
  const { enqueueSnackbar } = useSnackbar();

  const handleDelete = async (id: string) => {
    try {
      // Directly call DELETE on the backend and surface its message
      const result = await deleteGroupMutation.mutateAsync(id);

      // result may be an object with { message }
      // Prefer the localized success message from translations so the UI
      // matches the selected locale. Backend messages are logged for
      // debugging but not shown raw to the user to avoid English text.
      const localizedSuccess = t("notifications.groupDeleted");
      try {
        enqueueSnackbar(localizedSuccess, { variant: "success" });
      } catch {
        // ignore snackbar errors (e2e/test env)
      }
      // Keep backend message in console for debugging if present
      try {
        if (result && typeof result === "object" && "message" in result) {
          console.debug(
            "Backend delete message:",
            (result as Record<string, unknown>).message
          );
        }
      } catch {
        // ignore
      }
    } catch (error: unknown) {
      console.error("Error deleting group:", error);
      // Try to show error message from error instance
      let msg = t("notifications.deleteFailed") || "Failed to delete group";
      try {
        if (error instanceof Error && error.message) msg = error.message;
      } catch {
        // ignore
      }
      enqueueSnackbar(msg, { variant: "error" });
    }
  };

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupPendingDelete, setGroupPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openConfirmDelete = (id: string, name: string) => {
    // If the element that triggered the dialog still has focus, blurring it
    // prevents aria-hidden from being applied while a focused descendant remains
    // in that subtree (accessibility violation). Do this safely in browser.
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === "function") {
        active.blur();
      }
    } catch {
      // ignore when document is not available (SSR/test env)
    }

    setGroupPendingDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setGroupPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!groupPendingDelete) return;
    const id = groupPendingDelete.id;
    handleCloseDeleteDialog();
    await handleDelete(id);
  };

  const openManagementDialog = (group: Group | null) => {
    // Blur currently focused element to avoid aria-hidden on a focused node
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === "function") {
        active.blur();
      }
    } catch {
      // ignore when document is not available (SSR/test env)
    }

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
    <Box sx={{ p: 1, pt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">{t("table.title")}</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openManagementDialog(null)}
            sx={{ mr: 1 }}
            disabled={!canCreateGroups}
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
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    {group.leader.name}
                  </TableCell>
                  <TableCell sx={{ pt: 0, pb: 0 }}>
                    {group.members.length} {t("members.table.count")}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => openManagementDialog(group)}
                      sx={{ mr: 1 }}
                    >
                      {t("table.column.edit")}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => openConfirmDelete(group.id, group.name)}
                    >
                      {t("table.column.delete")}
                    </Button>
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
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title={t("confirmDelete.title")}
        message={t("confirmDelete.message", { "name": groupPendingDelete?.name || '' })}
        confirmText={t("confirmDelete.confirm")}
        cancelText={t("confirmDelete.cancel")}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}
