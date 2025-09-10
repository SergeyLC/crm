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
  IconButton,
  Modal,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { Group, PipelineGroup } from "@/entities/pipeline/model/types";

interface PipelineGroupsProps {
  pipelineId?: string;
  pipelineGroups?: PipelineGroup[];
  availableGroups: Group[];
  onAddGroups: (groupIds: string[]) => Promise<void>;
  onRemoveGroup: (groupId: string) => Promise<void>;
}

// Stile für Modales Fenster
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '80vh',
  overflow: 'auto'
};

export const PipelineGroups: React.FC<PipelineGroupsProps> = ({
  pipelineGroups,
  availableGroups,
  onAddGroups,
  onRemoveGroup
}) => {
  const { t } = useTranslation("PipelineGroups");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedGroupsToAdd, setSelectedGroupsToAdd] = useState<string[]>([]);
  
  // Öffnen/Schließen des Modals
  const handleOpenGroupModal = () => setGroupModalOpen(true);
  const handleCloseGroupModal = () => {
    setGroupModalOpen(false);
    setSelectedGroupsToAdd([]);
  };
  
  // Gruppenauswahl umschalten
  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupsToAdd(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };
  
  // Ausgewählte Gruppen hinzufügen
  const handleAddSelectedGroups = async () => {
    if (!selectedGroupsToAdd.length) return;
    
    try {
      await onAddGroups(selectedGroupsToAdd);
      handleCloseGroupModal();
    } catch (error) {
      console.error("Error adding groups:", error);
    }
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">{t("groups")}</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleOpenGroupModal}
            disabled={ availableGroups.length === 0}
          >
            {t("addGroups")}
          </Button>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("name")}</TableCell>
                <TableCell>{t("description")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pipelineGroups?.length ? (
                pipelineGroups.map((pg) => (
                  <TableRow key={pg.groupId}>
                    <TableCell>{pg.group.name}</TableCell>
                    <TableCell>{pg.group.description}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onRemoveGroup(pg.groupId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    {t("noGroupsAssigned")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Modal zum Hinzufügen von Gruppen */}
      <Modal
        open={groupModalOpen}
        onClose={handleCloseGroupModal}
        aria-labelledby="add-groups-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="add-groups-modal-title" variant="h6" component="h2" gutterBottom>
            {t("selectGroupsToAdd")}
          </Typography>
          
          <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
            {availableGroups.map((group) => (
              <ListItem 
                key={group.id} 
                dense 
                component="button"
                onClick={() => handleToggleGroup(group.id)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedGroupsToAdd.includes(group.id)}
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
            {availableGroups.length === 0 && (
              <ListItem>
                <ListItemText primary={t("noAvailableGroups")} />
              </ListItem>
            )}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCloseGroupModal}>{t("cancel")}</Button>
            <Button 
              variant="contained" 
              onClick={handleAddSelectedGroups}
              disabled={selectedGroupsToAdd.length === 0}
            >
              {t("add")}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};