"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { assignUsersToPipeline, removeUserFromPipeline } from '@/entities/pipeline';
import { Pipeline, User } from '@/entities/pipeline/model/types';
import { useGetUsersQuery } from "@/entities/user";

interface PipelineUsersDialogProps {
  pipeline: Pipeline;
  onSuccess: () => void;
}

export const PipelineUsersDialog: React.FC<PipelineUsersDialogProps> = ({
  pipeline,
  onSuccess
}) => {
  const { t } = useTranslation("pipeline");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allUsers = [], isLoading, isError } = useGetUsersQuery(true);

  useEffect(() => {
    // Initialize selected users based on current pipeline assignments
    if (pipeline.users) {
      setSelectedUsers(pipeline.users.map((pu) => pu.userId));
    }
  }, [pipeline]);

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Find users to remove (were in pipeline.users but not in selectedUsers)
      const currentUserIds = pipeline.users.map((pu) => pu.userId);
      const usersToRemove = currentUserIds.filter(
        (id) => !selectedUsers.includes(id)
      );

      // Find users to add (in selectedUsers but not in pipeline.users)
      const usersToAdd = selectedUsers.filter(
        (id) => !currentUserIds.includes(id)
      );

      // Process removals
      for (const userId of usersToRemove) {
        await removeUserFromPipeline(pipeline.id, userId);
      }

      // Process additions (if any)
      if (usersToAdd.length > 0) {
        await assignUsersToPipeline(pipeline.id, usersToAdd);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to update pipeline users:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Typography color="error">{t("loadError")}</Typography>;
  }

  return (
    <Box sx={{ minWidth: 300, maxHeight: 500, overflow: "auto" }}>
      <Typography variant="subtitle1" mb={2}>
        {t("selectUsers")}:
      </Typography>
      <List>
        {allUsers &&
          allUsers.map((user: User) => (
            <ListItem
              key={user.id}
              dense
              component="button"
              onClick={() => handleToggleUser(user.id)}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedUsers.includes(user.id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary={user.name} secondary={user.email} />
            </ListItem>
          ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : t("save")}
        </Button>
      </Box>
    </Box>
  );
};