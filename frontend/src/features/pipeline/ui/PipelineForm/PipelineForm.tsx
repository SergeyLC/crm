"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  CircularProgress, 
  TextField 
} from '@mui/material';
import { createPipeline, updatePipeline } from '@/entities/pipeline/api/queries';
import { Pipeline } from '@/entities/pipeline/model/types';

interface PipelineFormProps {
  pipeline?: Pipeline;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const PipelineForm: React.FC<PipelineFormProps> = ({ 
  pipeline, 
  onSuccess,
  onCancel 
}) => {
  const { t } = useTranslation("PipelineForm");
  const [name, setName] = useState(pipeline?.name || '');
  const [description, setDescription] = useState(pipeline?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!pipeline;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        await updatePipeline(pipeline.id, { name, description });
      } else {
        await createPipeline({ name, description });
      }
      onSuccess();
    } catch (err) {
      setError(t('saveFailed'));
      console.error('Failed to save pipeline:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label={t('pipelineName')}
        name="name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSubmitting}
      />
      <TextField
        margin="normal"
        fullWidth
        id="description"
        label={t('description')}
        name="description"
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isSubmitting}
      />
      {error && (
        <Box sx={{ color: 'error.main', mt: 2, textAlign: 'center' }}>
          {error}
        </Box>
      )}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{ mr: 2 }}
          >
            {t('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || !name}
        >
          {isSubmitting ? <CircularProgress size={24} /> : isEditMode ? t('update') : t('create')}
        </Button>
      </Box>
    </Box>
  );
};