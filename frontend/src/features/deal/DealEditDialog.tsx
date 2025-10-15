"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  DialogActions,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  useGetDealByIdQuery,
  useUpdateDealMutation,
  useCreateDealMutation,
  CreateDealDTO,
  DealExt,
  UpdateDealDTO,
} from "@/entities/deal";
import { Appointment, sanitizeAppointments } from "@/entities/appointment";
import { useAuth } from "@/features/auth/";
import { QueryKeyType } from "@/shared";
import { BaseUpsertFields } from "@/features/form";

export function DealEditDialog({
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
  const { t } = useTranslation("deal");
  const { enqueueSnackbar } = useSnackbar();
  const { data, isLoading } = useGetDealByIdQuery(id || "");
  const updateDeal = useUpdateDealMutation();
  const createDeal = useCreateDealMutation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  if (!id && isAuthenticated) {
    // If there's no ID and the user is authenticated, we can create a new deal
  }
  const handleSubmit = React.useCallback(
    async (values: CreateDealDTO | UpdateDealDTO) => {
      if (values?.appointments && values?.appointments?.length > 0) {
        values.appointments = sanitizeAppointments(
          values?.appointments
        ) as Appointment[];
      }

      if (!id) {
        try {
          await createDeal.mutateAsync({
            ...values,
            creator: user,
          } as CreateDealDTO);
          for (const key of invalidateKeys || []) {
            queryClient.invalidateQueries({ queryKey: key });
          }
          enqueueSnackbar(t("dialog.createSuccess"), {
            variant: "success",
            SnackbarProps: { "data-testid": "success-notification" } as Record<
              string,
              unknown
            >,
          });
          onClose?.();
          return;
        } catch (error) {
          console.error("Error creating deal:", error);
          enqueueSnackbar(t("dialog.createError"), {
            variant: "error",
            SnackbarProps: { "data-testid": "error-notification" } as Record<
              string,
              unknown
            >,
          });

          type Errors = {
            [key: string]: string[];
          };

          const err = error as { cause: { errors?: Errors } };
          if (err?.cause?.errors) {
            // Display each validation error
            for (const [key, messages] of Object.entries(
              err.cause.errors || {}
            )) {
              messages.forEach((message) => {
                console.error(`[${key}]:`, message);

                enqueueSnackbar(message, {
                  variant: "error",
                  SnackbarProps: {
                    "data-testid": "error-notification",
                  } as Record<string, unknown>,
                });
              });
            }
          }

          throw error; // Re-throw to let the test catch it
        }
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

      try {
        await updateDeal.mutateAsync({ id: id, body: values as UpdateDealDTO });
        for (const key of invalidateKeys || []) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        enqueueSnackbar(t("dialog.updateSuccess"), {
          variant: "success",
          SnackbarProps: { "data-testid": "success-notification" } as Record<
            string,
            unknown
          >,
        });
        onClose?.();
      } catch (error) {
        console.error("Error updating deal:", error);
        enqueueSnackbar(t("dialog.updateError"), {
          variant: "error",
          SnackbarProps: { "data-testid": "error-notification" } as Record<
            string,
            unknown
          >,
        });

        type Errors = {
          [key: string]: string[];
        };

        const err = error as { cause: { errors?: Errors } };
        if (err?.cause?.errors) {
          // Display each validation error
          for (const [key, messages] of Object.entries(
            err.cause.errors || {}
          )) {
            messages.forEach((message) => {
              console.error(`[${key}]:`, message);

              enqueueSnackbar(message, {
                variant: "error",
                SnackbarProps: {
                  "data-testid": "error-notification",
                } as Record<string, unknown>,
              });
            });
          }
        }

        throw error; // Re-throw to let the test catch it
      }
    },
    [id, user, queryClient, updateDeal, createDeal, invalidateKeys, onClose, enqueueSnackbar, t]
  );

  const [dealData, setDealData] = useState<CreateDealDTO | UpdateDealDTO>(
    data || (!id && isAuthenticated ? { assigneeId: user?.id || "" } : {})
  );

  const onChange = useCallback(
    (data: CreateDealDTO | UpdateDealDTO) => {
      setDealData(data);
    },
    [setDealData]
  );

  const onSubmitHandler = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // console.log("Submitting deal data:", dealData);
      handleSubmit(dealData);
    },
    [handleSubmit, dealData]
  );

  useEffect(() => {
    if (data) {
      setDealData(data);
    } else if (!id && isAuthenticated && user) {
      setDealData({ assigneeId: user.id });
    }
  }, [data, id, isAuthenticated, user]);

  return (
    <Dialog
      open={open || false}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "80vh", // Фиксированная высота диалога
          overflow: "auto", // Включает прокрутку, если контент превышает высоту
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <form
        id="deal-upsert-form"
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
            flexShrink: 0, // Не сжимается
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
              {id ? t("dialog.edit") : t("dialog.create")}
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
            flex: 1, // Занимает все доступное пространство
            overflow: "auto", // Включает прокрутку
            p: 2,
          }}
        >
          {isLoading && id ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress data-testid="deal-loading-spinner" />
            </Box>
          ) : (
            <BaseUpsertFields
              initialData={dealData as DealExt}
              onChange={onChange}
            />
          )}
        </DialogContent>

        {/* Фиксированный футер */}
        <DialogActions
          sx={{
            flexShrink: 0, // Не сжимается
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
            data-testid="cancel-button"
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            type="submit"
            form="deal-upsert-form"
            color="primary"
            variant="contained"
            disabled={isLoading || updateDeal.isPending || createDeal.isPending}
            sx={{ textTransform: "none" }}
            data-testid="submit-button"
          >
            {updateDeal.isPending || createDeal.isPending ? (
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
