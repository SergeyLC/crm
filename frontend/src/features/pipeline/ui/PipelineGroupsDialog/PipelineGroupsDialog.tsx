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
import { useAllGroups, useAssignGroupsToPipeline } from '@/entities/pipeline';
import { Pipeline, Group } from '@/entities/pipeline/model/types';

interface PipelineGroupsDialogProps {
  pipeline: Pipeline;
  onSuccess: () => void;
}

export const PipelineGroupsDialog: React.FC<PipelineGroupsDialogProps> = ({
  pipeline,
  onSuccess
}) => {
  const { t } = useTranslation("PipelineGroupsDialog");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const { data: allGroups, isLoading, isError } = useAllGroups();
  const { mutateAsync: assignGroups, isPending: isSubmitting } = useAssignGroupsToPipeline();

  useEffect(() => {
    if (pipeline.groups) {
      setSelectedGroups(pipeline.groups.map(pg => pg.groupId));
    }
  }, [pipeline]);

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSave = async () => {
    try {
      await assignGroups({
        pipelineId: pipeline.id,
        groupIds: selectedGroups
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update pipeline groups:', error);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Typography color="error">{t('loadError')}</Typography>;
  }

  return (
    <Box sx={{ minWidth: 300, maxHeight: 500, overflow: 'auto' }}>
      <Typography variant="subtitle1" mb={2}>
        {t('selectGroups')}:
      </Typography>
      <List>
        {allGroups && allGroups.map((group: Group) => (
          <ListItem key={group.id} dense component="button" onClick={() => handleToggleGroup(group.id)}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedGroups.includes(group.id)}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText 
              primary={group.name} 
              secondary={group.description}
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : t('save')}
        </Button>
      </Box>
    </Box>
  );
};