"use client";
import React, { useState } from 'react';
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Gruppen</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openManagementDialog(null)}
            sx={{ mr: 1 }}
            disabled={!canCreateGroup}
          >
            Neue Gruppe
          </Button>
        </Box>
      </Box>

      {groupsLoading ? (
        <Typography>Lade Gruppen...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Gruppenleiter</TableCell>
                <TableCell>Mitglieder</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.leader.name}</TableCell>
                  <TableCell>
                    {group.members.length} Mitglieder
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openManagementDialog(group)} disabled={!canEditGroups}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(group.id)} disabled={deleteGroupMutation.isPending || !canEditGroups}>
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
