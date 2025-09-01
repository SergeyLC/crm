"use client";

import React from "react";
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { DealUpsertForm } from "./DealUpsertForm";
import {
  useGetDealByIdQuery,
  useUpdateDealMutation,
  useCreateDealMutation,
  dealKeys,
} from "@/entities";
import type { CreateDealDTO, UpdateDealDTO } from "@/entities";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function DealEditDialog({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation('deal');
  const { data, isLoading } = useGetDealByIdQuery(id || "");
  const updateDeal = useUpdateDealMutation();
  const createDeal = useCreateDealMutation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = React.useCallback(
    async (values: CreateDealDTO | UpdateDealDTO, shouldCreate?: boolean) => {
      if (!id || shouldCreate) {
        await createDeal.mutateAsync({ ...values, creatorId: user?.id } as CreateDealDTO);
        queryClient.invalidateQueries({ queryKey: dealKeys.all });
        onClose?.();
        return;
      }
      if (!values) {
        console.error("No deal data found for update");
        return;
      }
      // Update the deal with the provided values
      // Assuming the API expects an object with an id and the updated values
      if (typeof values?.potentialValue === "string") {
        values.potentialValue = parseFloat(values.potentialValue);
      }
      if (values.creatorId !== undefined) {
        values.creatorId = undefined;
      }
      if (values.contactId !== undefined) {
        values.contactId = undefined;
      }

      await updateDeal.mutateAsync({ id: id, body: values as UpdateDealDTO });
      console.log("Deal updated with id:", id, "and values:", values);
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
      onClose?.();
    },
    [id, user, queryClient, updateDeal, createDeal, onClose]
  );

  if (!open) return null;
  // if (isLoading)
  //   return (
  //     <Dialog open={open}>
  //       <DialogTitle>Loading...</DialogTitle>
  //     </Dialog>
  //   );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{id ? t('dialog.edit') : t('dialog.create')}</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            disabled={isLoading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
    {isLoading && id ? (
          <Box display="flex" justifyContent="center" my={4}>
      <CircularProgress />
          </Box>
        ) : (
          <DealUpsertForm
            initialData={data}
            dealId={id}
      onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
