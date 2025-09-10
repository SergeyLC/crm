"use client";

import { useState } from "react";
import {
  Box, 
  Button, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { User, PipelineUser } from "@/entities/pipeline/model/types";
import { SelectUsersDialog } from "@/shared/ui"; // Импортируем переиспользуемый компонент

interface PipelineUsersProps {
  pipelineId?: string;
  pipelineUsers?: PipelineUser[];
  availableUsers: User[];
  onAddUsers: (userIds: string[]) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
}

export const PipelineUsers: React.FC<PipelineUsersProps> = ({
  pipelineUsers,
  availableUsers,
  onAddUsers,
  onRemoveUser
}) => {
  const { t } = useTranslation("PipelineUsers");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  
  // Открыть/закрыть диалог выбора пользователей
  const handleOpenUserDialog = () => setUserDialogOpen(true);
  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedUsersToAdd([]);
  };
  
  // Переключение выбора пользователя
  const handleToggleUser = (userId: string) => {
    setSelectedUsersToAdd(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  // Добавление выбранных пользователей
  const handleAddSelectedUsers = async () => {
    if (!selectedUsersToAdd.length) return;
    
    try {
      setIsAddingUsers(true);
      await onAddUsers(selectedUsersToAdd);
      handleCloseUserDialog();
    } catch (error) {
      console.error("Error adding users:", error);
    } finally {
      setIsAddingUsers(false);
    }
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">{t("users")}</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleOpenUserDialog}
            disabled={availableUsers.length === 0}
          >
            {t("addUsers")}
          </Button>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("name")}</TableCell>
                <TableCell>{t("email")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pipelineUsers?.length ? (
                pipelineUsers.map((pu) => (
                  <TableRow key={pu.userId}>
                    <TableCell>{pu.user.name}</TableCell>
                    <TableCell>{pu.user.email}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onRemoveUser(pu.userId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    {t("noUsersAssigned")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <SelectUsersDialog
        open={userDialogOpen}
        title={t("selectUsersToAdd")}
        description={t("selectUsersDescription")} 
        confirmButtonText={t("addSelectedUsers", { count: selectedUsersToAdd.length })} 
        onClose={handleCloseUserDialog}
        availableUsers={availableUsers}
        selectedUserIds={selectedUsersToAdd}
        onToggleUser={handleToggleUser}
        onConfirm={handleAddSelectedUsers}
        isPending={false}
        isSaving={isAddingUsers}
        emptyListMessage={t("noAvailableUsers")}
      />
    </>
  );
};