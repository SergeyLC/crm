"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Box,
} from "@mui/material";
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
import { PipelineInfo } from "../PipelineInfo/PipelineInfo";
import { PipelineUsers } from "../PipelineUsers/PipelineUsers";
import { PipelineGroups } from "../PipelineGroups/PipelineGroups";
import {
  PipelineGroup,
  PipelineUser,
} from "@/entities/pipeline/model/types";

interface PipelineFormDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineId?: string;
}

export const PipelineFormDialog: React.FC<PipelineFormDialogProps> = ({
  open,
  onClose,
  pipelineId,
}) => {
  const { t } = useTranslation("PipelineFormDialog");
  const [pipelineData, setPipelineData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Для режима создания - списки выбранных пользователей/групп
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Для режима редактирования - дополнительные списки для отслеживания изменений
  const [addedUserIds, setAddedUserIds] = useState<string[]>([]);
  const [removedUserIds, setRemovedUserIds] = useState<string[]>([]);
  const [addedGroupIds, setAddedGroupIds] = useState<string[]>([]);
  const [removedGroupIds, setRemovedGroupIds] = useState<string[]>([]);

  // Загрузка данных
  const { data: existingPipeline, isLoading: isLoadingPipeline } = usePipeline(
    pipelineId || "", !!pipelineId && open,
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useAllUsers();
  const { data: allGroups, isLoading: isLoadingGroups } = useAllGroups();

  // Мутации
  const { mutateAsync: createPipeline } = useCreatePipeline();
  const { mutateAsync: updatePipeline } = useUpdatePipeline();
  const { mutateAsync: assignUsers } = useAssignUsersToPipeline();
  const { mutateAsync: assignGroups } = useAssignGroupsToPipeline();
  const { mutateAsync: removeUser } = useRemoveUserFromPipeline();
  const { mutateAsync: removeGroup } = useRemoveGroupFromPipeline();

  // Инициализация данных при открытии формы
  useEffect(() => {
    if (existingPipeline && open) {
      // Режим редактирования
      setPipelineData({
        name: existingPipeline.name,
        description: existingPipeline.description || "",
      });
      
      // Сбрасываем все списки изменений при открытии/переоткрытии
      setAddedUserIds([]);
      setRemovedUserIds([]);
      setAddedGroupIds([]);
      setRemovedGroupIds([]);
    } else if (!pipelineId && open) {
      // Режим создания
      setPipelineData({
        name: "",
        description: "",
      });
      setSelectedUserIds([]);
      setSelectedGroupIds([]);
    }
  }, [existingPipeline, pipelineId, open]);

  // Обработчики для основной информации
  const handleNameChange = (name: string) => {
    setPipelineData((prev) => ({ ...prev, name }));
  };

  const handleDescriptionChange = (description: string) => {
    setPipelineData((prev) => ({ ...prev, description }));
  };

  // Обработчики для пользователей
  const handleAddUsers = async (userIds: string[]) => {
    if (isEditMode) {
      // В режиме редактирования добавляем в список для последующего сохранения
      // Убираем пользователей, которые были ранее отмечены как удаленные
      const newAddedIds = userIds.filter(id => !removedUserIds.includes(id));
      setAddedUserIds(prev => [...prev, ...newAddedIds]);
      
      // Если какие-то из добавляемых пользователей были ранее отмечены как удаленные,
      // убираем их из списка удаленных
      setRemovedUserIds(prev => prev.filter(id => !userIds.includes(id)));
    } else {
      // В режиме создания добавляем в локальный список
      setSelectedUserIds(prev => [...prev, ...userIds]);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (isEditMode) {
      const originalUserIds = existingPipeline?.users?.map(u => u.userId) || [];
      
      if (originalUserIds.includes(userId)) {
        // Если пользователь был изначально назначен, добавляем в список для удаления
        setRemovedUserIds(prev => [...prev, userId]);
        // Если этот пользователь был в списке добавленных, удаляем оттуда
        setAddedUserIds(prev => prev.filter(id => id !== userId));
      } else if (addedUserIds.includes(userId)) {
        // Если этот пользователь был только добавлен, просто удаляем из списка добавленных
        setAddedUserIds(prev => prev.filter(id => id !== userId));
      }
    } else {
      // В режиме создания просто удаляем из локального списка
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Обработчики для групп
  const handleAddGroups = async (groupIds: string[]) => {
    if (isEditMode) {
      // В режиме редактирования добавляем в список для последующего сохранения
      // Убираем группы, которые были ранее отмечены как удаленные
      const newAddedIds = groupIds.filter(id => !removedGroupIds.includes(id));
      setAddedGroupIds(prev => [...prev, ...newAddedIds]);
      
      // Если какие-то из добавляемых групп были ранее отмечены как удаленные,
      // убираем их из списка удаленных
      setRemovedGroupIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      // В режиме создания добавляем в локальный список
      setSelectedGroupIds(prev => [...prev, ...groupIds]);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (isEditMode) {
      const originalGroupIds = existingPipeline?.groups?.map(g => g.groupId) || [];
      
      if (originalGroupIds.includes(groupId)) {
        // Если группа была изначально назначена, добавляем в список для удаления
        setRemovedGroupIds(prev => [...prev, groupId]);
        // Если эта группа была в списке добавленных, удаляем оттуда
        setAddedGroupIds(prev => prev.filter(id => id !== groupId));
      } else if (addedGroupIds.includes(groupId)) {
        // Если эта группа была только добавлена, просто удаляем из списка добавленных
        setAddedGroupIds(prev => prev.filter(id => id !== groupId));
      }
    } else {
      // В режиме создания просто удаляем из локального списка
      setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
    }
  };

  // Сохранение пайплайна
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (pipelineId) {
        // Обновление существующего пайплайна
        await updatePipeline({
          id: pipelineId,
          data: pipelineData,
        });
        
        // Применяем изменения пользователей
        if (addedUserIds.length > 0) {
          await assignUsers({
            pipelineId,
            userIds: addedUserIds,
          });
        }
        
        for (const userId of removedUserIds) {
          await removeUser({ pipelineId, userId });
        }
        
        // Применяем изменения групп
        if (addedGroupIds.length > 0) {
          await assignGroups({
            pipelineId,
            groupIds: addedGroupIds,
          });
        }
        
        for (const groupId of removedGroupIds) {
          await removeGroup({ pipelineId, groupId });
        }
      } else {
        // Создание нового пайплайна
        const newPipeline = await createPipeline(pipelineData);

        // Добавление выбранных пользователей и групп к новому пайплайну
        if (selectedUserIds.length > 0) {
          await assignUsers({
            pipelineId: newPipeline.id,
            userIds: selectedUserIds,
          });
        }

        if (selectedGroupIds.length > 0) {
          await assignGroups({
            pipelineId: newPipeline.id,
            groupIds: selectedGroupIds,
          });
        }
      }

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

  // Показываем индикатор загрузки
  const isLoading =
    isEditMode && (isLoadingPipeline || isLoadingUsers || isLoadingGroups);

  // Вычисляем эффективные списки пользователей и групп с учетом локальных изменений
  
  // Для режима редактирования:
  const effectiveUserIds = useMemo(() => {
    if (!isEditMode) return selectedUserIds;
    
    const originalIds = existingPipeline?.users?.map(u => u.userId) || [];
    // Добавляем новых и убираем удаленных
    return [...originalIds.filter(id => !removedUserIds.includes(id)), ...addedUserIds];
  }, [isEditMode, existingPipeline, selectedUserIds, addedUserIds, removedUserIds]);
  
  const effectiveGroupIds = useMemo(() => {
    if (!isEditMode) return selectedGroupIds;
    
    const originalIds = existingPipeline?.groups?.map(g => g.groupId) || [];
    // Добавляем новых и убираем удаленных
    return [...originalIds.filter(id => !removedGroupIds.includes(id)), ...addedGroupIds];
  }, [isEditMode, existingPipeline, selectedGroupIds, addedGroupIds, removedGroupIds]);

  // Доступные пользователи (не назначенные)
  const availableUsers = useMemo(() => {
    return allUsers?.filter(user => !effectiveUserIds.includes(user.id)) || [];
  }, [allUsers, effectiveUserIds]);
  
  // Доступные группы (не назначенные)
  const availableGroups = useMemo(() => {
    return allGroups?.filter(group => !effectiveGroupIds.includes(group.id)) || [];
  }, [allGroups, effectiveGroupIds]);

  // Создаем представление пользователей и групп для компонентов
  const effectivePipelineUsers = useMemo(() => {
    // Если редактирование, берем оригинальных пользователей, убираем удаленных и добавляем новых
    if (isEditMode) {
      const originalUsers = existingPipeline?.users || [];
      const remainingUsers = originalUsers.filter(u => !removedUserIds.includes(u.userId));
      
      const addedUsers = addedUserIds.map(userId => {
        const user = allUsers?.find(u => u.id === userId);
        return user ? {
          userId,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        } : null;
      }).filter(Boolean) as PipelineUser[];
      
      return [...remainingUsers, ...addedUsers];
    }
    
    // Если создание нового, создаем из выбранных IDs
    return selectedUserIds.map(userId => {
      const user = allUsers?.find(u => u.id === userId);
      return user ? {
        userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      } : null;
    }).filter(Boolean) as PipelineUser[];
  }, [
    isEditMode, 
    existingPipeline, 
    selectedUserIds, 
    allUsers, 
    addedUserIds, 
    removedUserIds
  ]);
  
  // Аналогично для групп
  const effectivePipelineGroups = useMemo(() => {
    if (isEditMode) {
      const originalGroups = existingPipeline?.groups || [];
      const remainingGroups = originalGroups.filter(g => !removedGroupIds.includes(g.groupId));
      
      const addedGroups = addedGroupIds.map(groupId => {
        const group = allGroups?.find(g => g.id === groupId);
        return group ? {
          groupId,
          group: {
            id: group.id,
            name: group.name,
            description: group.description,
          }
        } : null;
      }).filter(Boolean) as PipelineGroup[];
      
      return [...remainingGroups, ...addedGroups];
    }
    
    return selectedGroupIds.map(groupId => {
      const group = allGroups?.find(g => g.id === groupId);
      return group ? {
        groupId,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
        }
      } : null;
    }).filter(Boolean) as PipelineGroup[];
  }, [
    isEditMode, 
    existingPipeline, 
    selectedGroupIds, 
    allGroups, 
    addedGroupIds, 
    removedGroupIds
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <CircularProgress sx={{ display: "block", m: "auto", my: 2 }} />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Основная информация */}
            <PipelineInfo
              name={pipelineData.name}
              description={pipelineData.description}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
            />

            {/* Группы */}
            <PipelineGroups
              pipelineId={pipelineId}
              pipelineGroups={effectivePipelineGroups}
              availableGroups={availableGroups}
              onAddGroups={handleAddGroups}
              onRemoveGroup={handleRemoveGroup}
            />

            {/* Пользователи */}
            <PipelineUsers
              pipelineId={pipelineId}
              pipelineUsers={effectivePipelineUsers}
              availableUsers={availableUsers}
              onAddUsers={handleAddUsers}
              onRemoveUser={handleRemoveUser}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || isLoading || !pipelineData.name.trim()}
        >
          {isSubmitting ? <CircularProgress size={24} /> : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
