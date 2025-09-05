"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AddMembersDialogProps } from '../types';

export function AddMembersDialog({
  open,
  onClose,
  availableUsers,
  selectedUsers,
  onToggleUser,
  onConfirm,
  isPending = false,
  isSaving = false,
}: AddMembersDialogProps) {
  const { t } = useTranslation('group');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ position: 'relative' }}>
        <Typography variant="h6" component="div">
          {t('dialog.addMembers.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          {t('dialog.addMembers.description')}
        </Typography>
        <IconButton
          aria-label={t('buttons.close')}
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={isSaving}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <List dense sx={{ width: '100%' }}>
          {availableUsers.map((user) => {
            const isSelected = selectedUsers.includes(user.id);
            return (
              <ListItem
                key={user.id}
                onClick={() => onToggleUser(user.id)}
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
                  <Checkbox edge="start" checked={isSelected} tabIndex={-1} disableRipple />
                </ListItemIcon>
                <ListItemAvatar>
                  <Avatar sx={{ width: 28, height: 28 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.name} />
                <ListItemText secondary={user.email} />
              </ListItem>
            );
          })}

          {availableUsers.length === 0 && (
            <ListItem>
              <ListItemText primary={t('messages.noAvailableUsers')} secondary={t('messages.allUsersAreMembers')} />
            </ListItem>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>{t('buttons.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" disabled={selectedUsers.length === 0 || isPending || isSaving}>
          {isPending || isSaving ? <CircularProgress size={18} color="inherit" /> : t('buttons.addSelectedMembers', { count: selectedUsers.length })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
