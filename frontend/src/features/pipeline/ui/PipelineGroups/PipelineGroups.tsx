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
import { Group, PipelineGroup } from "@/entities/pipeline/model/types";
import { SelectGroupsDialog } from "../SelectGroupsDialog/SelectGroupsDialog";

interface PipelineGroupsProps {
  pipelineId?: string;
  pipelineGroups?: PipelineGroup[];
  availableGroups: Group[];
  onAddGroups: (groupIds: string[]) => Promise<void>;
  onRemoveGroup: (groupId: string) => Promise<void>;
}

export const PipelineGroups: React.FC<PipelineGroupsProps> = ({
  pipelineGroups = [],
  availableGroups,
  onAddGroups,
  onRemoveGroup
}) => {
  const { t } = useTranslation("PipelineGroups");
  const [selectGroupsDialogOpen, setSelectGroupsDialogOpen] = useState(false);
  
  const handleAddGroups = async (groupIds: string[]) => {
    if (!groupIds.length) return;
    
    try {
      await onAddGroups(groupIds);
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
            onClick={() => setSelectGroupsDialogOpen(true)}
            disabled={availableGroups.length === 0}
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
      
      <SelectGroupsDialog
        open={selectGroupsDialogOpen}
        onClose={() => setSelectGroupsDialogOpen(false)}
        onSubmit={handleAddGroups}
        availableGroups={availableGroups}
      />
    </>
  );
};