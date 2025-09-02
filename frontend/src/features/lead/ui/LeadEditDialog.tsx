"use client";
import React from "react";
import { useTranslation } from "react-i18next";

import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { LeadUpsertForm } from "./LeadUpsertForm";
import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useCreateLeadMutation,
} from "@/entities/lead/api-tanstack";
import type { CreateLeadDTO, UpdateLeadDTO } from "@/entities/lead/types";

export function LeadEditDialog({
  id,
  titleEdit,
  titleCreate,
  open,
  onClose,
}: {
  id?: string;
  titleEdit?: string;
  titleCreate?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation("lead");
  const { data, isLoading } = useGetLeadByIdQuery(id || "", !!id);
  const updateLeadMutation = useUpdateLeadMutation();
  const createLeadMutation = useCreateLeadMutation();

  const handleSubmit = React.useCallback(
    async (values: CreateLeadDTO | UpdateLeadDTO, shouldCreate?: boolean) => {
      if (!id || shouldCreate) {
        await createLeadMutation.mutateAsync(values as CreateLeadDTO);
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

      await updateLeadMutation.mutateAsync({ id: id, body: values as UpdateLeadDTO });
      onClose?.();
    },
    [id, updateLeadMutation, createLeadMutation, onClose]
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
