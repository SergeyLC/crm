"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Typography,
  List,
  // ListItem,
  // ListItemText,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  deletePipeline,
  useAllPipelines,
} from "@/entities/pipeline/api/queries";
import { Pipeline } from "@/entities/pipeline/model/types";
import { useDialog } from "@/shared/lib/dialog";
import { PipelineForm } from "../PipelineForm/PipelineForm";
import { PipelineUsersDialog } from "../PipelineUsersDialog/PipelineUsersDialog";
import { PipelineGroupsDialog } from "../PipelineGroupsDialog/PipelineGroupsDialog";

export const PipelineList: React.FC = () => {
  const { t } = useTranslation("pipeline");

  const { data: pipelines, isLoading, isError, refetch } = useAllPipelines();
  // const {
  //   data: pipelines,
  //   isLoading,
  //   isError,
  //   refetch,
  // } = useQuery({
  //   queryKey: ["pipelines"],
  //   queryFn: fetchPipelines,
  // });

  const { openDialog } = useDialog();

  const handleCreatePipeline = () => {
    openDialog({
      title: t("createPipeline"),
      content: <PipelineForm onSuccess={refetch} />,
    });
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    openDialog({
      title: t("editPipeline"),
      content: <PipelineForm pipeline={pipeline} onSuccess={refetch} />,
    });
  };

  const handleDeletePipeline = async (id: string) => {
    if (window.confirm(t("confirmDelete"))) {
      try {
        await deletePipeline(id);
        refetch();
      } catch (error) {
        console.error("Failed to delete pipeline:", error);
      }
    }
  };

  const handleManageUsers = (pipeline: Pipeline) => {
    openDialog({
      title: `${t("manageUsers")} - ${pipeline.name}`,
      content: <PipelineUsersDialog pipeline={pipeline} onSuccess={refetch} />,
      maxWidth: "md",
    });
  };

  const handleManageGroups = (pipeline: Pipeline) => {
    openDialog({
      title: `${t("manageGroups")} - ${pipeline.name}`,
      content: <PipelineGroupsDialog pipeline={pipeline} onSuccess={refetch} />,
      maxWidth: "md",
    });
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (isError) {
    return <Typography color="error">{t("loadError")}</Typography>;
  }

  if (!pipelines || pipelines.length === 0) {
    return <Alert severity="info">{t("noPipelinesAvailable")}</Alert>;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">{t("pipelineManagement")}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreatePipeline}
        >
          {t("createPipeline")}
        </Button>
      </Box>

      {pipelines && pipelines.length > 0 ? (
        <List>
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">{pipeline.name}</Typography>
                    {pipeline.description && (
                      <Typography variant="body2" color="textSecondary">
                        {pipeline.description}
                      </Typography>
                    )}
                    <Box mt={1}>
                      <Typography variant="caption" display="block">
                        {t("users")}: {pipeline.users?.length}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {t("groups")}: {pipeline.groups?.length}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Tooltip title={t("manageUsers")}>
                      <IconButton onClick={() => handleManageUsers(pipeline)}>
                        <PersonIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("manageGroups")}>
                      <IconButton onClick={() => handleManageGroups(pipeline)}>
                        <GroupIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("edit")}>
                      <IconButton onClick={() => handleEditPipeline(pipeline)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("delete")}>
                      <IconButton
                        onClick={() => handleDeletePipeline(pipeline.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      ) : (
        <Typography>{t("noPipelines")}</Typography>
      )}
    </Box>
  );
};
