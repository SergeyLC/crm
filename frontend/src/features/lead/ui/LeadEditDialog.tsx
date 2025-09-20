"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { LeadUpsertForm } from "./LeadUpsertForm";
import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useCreateLeadMutation,
} from "@/entities/lead";
import type { CreateLeadDTO, UpdateLeadDTO } from "@/entities/lead/model/types";
import { QueryKeyType } from "@/shared";

export function LeadEditDialog({
  id,
  titleEdit,
  titleCreate,
  open,
  onClose,
  invalidateKeys,
}: {
  id?: string;
  titleEdit?: string;
  titleCreate?: string;
  open?: boolean;
  onClose?: () => void;
  invalidateKeys?: QueryKeyType[];
}) {
  const { t } = useTranslation("lead");
  const { data, isLoading } = useGetLeadByIdQuery(id || "", !!id);
  const updateLeadMutation = useUpdateLeadMutation();
  const createLeadMutation = useCreateLeadMutation();
  const queryClient = useQueryClient();

  const handleSubmit = React.useCallback(
    async (values: CreateLeadDTO | UpdateLeadDTO, shouldCreate?: boolean) => {
      if (!id || shouldCreate) {
        await createLeadMutation.mutateAsync(values as CreateLeadDTO);
        for (const key of invalidateKeys || []) {
          console.log("Invalidating key:", key);
          queryClient.invalidateQueries({ queryKey: key });
        }

        onClose?.();
        return;
      }
      if (!values) {
        console.error("No lead data found for update");
        return;
      }
      // Update the lead with the provided values
      if (typeof values?.potentialValue === "string") {
        values.potentialValue = parseFloat(values.potentialValue);
      }
      if (values.creatorId !== undefined) {
        values.creatorId = undefined;
      }
      if (values.contactId !== undefined) {
        values.contactId = undefined;
      }

      await updateLeadMutation.mutateAsync({
        id: id,
        body: values as UpdateLeadDTO,
      });

      for (const key of invalidateKeys || []) {
        console.log("Invalidating key:", key);
        queryClient.invalidateQueries({ queryKey: key });
      }

      onClose?.();
    },
    [
      id,
      updateLeadMutation,
      createLeadMutation,
      queryClient,
      invalidateKeys,
      onClose,
    ]
  );

  if (!open) return null;
  if (isLoading)
    return (
      <Dialog open={open}>
        <DialogTitle>{t("card.loading")}</DialogTitle>
      </Dialog>
    );

  const resolvedTitle = id
    ? titleEdit || t("dialog.editTitle")
    : titleCreate || t("dialog.createTitle");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{resolvedTitle}</DialogTitle>
      <DialogContent>
        <LeadUpsertForm
          initialData={data}
          leadId={id}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
