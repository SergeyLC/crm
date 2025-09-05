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
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import {
  useGetGroupsQuery,
  useDeleteGroupMutation,
  Group,
} from '@/entities/group';
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

  const handleDelete = async (id: string) => {
    try {
      await deleteGroupMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
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
                      onClick={() => handleDelete(group.id)}
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
    </Box>
  );
}
