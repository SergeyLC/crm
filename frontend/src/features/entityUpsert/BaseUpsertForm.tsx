"use client";

import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import {
  DealExt,
  CreateDealDTO,
  UpdateDealDTO,
  DealStageComponent,
} from "@/entities/deal";
import {
  AppointmentExt,
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
import { useAuth } from "@/features/auth/hooks/useAuth";

export type BaseUpsertFormProps<TEntity, TState> = {
  initialData?: TEntity;
  titleCreate?: string;
  titleUpdate?: string;
  onSubmit?: (form: TState) => void;
  isDeal?: boolean;
};

export const BaseUpsertForm = <
  TEntity extends DealExt | LeadExt,
  TState extends CreateDealDTO | UpdateDealDTO | CreateLeadDTO | UpdateLeadDTO,
>({
  initialData,
  titleCreate = "Create",
  titleUpdate = "Update",
  onSubmit,
  isDeal = false,
}: BaseUpsertFormProps<TEntity, TState>) => {
  const isNew = !initialData;

  const [form, setForm] = useState<TState>(initialData as unknown as TState);
  const [needSubmit, setNeedSubmit] = useState(false);
  const { user, isAuthenticated } = useAuth();
  // If the user is not authenticated, we should not allow form interaction
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     // Handle unauthenticated state (e.g., show a message or redirect)
  //   }
  // }, [isAuthenticated]);

  // if creating a new form, set the assignee to the current user

  const handleAssigneeChange = React.useCallback(
    (userId: string | null) => {
      setForm((prev) => ({
        ...prev,
        assigneeId: userId,
      }));
    },
    [setForm]
  );

  useEffect(() => {
    if (isNew && user && isAuthenticated) {
      handleAssigneeChange(user.id);
    }
  }, [user, isAuthenticated, handleAssigneeChange, isNew]);

  useEffect(() => {
    if (needSubmit) {
      onSubmit?.({ ...form });
      setNeedSubmit(false);
    }
  }, [needSubmit, form, onSubmit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNeedSubmit(true);
  };

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

      setForm((prev) => ({
        ...prev,
        [e.target.name]: value,
      }));
    },
    [setForm]
  );

  const handleAppointmentsChange = React.useCallback(
    (newAppointments: (CreateAppointmentDTO | UpdateAppointmentDTO)[]) => {
      setForm((prev) => ({
        ...prev,
        appointments: newAppointments,
      }));
    },
    [setForm]
  );

  const handleContactChange = React.useCallback(
    (contactData: CreateContactDTO | UpdateContactDTO) => {
      setForm((prev) => ({
        ...prev,
        contact: contactData,
      }));
    },
    [setForm]
  );

  // Initialize form state with normalized data
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <form
        onSubmit={handleSubmit}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
          <Stack spacing={2}>
            {/* Lead Basic Information */}
            <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
              <Stack spacing={1.5}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "primary.main", fontWeight: 600 }}
                >
                  Lead Information
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Product"
                    name="productInterest"
                    value={form?.productInterest || ""}
                    onChange={handleChange}
                    placeholder="Product Interest"
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Wert"
                    name="potentialValue"
                    type="number"
                    value={form?.potentialValue || ""}
                    onChange={handleChange}
                    placeholder="Potential Value"
                    variant="outlined"
                    size="small"
                  />
                </Stack>
                <TextField
                  label="Title"
                  name="title"
                  value={form?.title || ""}
                  onChange={handleChange}
                  placeholder="Title"
                  size="small"
                  fullWidth
                />
              </Stack>
            </Paper>
            {/* {(form?.stage !== 'LEAD') && ( */}
            <Paper elevation={0} sx={{ bgcolor: "background.default" }}>
              <DealStageComponent
                stage={form?.stage || (isDeal ? "QUALIFIED" : "LEAD")}
                onChange={(stage) => setForm((prev) => ({ ...prev, stage }))}
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
                  Contact Information
                </Typography>
                <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
                  <ContactFormFields
                    initialData={form?.contact}
                    contactId={form?.contact?.id}
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
                  Besitzer
                </Typography>
                <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
                  <UserSelect
                    value={form?.assigneeId || null}
                    label={"Assignee"}
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
                  Appointments
                </Typography>
                <Box sx={{ "& .MuiTextField-root": { my: 0.5 } }}>
                  <AppointmentsFormFieldsSet
                    initialAppointments={form?.appointments as AppointmentExt[]}
                    onChange={handleAppointmentsChange}
                  />
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "background.default",
            paddingTop: 2,
            paddingLeft: 2,
            paddingRight: 2,
            mt: "auto",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            fullWidth
            sx={{
              py: 1,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {isNew ? titleCreate : titleUpdate}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
