"use client";

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TextField, Stack, Paper, Typography, Box } from "@mui/material";
import {
  DealExt,
  CreateDealDTO,
  UpdateDealDTO,
  DealStageComponent,
  EnumDealStage,
} from "@/entities/deal";
import {
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  AppointmentsFormFieldsSet,
} from "@/entities/appointment";
import {
  ContactFormFields,
  CreateContactDTO,
  UpdateContactDTO,
} from "@/entities/contact";
import { UserSelect } from "@/entities/user";
import { CreateLeadDTO, UpdateLeadDTO, LeadExt } from "@/entities/lead";

export type BaseUpsertFormProps<TEntity, TState> = {
  initialData?: TEntity;
  onChange?: (data: TState) => void;
  formErrors?: { [key: string]: string[] };
  isDeal?: boolean;
};

export const BaseUpsertFields = <
  TEntity extends DealExt | LeadExt,
  TState extends CreateDealDTO | UpdateDealDTO | CreateLeadDTO | UpdateLeadDTO,
>({
  initialData,
  formErrors,
  onChange,
  isDeal = false,
}: BaseUpsertFormProps<TEntity, TState>) => {
  const { t } = useTranslation("form");

  const form: TState = initialData as unknown as TState;

  const setForm = useCallback(
    (data: TState) => {
      // console.log("BaseUpsertFields form data changed:", data);
      onChange?.(data);
    },
    [onChange]
  );

  // if creating a new form, set the assignee to the current user
  const handleAssigneeChange = React.useCallback(
    (userId: string | null) => {
      console.log("Assignee changed:", userId);
      setForm({
        ...form,
        assigneeId: userId,
      });

    },
    [form, setForm]
  );

  const handleChange = React.useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const value =
        e.target.name === "potentialValue"
          ? Number(e.target.value) || null
          : e.target.value;
      setForm({ ...form, [e.target.name]: value });
    },
    [form, setForm]
  );

  const handleAppointmentsChange = React.useCallback(
    (newAppointments: (CreateAppointmentDTO | UpdateAppointmentDTO)[]) => {
      setForm({
        ...form,
        appointments: newAppointments,
      });
    },
    [form, setForm]
  );

  const handleContactChange = React.useCallback(
    (contactData: CreateContactDTO | UpdateContactDTO) => {
      setForm({ ...form, contact: contactData });
    },
    [form, setForm]
  );

  const handleStageChange = React.useCallback(
    (stage: EnumDealStage) => {
      form.stage = stage as TState["stage"];
      setForm({ ...form, stage });
    },
    [form, setForm]
  );

  // Initialize form state with normalized data
  return (
    <Stack spacing={2}>
      {/* Lead Basic Information */}
      <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {t("leadInfo")}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              label={t("product")}
              name="productInterest"
              value={form?.productInterest || ""}
              onChange={handleChange}
              placeholder={t("productInterest")}
              variant="outlined"
              size="small"
              slotProps={{
                htmlInput: { "data-testid": "product-input" },
              }}
              error={!!formErrors?.productInterest}
              helperText={
                formErrors?.productInterest
                  ? formErrors.productInterest.join(" ")
                  : ""
              }
            />
            <TextField
              fullWidth
              label={t("potentialValue")}
              name="potentialValue"
              type="number"
              value={form?.potentialValue || ""}
              onChange={handleChange}
              placeholder={t("potentialValue")}
              variant="outlined"
              size="small"
              slotProps={{
                htmlInput: { "data-testid": "potential-value-input" },
              }}
              error={!!formErrors?.potentialValue}
              helperText={
                formErrors?.potentialValue
                  ? formErrors.potentialValue.join(" ")
                  : ""
              }
            />
          </Stack>
          <TextField
            label={t("title")}
            name="title"
            value={form?.title || ""}
            onChange={handleChange}
            placeholder={t("title")}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { "data-testid": "title-input" },
            }}
            error={!!formErrors?.title}
            helperText={
              formErrors?.title ? formErrors.title.join(" ") : ""
            }
          />
        </Stack>
      </Paper>
      {/* {(form?.stage !== 'LEAD') && ( */}
      <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
        <DealStageComponent
          stage={form?.stage || (isDeal ? "QUALIFIED" : "LEAD")}
          onChange={handleStageChange}
        />
      </Paper>
      {/* )} */}
      {/* Contact Section */}
      <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {t("contactInfo")}
          </Typography>
          <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
            <ContactFormFields
              contactData={form?.contact}
              onChange={handleContactChange}
            />
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {t("owner")}
          </Typography>
          <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
            <UserSelect
              value={form?.assigneeId || null}
              label={t("assignee")}
              onChange={handleAssigneeChange}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Appointments Section */}
      <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {t("appointments")}
          </Typography>
          <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
            <AppointmentsFormFieldsSet
              appointmentsData={form?.appointments}
              onChange={handleAppointmentsChange}
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
