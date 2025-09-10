"use client";

import { useState } from "react";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  TableContainer,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import { useAllPipelines, useDeletePipeline } from "@/entities/pipeline";
import { useTranslation } from "react-i18next";
import { PipelineFormDialog } from "@/features/pipeline";
import { ConfirmDeleteDialog } from "@/shared/";

export const PipelineManagement = () => {
  const { t } = useTranslation("PipelineManagement");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<
    string | undefined
  >(undefined);
  // Состояние для диалога подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<string | null>(null);

  const { data: pipelines, isLoading, isError } = useAllPipelines();
  const { mutateAsync: deletePipeline } = useDeletePipeline();

  // Открытие диалога создания новой pipeline
  const handleCreateClick = () => {
    setSelectedPipelineId(undefined); // Сбрасываем ID для создания новой
    setDialogOpen(true);
  };

  // Открытие диалога редактирования
  const handleEditClick = (id: string) => {
    setSelectedPipelineId(id);
    setDialogOpen(true);
  };

  // Закрытие диалога
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Открытие диалога подтверждения удаления
  const handleDeleteClick = (id: string) => {
    setPipelineToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Закрытие диалога подтверждения удаления
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPipelineToDelete(null);
  };

  // Подтверждение удаления pipeline
  const handleConfirmDelete = async () => {
    if (pipelineToDelete) {
      try {
        await deletePipeline(pipelineToDelete);
        handleCloseDeleteDialog();
      } catch (error) {
        console.error("Error deleting pipeline:", error);
      }
    }
  };

  if (isLoading) return <Box>{t("loading")}</Box>;
  if (isError) return <Box>{t("errorLoading")}</Box>;

  return (
    <Box sx={{ p: 1, pt: 3 }}>
      <Box
        sx={{ p: 0, display: "flex", justifyContent: "space-between", mb: 3 }}
      >
        <Typography variant="h5" component="h6">
          {t("pipelineManagement")}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          title={t("createPipeline")}
        >
          {t("createPipeline")}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <colgroup>
            <col />
            <col />
            <col style={{ width: "250px" }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>{t("name")}</TableCell>
              <TableCell>{t("description")}</TableCell>
              <TableCell sx={{ width: "250px", textAlign: "right" }}>
                {t("actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pipelines?.map((pipeline) => (
              <TableRow key={pipeline.id}>
                <TableCell>{pipeline.name}</TableCell>
                <TableCell>{pipeline.description}</TableCell>
                <TableCell sx={{ textAlign: "right" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleEditClick(pipeline.id)}
                    sx={{ mr: 1 }}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteClick(pipeline.id)}
                  >
                    {t("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог формы создания/редактирования pipeline */}
      <PipelineFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        pipelineId={selectedPipelineId}
      />

      {/* Используем переиспользуемый компонент диалога подтверждения удаления */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        title={t("deleteConfirmationTitle")}
        message={t("deleteConfirmationMessage")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};
