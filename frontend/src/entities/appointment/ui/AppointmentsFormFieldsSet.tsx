"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  initialAppointments?: Appointment[];
  onChange?: (
    appointments: (Appointment | CreateAppointmentDTO | UpdateAppointmentDTO)[]
  ) => void;
};

export const AppointmentsFormFieldsSet: React.FC<
  AppointmentsFormFieldsSetProps
> = ({ initialAppointments = [], onChange }) => {
  const [appointments, setAppointments] =
    useState<
      (CreateAppointmentDTO | UpdateAppointmentDTO | DeleteAppointmentDTO)[]
    >(initialAppointments);
  const [removedAppointments, setRemovedAppointments] = useState<
    DeleteAppointmentDTO[]
  >([]);

  useEffect(() => {
    onChange?.([
      // create or update only appointmens with date
      ...appointments.filter((app) => app.datetime),
      // add information about appointmens that should be deleted
      ...(removedAppointments.length > 0 ? removedAppointments : []),
    ]);
  }, [appointments, onChange, removedAppointments]);

  const handleAdd = useCallback(() => {
    setAppointments((prev) => [
      ...prev,
      {
        type: null,
        note: null,
      },
    ]);
  }, [setAppointments]);

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const idx = Number(e.currentTarget.id);
      const removedAppointment = appointments[idx] as DeleteAppointmentDTO;
      // save information about appointments should be deleted
      if (removedAppointment.id && removedAppointment.dealId) {
        setRemovedAppointments((prev) => [
          ...prev,
          // if appoinment has id and daealId then it exists in the DB and should be deleted
          {
            id: removedAppointment.id,
            dealId: removedAppointment.dealId,
          },
        ]);
      }
      setAppointments((prev) => prev.filter((_, i) => i !== idx));
    },
    [appointments, setRemovedAppointments, setAppointments]
  );

  const handleChange = useCallback(
    (idx: number | string, value: Appointment) => {
      setAppointments((prev) =>
        prev.map((item, i) => (i === idx ? value : item))
      );
    },
    [setAppointments]
  );

  
  return (
    <Stack spacing={1.5}>
      {appointments.map((appointment, idx) => (
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
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </React.Fragment>
      ))}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ alignSelf: "flex-start", mt: 1 }}
      >
        Add Appointment
      </Button>
    </Stack>
  );
};
