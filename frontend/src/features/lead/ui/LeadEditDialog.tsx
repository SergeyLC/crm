// src/features/lead/edit/ui/LeadEditDialog.tsx
import React from "react";
import { useDispatch } from "react-redux";

import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { LeadUpsertForm } from "./LeadUpsertForm";
import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useCreateLeadMutation,
  leadApi,
} from "@/entities/lead/api";
import type { CreateLeadDTO, UpdateLeadDTO } from "@/entities/lead/types";

export function LeadEditDialog({
  id,
  titleEdit = "Edit Lead",
  titleCreate = "Create Lead",
  open,
  onClose,
}: {
  id?: string;
  titleEdit?: string;
  titleCreate?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { data, isLoading } = useGetLeadByIdQuery(id || "", {
    skip: !id,
  });
  const [updateLead] = useUpdateLeadMutation();
  const [createLead] = useCreateLeadMutation();
  const dispatch = useDispatch();

  const handleSubmit = React.useCallback(
    async (values: CreateLeadDTO | UpdateLeadDTO, shouldCreate?: boolean) => {
      if (!id || shouldCreate) {
        await createLead(values as CreateLeadDTO);
        dispatch(leadApi.util.invalidateTags(["Leads"]));
        onClose?.();
        return;
      }
      if (!values) {
        console.error("No lead data found for update");
        return;
      }
      // Update the lead with the provided values
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

      await updateLead({ id: id, body: values as UpdateLeadDTO });
      dispatch(leadApi.util.invalidateTags(["Leads"]));
      onClose?.();
    },
    [id, dispatch, updateLead, createLead, onClose]
  );

  if (!open) return null;
  if (isLoading)
    return (
      <Dialog open={open}>
        <DialogTitle>Loading...</DialogTitle>
      </Dialog>
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{id ? titleEdit : titleCreate}</DialogTitle>
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
