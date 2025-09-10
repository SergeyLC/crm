"use client";

import { TextField, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

interface PipelineInfoProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const PipelineInfo: React.FC<PipelineInfoProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange
}) => {
  const { t } = useTranslation("PipelineInfo");

  return (
    <Box>
      <TextField
        autoFocus
        margin="dense"
        label={t("pipelineName")}
        fullWidth
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        required
      />
      <TextField
        margin="dense"
        label={t("description")}
        fullWidth
        multiline
        rows={2}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
    </Box>
  );
};