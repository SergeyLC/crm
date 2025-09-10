"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Box, Paper, Typography, Button, Tabs, Tab, 
  TextField, List, ListItem, ListItemText, Checkbox, 
  ListItemSecondaryAction, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  usePipeline,
  useUpdatePipeline,
  useAssignUsersToPipeline,
  useRemoveUserFromPipeline,
  useAssignGroupsToPipeline,
  useRemoveGroupFromPipeline,
  UpdatePipelineDTO,
  Pipeline,
  useAllUsers,
  useAllGroups
} from '@/entities/pipeline';
import { useTranslation } from 'react-i18next';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pipeline-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const PipelineDetail = () => {
  const { t } = useTranslation('pipeline');
  const { id } = useParams();
  const pipelineId = Array.isArray(id) ? id[0] : id || (() => { throw new Error('Pipeline ID is required'); })();

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [pipelineData, setPipelineData] = useState<Pipeline | null>(null);

  // Fetch pipeline data
  const { data: pipeline, isLoading } = usePipeline(pipelineId);
  
  // Используем хуки для мутаций из '@/entities/pipeline'
  const { mutateAsync: updatePipelineMutation } = useUpdatePipeline();
  const { mutateAsync: assignUsersMutation } = useAssignUsersToPipeline();
  const { mutateAsync: removeUserMutation } = useRemoveUserFromPipeline();
  const { mutateAsync: assignGroupsMutation } = useAssignGroupsToPipeline();
  const { mutateAsync: removeGroupMutation } = useRemoveGroupFromPipeline();
  const { data: allUsers } = useAllUsers();
  const { data: allGroups } = useAllGroups();

  useEffect(() => {
    if (pipeline) {
      setPipelineData(pipeline);
    }
  }, [pipeline]);


  const handleUpdatePipeline = () => {
    if (pipelineData) {
      // const { id, ...data } = pipelineData;
      updatePipelineMutation({
        id: pipelineId,
        data: pipelineData as UpdatePipelineDTO,
      }).then(() => {
        setEditMode(false);
      });
    }
  };

  const handleAssignUser = (userId: string) => {
    assignUsersMutation({
      pipelineId,
      userIds: [userId]
    });
  };
  
  const handleRemoveUser = (userId: string) => {
    removeUserMutation({
      pipelineId,
      userId
    });
  };
  
  const handleAssignGroup = (groupId: string) => {
    assignGroupsMutation({
      pipelineId,
      groupIds: [groupId]
    });
  };
  
  const handleRemoveGroup = (groupId: string) => {
    removeGroupMutation({
      pipelineId,
      groupId
    });
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  if (isLoading) return <Box>{t('loading')}</Box>;
  if (!pipeline) return <Box>{t('pipelineNotFound')}</Box>;
  
  // Get assigned users and groups
  const assignedUserIds = new Set(pipeline.users?.map(u => u.userId) || []);
  const assignedGroupIds = new Set(pipeline.groups?.map(g => g.groupId) || []);
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('pipelineDetails')}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="pipeline tabs">
          <Tab label={t('information')} />
          <Tab label={t('users')} />
          <Tab label={t('groups')} />
        </Tabs>
      </Box>
      
      {/* Pipeline Information Tab */}
      <TabPanel value={tabValue} index={0}>
        {editMode ? (
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('name')}
              value={pipelineData?.name}
              onChange={(e) => setPipelineData({...pipelineData as Pipeline, name: e.target.value})}
              margin="normal"
            />§
            <TextField
              fullWidth
              label={t('description')}
              value={pipelineData?.description || ''}
              onChange={(e) => setPipelineData({...pipelineData as Pipeline, description: e.target.value})}
              margin="normal"
              multiline
              rows={4}
            />
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleUpdatePipeline}
                sx={{ mr: 1 }}
              >
                {t('save')}
              </Button>
              <Button onClick={() => setEditMode(false)}>
                {t('cancel')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">{t('name')}: {pipeline.name}</Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              {t('description')}: {pipeline.description || t('noDescription')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setEditMode(true)}
            >
              {t('edit')}
            </Button>
          </Box>
        )}
      </TabPanel>
      
      {/* Users Assignment Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Assigned Users */}
          <Paper sx={{ flex: 1, p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              {t('assignedUsers')}
            </Typography>
            <List>
              {pipeline.users?.map(pu => (
                <ListItem key={pu.userId}>
                  <ListItemText 
                    primary={pu.user.name} 
                    secondary={pu.user.email} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleRemoveUser(pu.userId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {pipeline.users?.length === 0 && (
                <ListItem>
                  <ListItemText primary={t('noAssignedUsers')} />
                </ListItem>
              )}
            </List>
          </Paper>
          
          {/* Available Users */}
          <Paper sx={{ flex: 1, p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              {t('availableUsers')}
            </Typography>
            <List>
              {allUsers?.filter(user => !assignedUserIds.has(user.id))
                .map(user => (
                  <ListItem key={user.id}>
                    <ListItemText 
                      primary={user.name} 
                      secondary={user.email} 
                    />
                    <Checkbox
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAssignUser(user.id);
                        }
                      }}
                    />
                  </ListItem>
                ))}
              {allUsers?.filter(user => !assignedUserIds.has(user.id)).length === 0 && (
                <ListItem>
                  <ListItemText primary={t('noAvailableUsers')} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      </TabPanel>
      
      {/* Groups Assignment Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Assigned Groups */}
          <Paper sx={{ flex: 1, p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              {t('assignedGroups')}
            </Typography>
            <List>
              {pipeline.groups?.map(pg => (
                <ListItem key={pg.groupId}>
                  <ListItemText 
                    primary={pg.group.name} 
                    // secondary={pg.group.description} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleRemoveGroup(pg.groupId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {pipeline.groups?.length === 0 && (
                <ListItem>
                  <ListItemText primary={t('noAssignedGroups')} />
                </ListItem>
              )}
            </List>
          </Paper>
          
          {/* Available Groups */}
          <Paper sx={{ flex: 1, p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              {t('availableGroups')}
            </Typography>
            <List>
              {allGroups?.filter(group => !assignedGroupIds.has(group.id))
                .map(group => (
                  <ListItem key={group.id}>
                    <ListItemText 
                      primary={group.name} 
                      // secondary={group.description} 
                    />
                    <Checkbox
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAssignGroup(group.id);
                        }
                      }}
                    />
                  </ListItem>
                ))}
              {allGroups?.filter(group => !assignedGroupIds.has(group.id)).length === 0 && (
                <ListItem>
                  <ListItemText primary={t('noAvailableGroups')} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      </TabPanel>
    </Paper>
  );
};