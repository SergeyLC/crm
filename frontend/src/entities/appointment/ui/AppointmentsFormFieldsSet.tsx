"use client";

import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Stack, IconButton, Box, Divider } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { AppointmentFormFields } from "./AppointmentFormFields";
import {
  Appointment,
  DeleteAppointmentDTO,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
} from "../types";

type AppointmentsFormFieldsSetProps = {
  appointmentsData?: (
    | Appointment
    | CreateAppointmentDTO
    | UpdateAppointmentDTO
  )[];
  onChange?: (
    appointments: (Appointment | CreateAppointmentDTO | UpdateAppointmentDTO)[]
  ) => void;
};

const canShowAppointment = (
  appointment: Appointment | CreateAppointmentDTO | UpdateAppointmentDTO
) => {
  return appointment.dealId !== "REMOVED";
};

export const AppointmentsFormFieldsSet: React.FC<
  AppointmentsFormFieldsSetProps
> = ({ appointmentsData, onChange }) => {
  const { t } = useTranslation("appointment");

  const appointments = useMemo(
    () => (appointmentsData ? [...appointmentsData] : []),
    [appointmentsData]
  );

  const handleAdd = useCallback(() => {
    const next = [
      ...appointments,
      {
        type: null,
        note: null,
      } as CreateAppointmentDTO,
    ];
    onChange?.(next);
  }, [appointments, onChange]);

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!appointments) return;
      const idx = Number(e.currentTarget.id);
      const removedAppointment = appointments[idx] as DeleteAppointmentDTO;
      if (!removedAppointment) return;

      let next: typeof appointments;
      // save information about appointments should be deleted
      if (removedAppointment.id && removedAppointment.dealId) {
        next = appointments.map((item, i) =>
          i === idx
            ? {
                id: removedAppointment.id,
                dealId: "REMOVED",
              }
            : item
        );
      } else {
        next = appointments.filter((_, i) => i !== idx);
      }
      onChange?.(next);
    },
    [appointments, onChange]
  );

  const handleChange = useCallback(
    (idx: number | string, value: Appointment) => {
      const next = appointments.map((item, i) =>
        i === Number(idx) ? value : item
      );
      onChange?.(next);
    },
    [appointments, onChange]
  );

  return (
    <Stack spacing={1.5}>
      {appointments?.map(
        (appointment, idx) =>
          canShowAppointment(appointment) && (
            <React.Fragment key={idx}>
              {idx > 0 && <Divider sx={{ my: 2 }} />}
              <Stack
                direction="row"
                alignItems="flex-start"
                spacing={1}
                sx={{ "& .MuiTextField-root": { my: 0.5 } }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <AppointmentFormFields
                    initialData={(appointment as Appointment) || undefined}
                    appointmentId={idx}
                    onChange={handleChange}
                  />
                </Box>
                <IconButton
                  aria-label="Delete appointment"
                  color="error"
                  id={idx.toString()}
                  onClick={handleRemove}
                  sx={{ mt: 1 }}
                  data-testid={`remove-appointment-${idx}`}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </React.Fragment>
          )
      )}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ alignSelf: "flex-start", mt: 1 }}
        data-testid="add-appointment-button"
      >
        {t("action.add")}
      </Button>
    </Stack>
  );
};
