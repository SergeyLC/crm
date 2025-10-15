import React, { useCallback, useMemo } from "react";
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
} from "@/entities/appointment";

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

  const form = useMemo(() => initialData || {} as Appointment, [initialData]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      onChange?.(appointmentId, {
        ...form,
        [e.target.name]: e.target.value,
      })
    },
    [onChange, form, appointmentId]
  );

  const handleTypeChange = useCallback((e: SelectChangeEvent) => {
    onChange?.(appointmentId, {
      ...form,
      type: e.target.value as AppointmentType,
    });
  }, [onChange, form, appointmentId]);

  const handleDateChange = useCallback(
    (value: dayjs.Dayjs | null) => {
      onChange?.(appointmentId, {
        ...form,
        datetime: value ? value.toDate() : form.datetime,
      });
    },
    [onChange, form, appointmentId]
  );

  const { t } = useTranslation('appointment');

  return (
    <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
      <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label={t("field.dateTime")}
            value={form?.datetime ? dayjs(form?.datetime) : null}
            onChange={handleDateChange}
            views={["year", "month", "day", "hours", "minutes"]}
            format="DD.MM.YYYY HH:mm"
            ampm={false}
            slotProps={{
              textField: {
                size: "small",
              },
              field: { "data-testid": `appointment-datetime-input-${appointmentId}` } as Record<string, unknown>
            }}
            sx={{ flex: 1, minWidth: 200, zIndex: 0 }}
            data-testid={`appointment-datetime-${appointmentId}`}
          />
        </LocalizationProvider>
        <FormControl size="small" sx={{ flex: 1, minWidth: 200, zIndex: 0 }}>
          <InputLabel id="type-label">{t("field.type")}</InputLabel>
          <Select
            labelId="type-label"
            name="type"
            value={form?.type || ""}
            label={t("field.type")}
            onChange={handleTypeChange}
            data-testid={`appointment-type-select-${appointmentId}`}
          >
            <MenuItem value="">
              <em>{t("none")}</em>
            </MenuItem>
            {appointmentTypes.map((type) => (
              <MenuItem
                key={type}
                value={type}
                data-testid={`appointment-type-${type}`}
              >
                {t(`type.${type}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <TextField
        label={t("field.note")}
        name="note"
        value={form?.note || ""}
        onChange={handleChange}
        placeholder={t("field.note")}
        size="small"
        fullWidth={true}
        multiline
        maxRows={6}
        minRows={1}
        sx={{ zIndex: 0 }}
        slotProps={{
          htmlInput(ownerState) {
            return {
              ...ownerState,
              "data-testid": `appointment-note-${appointmentId}`,
            };
          },
        }}
      />
    </Box>
  );
};
