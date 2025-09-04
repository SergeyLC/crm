"use client";
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import { PersonAdd, Edit, Delete, Add, Remove } from '@mui/icons-material';
import {
  Group,
  useUpdateGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetGroupsQuery,
  useCreateGroupMutation,
} from '@/entities/group';
import { useGetUsersQuery } from '@/entities/user';

// Validation schema
const groupSchema = yup.object().shape({
  name: yup
    .string()
    .required('validation.nameRequired')
    .min(2, 'validation.nameMinLength')
    .max(100, 'validation.nameMaxLength')
    .trim(),
  leaderId: yup
    .string()
    .required('validation.leaderRequired'),
});

type GroupFormData = yup.InferType<typeof groupSchema>;

interface GroupManagementDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group | null;
}

export function GroupManagementDialog({ open, onClose, group }: GroupManagementDialogProps) {
  const { t, ready } = useTranslation('group');
  // Local state for form data
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<string[]>([]);
  // Dialog state
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GroupFormData>({
    resolver: yupResolver(groupSchema),
    defaultValues: {
      name: '',
      leaderId: '',
    },
  });

  const watchedLeaderId = watch('leaderId');

  // Queries
  const { data: users = [] } = useGetUsersQuery();
  const { refetch: refetchGroups } = useGetGroupsQuery();

  // Mutations
  const updateGroupMutation = useUpdateGroupMutation();
  const createGroupMutation = useCreateGroupMutation();
  const addMemberMutation = useAddGroupMemberMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();

  // Initialize form data when group changes
  React.useEffect(() => {
    if (group) {
      // Edit mode
      reset({
        name: group.name,
        leaderId: group.leaderId,
      });
      setMembersToAdd([]);
      setMembersToRemove([]);
    } else {
      // Create mode
      reset({
        name: '',
        leaderId: '',
      });
      setMembersToAdd([]);
      setMembersToRemove([]);
    }
  }, [group, reset]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (group) {
      // Edit mode
      const currentValues = watch();
      return (
        currentValues.name !== group.name ||
        currentValues.leaderId !== group.leaderId ||
        membersToAdd.length > 0 ||
        membersToRemove.length > 0
      );
    } else {
      // Create mode
      const currentValues = watch();
      return currentValues.name.trim() !== '' || currentValues.leaderId !== '' || membersToAdd.length > 0;
    }
  };

  const handleRemoveMemberFromQueue = (userId: string) => {
    if (membersToRemove.includes(userId)) return;
    setMembersToRemove(prev => [...prev, userId]);
  };

  const handleUndoAddMember = (userId: string) => {
    setMembersToAdd(prev => prev.filter(id => id !== userId));
  };

  const handleUndoRemoveMember = (userId: string) => {
    setMembersToRemove(prev => prev.filter(id => id !== userId));
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
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirmAddMembers = () => {
    // Add selected users to the queue, avoiding duplicates
    const newMembersToAdd = selectedUsers.filter(userId =>
      !membersToAdd.includes(userId) &&
      !currentMembers.some(member => member.userId === userId)
    );
    setMembersToAdd(prev => [...prev, ...newMembersToAdd]);
    handleCloseAddMembersDialog();
  };

  const handleSaveAllChanges = async (formData: GroupFormData) => {
    try {
      let groupId: string;

      if (group) {
        // Update existing group
        groupId = group.id;
        if (formData.name !== group.name || formData.leaderId !== group.leaderId) {
          await updateGroupMutation.mutateAsync({
            id: group.id,
            body: {
              name: formData.name,
              leaderId: formData.leaderId,
            },
          });
        }
      } else {
        // Create new group
        if (!formData.name.trim() || !formData.leaderId) {
          console.error('Group name and leader are required');
          return;
        }

        const newGroup = await createGroupMutation.mutateAsync({
          name: formData.name,
          leaderId: formData.leaderId,
        });
        groupId = newGroup.id;
      }

      // Add new members
      for (const userId of membersToAdd) {
        await addMemberMutation.mutateAsync({
          groupId,
          userId,
        });
      }

      // Remove members (only for existing groups)
      if (group) {
        for (const userId of membersToRemove) {
          await removeMemberMutation.mutateAsync({
            groupId,
            userId,
          });
        }
      }

      // Reset local state and close dialog
      setMembersToAdd([]);
      setMembersToRemove([]);
      await refetchGroups();
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  // Get current members (excluding those marked for removal)
  const currentMembers = group?.members.filter(
    member => !membersToRemove.includes(member.userId)
  ) || [];

  // Get available users (not already members and not in add queue)
  const availableUsers = users.filter(user =>
    !currentMembers.some(member => member.userId === user.id) &&
    !membersToAdd.includes(user.id) &&
    user.id !== watchedLeaderId
  );

  const isCreateMode = !group;

  // Don't render if translations are not ready
  if (!ready) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Edit />
            <Typography variant="h6">
              {isCreateMode ? t('dialog.title.create') : t('dialog.title.edit', { name: group.name })}
            </Typography>
            {hasUnsavedChanges() && (
              <Chip label={t('dialog.unsavedChanges')} color="warning" size="small" />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>

            {/* Group Details Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {t('sections.groupDetails')}
              </Typography>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('fields.groupName')}
                    error={!!errors.name}
                    helperText={errors.name ? t(errors.name.message || '') : ''}
                    sx={{ mb: 2 }}
                  />
                )}
              />

              <Controller
                name="leaderId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.leaderId}>
                    <InputLabel>{t('fields.groupLeader')}</InputLabel>
                    <Select
                      {...field}
                      label={t('fields.groupLeader')}
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{user.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.leaderId && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1 }}>
                        {t(errors.leaderId.message || '')}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            <Divider />

            {/* Members Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                  {t('sections.members', { count: currentMembers.length + membersToAdd.length })}
                </Typography>
                {!isCreateMode && (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddMembersDialog}
                    size="small"
                  >
                    {t('buttons.addMember')}
                  </Button>
                )}
                {isCreateMode && (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleOpenAddMembersDialog}
                    size="small"
                  >
                    {t('buttons.addMembers')}
                  </Button>
                )}
              </Box>

              {/* Members Table */}
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.member')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.email')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.role')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{t('table.headers.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Show members to be added */}
                    {membersToAdd.map((userId) => {
                      const user = users.find(u => u.id === userId);
                      if (!user) return null;
                      return (
                        <TableRow key={`add-${userId}`} sx={{ bgcolor: 'success.light', opacity: 0.7 }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={t('status.adding')} color="success" size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={t('roles.member')} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleUndoAddMember(userId)}
                              sx={{ color: 'warning.main' }}
                              title={t('tooltips.undoAdd')}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Show current members (only in edit mode) */}
                    {!isCreateMode && currentMembers.map((member) => {
                      const isMarkedForRemoval = membersToRemove.includes(member.userId);
                      return (
                        <TableRow
                          key={member.userId}
                          hover
                          sx={{
                            opacity: isMarkedForRemoval ? 0.5 : 1,
                            bgcolor: isMarkedForRemoval ? 'error.light' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {member.user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {member.user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {member.user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {member.userId === watchedLeaderId ? (
                              <Chip
                                label={t('roles.leader')}
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            ) : isMarkedForRemoval ? (
                              <Chip label={t('status.removing')} color="error" size="small" />
                            ) : (
                              <Chip
                                label={t('roles.member')}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {member.userId !== watchedLeaderId && (
                              isMarkedForRemoval ? (
                                <IconButton
                                  size="small"
                                  onClick={() => handleUndoRemoveMember(member.userId)}
                                  sx={{ color: 'warning.main' }}
                                  title={t('tooltips.undoRemove')}
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveMemberFromQueue(member.userId)}
                                  disabled={removeMemberMutation.isPending}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'error.light',
                                      color: 'error.contrastText',
                                    }
                                  }}
                                  title={t('tooltips.markForRemoval')}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {currentMembers.length === 0 && membersToAdd.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {isCreateMode ? t('messages.noMembersAdded') : t('messages.noMembers')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isCreateMode ? t('messages.addMembersBeforeCreate') : t('messages.addMembersToWork')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button
            onClick={handleSubmit(handleSaveAllChanges)}
            variant="contained"
            disabled={
              !hasUnsavedChanges() ||
              updateGroupMutation.isPending ||
              createGroupMutation.isPending ||
              addMemberMutation.isPending ||
              removeMemberMutation.isPending
            }
          >
            {isCreateMode ? t('buttons.createGroup') : (hasUnsavedChanges() ? t('buttons.saveAllChanges') : t('buttons.noChanges'))}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog
        open={addMembersDialogOpen}
        onClose={handleCloseAddMembersDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">{t('dialog.addMembers.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dialog.addMembers.description')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <List sx={{ width: '100%' }}>
            {availableUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <ListItem
                  key={user.id}
                  onClick={() => handleToggleUserSelection(user.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'inherit',
                    '&:hover': {
                      bgcolor: isSelected ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                </ListItem>
              );
            })}
            {availableUsers.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={t('messages.noAvailableUsers')}
                  secondary={t('messages.allUsersAreMembers')}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAddMembersDialog}>
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={handleConfirmAddMembers}
            variant="contained"
            disabled={selectedUsers.length === 0}
          >
            {t('buttons.addSelectedMembers', { count: selectedUsers.length })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
