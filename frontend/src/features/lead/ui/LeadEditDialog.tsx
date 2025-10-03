"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useCreateLeadMutation,
} from "@/entities/lead";
import type { CreateLeadDTO, LeadExt, UpdateLeadDTO } from "@/entities/lead";
import { QueryKeyType } from "@/shared";
import { useAuth } from "@/features/auth/";
import { BaseUpsertFields } from "@/features/form";
import { sanitizeAppointments } from "@/entities/appointment/lib/sanitizers";
import { Appointment } from "@/entities/appointment";

export function LeadEditDialog({
  id,
  open,
  onClose,
  invalidateKeys,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
  invalidateKeys?: QueryKeyType[];
}) {
  const { t } = useTranslation("lead");
  const { data, isLoading } = useGetLeadByIdQuery(id || "");
  const updateLead = useUpdateLeadMutation();
  const createLead = useCreateLeadMutation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  if (!id && isAuthenticated) {
    // If there's no ID and the user is authenticated, we can create a new lead
  }

  const handleSubmit = React.useCallback(
    async (values: CreateLeadDTO | UpdateLeadDTO) => {
      if (values?.appointments && values?.appointments?.length > 0) {
        values.appointments = sanitizeAppointments(
          values?.appointments
        ) as Appointment[];
      }
      if (!id) {
        // Create new lead
        await createLead.mutateAsync({
          ...values,
          creator: user,
        } as CreateLeadDTO);
        for (const key of invalidateKeys || []) {
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

      await updateLead.mutateAsync({ id: id, body: values as UpdateLeadDTO });
      for (const key of invalidateKeys || []) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      onClose?.();
    },
    [id, user, queryClient, updateLead, createLead, invalidateKeys, onClose]
  );

  const [leadData, setLeadData] = useState<CreateLeadDTO | UpdateLeadDTO>(
    data || (!id && isAuthenticated ? { assigneeId: user?.id || "" } : {})
  );

  const onChange = useCallback(
    (data: CreateLeadDTO | UpdateLeadDTO) => {
      setLeadData(data);
    },
    [setLeadData]
  );

  const onSubmitHandler = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(leadData);
    },
    [handleSubmit, leadData]
  );

  useEffect(() => {
    if (data) {
      setLeadData(data);
    } else if (!id && isAuthenticated && user) {
      setLeadData({ assigneeId: user.id });
    }
  }, [data, id, isAuthenticated, user]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "80vh",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <form
        id="lead-upsert-form"
        onSubmit={onSubmitHandler}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Фиксированный заголовок */}
        <DialogTitle
          sx={{
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">
              {id ? t("dialog.editTitle") : t("dialog.createTitle")}
            </Typography>
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

        {/* Прокручиваемый контент */}
        <DialogContent
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
          }}
        >
          {isLoading && id ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <BaseUpsertFields<LeadExt, CreateLeadDTO | UpdateLeadDTO>
              initialData={leadData as LeadExt}
              onChange={onChange}
            />
          )}
        </DialogContent>

        {/* Фиксированный футер */}
        <DialogActions
          sx={{
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            type="submit"
            form="lead-upsert-form"
            color="primary"
            variant="contained"
            disabled={isLoading || updateLead.isPending || createLead.isPending}
            sx={{ textTransform: "none" }}
          >
            {updateLead.isPending || createLead.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : id ? (
              t("dialog.update")
            ) : (
              t("dialog.create")
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
