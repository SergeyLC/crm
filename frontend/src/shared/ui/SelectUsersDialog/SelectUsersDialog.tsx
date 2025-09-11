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
 * - Search and filter functionality
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
 * - searchPlaceholder: Placeholder text for the search field
 * - noSearchResultsMessage: Message to display when search returns no results
 * - filterUsers: Custom function to filter users based on search term
 */

"use client";
import React, { useState, useEffect } from 'react';
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
  TextField,
  Box,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
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
  searchPlaceholder?: string;
  noSearchResultsMessage?: string;
  filterUsers?: (users: User[], searchTerm: string) => User[];
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
  searchPlaceholder,
  noSearchResultsMessage,
  filterUsers,
}: SelectUsersDialogProps) {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when dialog opens or closes
  useEffect(() => {
    if (open) {
      setSearchTerm('');
    }
  }, [open]);

  // Filter users based on search term
  const filteredUsers = searchTerm.trim() === '' 
    ? availableUsers
    : filterUsers
      ? filterUsers(availableUsers, searchTerm)
      : availableUsers.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );

  // Determine if we're showing "no results" because of search filtering
  const isFilteredEmpty = searchTerm.trim() !== '' && filteredUsers.length === 0;

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
        {/* Search field */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder || t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
            disabled={isPending || availableUsers.length === 0}
          />
        </Box>

        {/* Users list */}
        <List dense sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
          {filteredUsers.map((user) => {
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

          {/* Empty states */}
          {isFilteredEmpty && (
            <ListItem>
              <ListItemText 
                primary={noSearchResultsMessage || t('noSearchResults')} 
              />
            </ListItem>
          )}

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