/**
 * Select Users Dialog Component
 * 
 * A reusable dialog for selecting multiple users from a list.
 * Can be used for adding members to a group, assigning users to pipelines, or any other
 * scenario where multiple users need to be selected from available options.
 * 
 * Features:
 * - Checkbox selection of multiple users
 * - Visual feedback for selected users
 * - Avatar display for each user
 * - Loading states for API operations
 * - Responsive design with Material UI components
 * 
 * Props:
 * - open: Controls the visibility of the dialog
 * - title: Main dialog title
 * - description: Optional subtitle or description text
 * - confirmButtonText: Text for the confirm button
 * - onClose: Callback function when the dialog is closed
 * - availableUsers: Array of users who can be selected
 * - selectedUserIds: Array of currently selected user IDs
 * - onToggleUser: Callback when a user is selected/deselected
 * - onConfirm: Callback when selection is confirmed
 * - isPending: Loading state for data fetching
 * - isSaving: Loading state for save operation
 * - emptyListMessage: Message to display when no users are available
 * - emptyListSubMessage: Optional secondary message for empty list
 */

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
import { User } from '@/shared/types';

interface SelectUsersDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmButtonText: string;
  onClose: () => void;
  availableUsers: User[];
  selectedUserIds: string[];
  onToggleUser: (userId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  isSaving?: boolean;
  emptyListMessage: string;
  emptyListSubMessage?: string;
}

export function SelectUsersDialog({
  open,
  title,
  description,
  confirmButtonText,
  onClose,
  availableUsers,
  selectedUserIds,
  onToggleUser,
  onConfirm,
  isPending = false,
  isSaving = false,
  emptyListMessage,
  emptyListSubMessage,
}: SelectUsersDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ position: 'relative' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" component="div">
            {description}
          </Typography>
        )}
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
            const isSelected = selectedUserIds.includes(user.id);
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
              <ListItemText 
                primary={emptyListMessage} 
                secondary={emptyListSubMessage} 
              />
            </ListItem>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>{t('buttons.cancel')}</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          disabled={selectedUserIds.length === 0 || isPending || isSaving}
        >
          {isPending || isSaving ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            confirmButtonText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}