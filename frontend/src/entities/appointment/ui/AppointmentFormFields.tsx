import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Box,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import dayjs from "dayjs";
import {
  Appointment,
  AppointmentType,
  appointmentTypes,
} from "@/entities/appointment/types";
import { useGetAppointmentByIdQuery } from "@/entities/appointment/api";

type AppointmentFormFieldsProps = {
  initialData?: Appointment;
  appointmentId: string | number;
  onChange?: (id: string | number, form: Appointment) => void;
};

export const AppointmentFormFields: React.FC<AppointmentFormFieldsProps> = ({
  initialData,
  appointmentId,
  onChange,
}) => {
  // Skip the initial fetch if we already have data from SSR
  const skipFetch = !!initialData || (!appointmentId && !initialData);

  const { data: appointmentData = initialData || undefined } =
    useGetAppointmentByIdQuery((appointmentId as string) || "", {
      skip: skipFetch,
    });

  // Initialize form state with normalized data
  const [form, setForm] = useState<Appointment>(appointmentData as Appointment);

  useEffect(() => {
    setForm(appointmentData as Appointment);
  }, [appointmentData]);

  useEffect(() => {
    onChange?.(appointmentId, form);
  }, [form, onChange, appointmentId]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    },
    [setForm]
  );

  const handleTypeChange = useCallback((e: SelectChangeEvent) => {
    setForm((prev) => ({
      ...prev,
      type: e.target.value as AppointmentType,
    }));
  }, []);

  const handleDateChange = useCallback(
    (value: dayjs.Dayjs | null) => {
      setForm((prev) => ({
        ...prev,
        datetime: value ? value.toDate() : prev.datetime,
      }));
    },
    [setForm]
  );

  const { t } = useTranslation('appointment');

  return (
    <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
      <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label={t('field.dateTime')}
            value={form?.datetime ? dayjs(form?.datetime) : null}
            onChange={handleDateChange}
            views={["year", "month", "day", "hours", "minutes"]}
            format="DD.MM.YYYY HH:mm"
            ampm={false}
            slotProps={{
              textField: {
                size: "small",
              },
            }}
            sx={{ flex: 1, minWidth: 200, zIndex: 0 }}
          />
        </LocalizationProvider>
        <FormControl size="small" sx={{ flex: 1, minWidth: 200, zIndex: 0 }}>
          <InputLabel id="type-label">{t('field.type')}</InputLabel>
          <Select
            labelId="type-label"
            name="type"
            value={form?.type || ""}
            label={t('field.type')}
            onChange={handleTypeChange}
          >
            <MenuItem value="">
              <em>{t('none')}</em>
            </MenuItem>
            {appointmentTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {t(`type.${type}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <TextField
        label={t('field.note')}
        name="note"
        value={form?.note || ""}
        onChange={handleChange}
        placeholder={t('field.note')}
        size="small"
        fullWidth
        multiline
        maxRows={6}
        minRows={1}
        sx={{ zIndex: 0 }}
      />
    </Box>
  );
};
