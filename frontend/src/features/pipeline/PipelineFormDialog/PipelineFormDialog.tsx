"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import {
  useCreatePipeline,
  useUpdatePipeline,
  usePipeline,
  useAllUsers,
  useAllGroups,
  useAssignUsersToPipeline,
  useAssignGroupsToPipeline,
  useRemoveUserFromPipeline,
  useRemoveGroupFromPipeline,
} from "@/entities/pipeline";

interface PipelineFormDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineId?: string;
}

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
      id={`pipeline-form-tabpanel-${index}`}
      aria-labelledby={`pipeline-form-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const PipelineFormDialog: React.FC<PipelineFormDialogProps> = ({
  open,
  onClose,
  pipelineId,
}) => {
  const { t } = useTranslation("pipeline");
  const [pipelineData, setPipelineData] = useState({
    name: "",
    description: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояния для пользователей и групп
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Получаем данные о пайплайне для редактирования
  const { data: existingPipeline, isLoading: isLoadingPipeline } = usePipeline(
    pipelineId || "",
    !!pipelineId && open
  );

  // Получаем списки пользователей и групп
  const { data: allUsers, isLoading: isLoadingUsers } = useAllUsers();
  const { data: allGroups, isLoading: isLoadingGroups } = useAllGroups();

  // Мутации для управления пользователями и группами
  const { mutateAsync: updatePipeline } = useUpdatePipeline();
  const { mutateAsync: createPipeline } = useCreatePipeline();
  const { mutateAsync: assignUsers } = useAssignUsersToPipeline();
  const { mutateAsync: assignGroups } = useAssignGroupsToPipeline();
  const { mutateAsync: removeUser } = useRemoveUserFromPipeline();
  const { mutateAsync: removeGroup } = useRemoveGroupFromPipeline();

  // Инициализация данных при открытии диалога
  useEffect(() => {
    if (existingPipeline && open) {
      setPipelineData({
        name: existingPipeline.name,
        description: existingPipeline.description || "",
      });

      // Инициализация выбранных пользователей и групп
      if (existingPipeline.users) {
        setSelectedUserIds(existingPipeline.users.map((u) => u.userId));
      }

      if (existingPipeline.groups) {
        setSelectedGroupIds(existingPipeline.groups.map((g) => g.groupId));
      }
    } else if (!pipelineId && open) {
      // Если создаем новую pipeline, сбрасываем форму
      setPipelineData({
        name: "",
        description: "",
      });
      setSelectedUserIds([]);
      setSelectedGroupIds([]);
      setTabValue(0); // Сбрасываем на первую вкладку
    }
  }, [existingPipeline, pipelineId, open]);

  // Обработчик изменения вкладок
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Обработчик добавления/удаления пользователя
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Обработчик добавления/удаления группы
  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // Обработчик удаления пользователя (для существующего pipeline)
  const handleRemoveUser = async (userId: string) => {
    if (!pipelineId) return;

    try {
      await removeUser({ pipelineId, userId });
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  // Обработчик удаления группы (для существующего pipeline)
  const handleRemoveGroup = async (groupId: string) => {
    if (!pipelineId) return;

    try {
      await removeGroup({ pipelineId, groupId });
      setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId));
    } catch (error) {
      console.error("Error removing group:", error);
    }
  };

  // Сохранение всей формы
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (pipelineId) {
        // Редактирование существующей pipeline
        await updatePipeline({
          id: pipelineId,
          data: pipelineData,
        });

        // Обновление пользователей и групп
        if (selectedUserIds.length > 0) {
          await assignUsers({
            pipelineId: pipelineId,
            userIds: selectedUserIds,
          });
        }

        if (selectedGroupIds.length > 0) {
          await assignGroups({
            pipelineId: pipelineId,
            groupIds: selectedGroupIds,
          });
        }
      } else {
        // Создание новой pipeline
        const newPipeline = await createPipeline(pipelineData);

        // После создания добавляем пользователей и группы
        if (selectedUserIds.length > 0 && newPipeline?.id) {
          await assignUsers({
            pipelineId: newPipeline.id,
            userIds: selectedUserIds,
          });
        }

        if (selectedGroupIds.length > 0 && newPipeline?.id) {
          await assignGroups({
            pipelineId: newPipeline.id,
            groupIds: selectedGroupIds,
          });
        }
      }

      // Закрываем диалог после успешного создания/редактирования
      onClose();
    } catch (error) {
      console.error("Error saving pipeline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!pipelineId;
  const dialogTitle = isEditMode ? t("editPipeline") : t("createNewPipeline");
  const submitButtonText = isEditMode ? t("save") : t("create");

  // Показываем загрузку если загружаем данные
  const isLoading =
    isEditMode && (isLoadingPipeline || isLoadingUsers || isLoadingGroups);

  // Получаем ID уже назначенных пользователей и групп
  const assignedUserIds = existingPipeline?.users?.map((u) => u.userId) || [];
  const assignedGroupIds =
    existingPipeline?.groups?.map((g) => g.groupId) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <CircularProgress sx={{ display: "block", m: "auto", my: 2 }} />
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="pipeline form tabs"
              >
                <Tab label={t("information")} id="pipeline-form-tab-0" />
                <Tab label={t("users")} id="pipeline-form-tab-1" />
                <Tab label={t("groups")} id="pipeline-form-tab-2" />
              </Tabs>
            </Box>

            {/* Вкладка с основной информацией */}
            <TabPanel value={tabValue} index={0}>
              <TextField
                autoFocus={tabValue === 0}
                margin="dense"
                label={t("pipelineName")}
                fullWidth
                value={pipelineData.name}
                onChange={(e) =>
                  setPipelineData({ ...pipelineData, name: e.target.value })
                }
                required
              />
              <TextField
                margin="dense"
                label={t("description")}
                fullWidth
                multiline
                rows={4}
                value={pipelineData.description}
                onChange={(e) =>
                  setPipelineData({
                    ...pipelineData,
                    description: e.target.value,
                  })
                }
              />
            </TabPanel>

            {/* Вкладка с пользователями */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Назначенные пользователи */}
                <Paper
                  sx={{ flex: 1, p: 2, maxHeight: 300, overflow: "auto" }}
                  elevation={1}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {t("assignedUsers")}
                  </Typography>
                  <List dense>
                    {pipelineId &&
                      existingPipeline?.users?.map((pu) => (
                          <ListItem key={pu.userId}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveUser(pu.userId)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={pu.user.name}
                              secondary={pu.user.email}
                            />
                          </ListItem>
                      ))}
                    {(!pipelineId || !existingPipeline?.users?.length) && (
                      <ListItem>
                        <ListItemText primary={t("noAssignedUsers")} />
                      </ListItem>
                    )}
                  </List>
                </Paper>

                {/* Доступные пользователи */}
                <Paper
                  sx={{ flex: 1, p: 2, maxHeight: 300, overflow: "auto" }}
                  elevation={1}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {t("availableUsers")}
                  </Typography>
                  <List dense>
                    {allUsers
                      ?.filter((user) => !assignedUserIds.includes(user.id))
                      .map((user) => (
                        <ListItem key={user.id}>
                          <ListItemText
                            primary={user.name}
                            secondary={user.email}
                          />
                          <Checkbox
                            edge="end"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleToggleUser(user.id)}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    {!allUsers?.length && (
                      <ListItem>
                        <ListItemText primary={t("noAvailableUsers")} />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>
            </TabPanel>

            {/* Вкладка с группами */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Назначенные группы */}
                <Paper
                  sx={{ flex: 1, p: 2, maxHeight: 300, overflow: "auto" }}
                  elevation={1}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {t("assignedGroups")}
                  </Typography>
                  <List dense>
                    {pipelineId &&
                      existingPipeline?.groups?.map((pg) => (
                        <ListItem
                          key={pg.groupId}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveGroup(pg.groupId)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={pg.group.name}
                            secondary={pg.group.description}
                          />
                        </ListItem>
                      ))}
                    {(!pipelineId || !existingPipeline?.groups?.length) && (
                      <ListItem>
                        <ListItemText primary={t("noAssignedGroups")} />
                      </ListItem>
                    )}
                  </List>
                </Paper>

                {/* Доступные группы */}
                <Paper
                  sx={{ flex: 1, p: 2, maxHeight: 300, overflow: "auto" }}
                  elevation={1}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {t("availableGroups")}
                  </Typography>
                  <List dense>
                    {allGroups
                      ?.filter((group) => !assignedGroupIds.includes(group.id))
                      .map((group) => (
                        <ListItem key={group.id}>
                          <ListItemText
                            primary={group.name}
                            secondary={group.description}
                          />
                          <Checkbox
                            edge="end"
                            checked={selectedGroupIds.includes(group.id)}
                            onChange={() => handleToggleGroup(group.id)}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    {!allGroups?.length && (
                      <ListItem>
                        <ListItemText primary={t("noAvailableGroups")} />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>
            </TabPanel>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={isSubmitting || isLoading || !pipelineData.name.trim()}
        >
          {isSubmitting ? <CircularProgress size={24} /> : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
