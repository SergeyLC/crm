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
} from "@mui/material";
import {
  useAllPipelines,
  useDeletePipeline,
} from "@/entities/pipeline";
import { useTranslation } from "react-i18next";
import { PipelineFormDialog } from "../PipelineFormDialog/PipelineFormDialog";

export const PipelineManagement = () => {
  const { t } = useTranslation("pipeline");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(undefined);

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

  // Удаление pipeline
  const handleDelete = (id: string) => {
    if (window.confirm(t("deleteConfirmation"))) {
      deletePipeline(id);
    }
  };

  if (isLoading) return <Box>{t("loading")}</Box>;
  if (isError) return <Box>{t("errorLoading")}</Box>;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t("pipelineManagement")}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateClick}>
          {t("createPipeline")}
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("name")}</TableCell>
            <TableCell>{t("description")}</TableCell>
            <TableCell>{t("actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pipelines?.map((pipeline) => (
            <TableRow key={pipeline.id}>
              <TableCell>{pipeline.name}</TableCell>
              <TableCell>{pipeline.description}</TableCell>
              <TableCell>
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
                  onClick={() => handleDelete(pipeline.id)}
                >
                  {t("delete")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Используем новый компонент для формы */}
      <PipelineFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        pipelineId={selectedPipelineId}
      />
    </Paper>
  );
};
