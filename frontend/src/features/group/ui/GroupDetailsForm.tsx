/**
 * Group Details Form Component
 * 
 * This component renders the form fields for creating or editing group details.
 * It handles the primary group information including name and group leader.
 * 
 * Features:
 * - Group name input field with validation
 * - Group leader selection via autocomplete from available users
 * - Integration with react-hook-form for form state management
 * - Validation error display
 * - Material UI components for consistent styling
 * 
 * The component receives control and errors from a parent form component
 * and a list of available users for the leader selection.
 */

"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Controller, Control } from "react-hook-form";
import {
  TextField,
  FormControl,
  Box,
  Typography,
  Avatar,
  Autocomplete,
} from "@mui/material";
import { User } from "@/entities/user";
import { FieldErrors } from "react-hook-form";
import { GroupFormData } from "../types";

interface GroupDetailsFormProps {
  control: Control<GroupFormData>;
  errors: FieldErrors<GroupFormData>;
  users: User[];
}

export function GroupDetailsForm({
  control,
  errors,
  users,
}: GroupDetailsFormProps) {
  const { t } = useTranslation("group");

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
        {t("sections.groupDetails")}
      </Typography>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            size="small"
            fullWidth
            label={t("fields.groupName")}
            error={!!errors.name}
            helperText={errors.name ? t(errors.name.message || "") : ""}
            sx={{ mb: 2 }}
          />
        )}
      />

      <Controller
        name="leaderId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.leaderId}>
            <Autocomplete
              size="small"
              options={users}
              getOptionLabel={(option) => option.name}
              value={users.find((user) => user.id === field.value) || null}
              onChange={(_, newValue) => {
                field.onChange(newValue ? newValue.id : "");
              }}
              isOptionEqualToValue={(option, value) => option.id === (value as User | null)?.id}
              renderOption={(props, option) => {
                const { name, email, id } = option as User;
                // props may contain a key; React warns if key is passed via spread.
                // Extract it and pass explicitly, with a fallback to option id.
                const { key: propKey, ...rest } = props as { key?: React.Key } & Record<string, unknown>;
                const liKey = propKey ?? id;
                return (
                  <li key={liKey} {...(rest as Record<string, unknown>)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar sx={{ width: 18, height: 18 }}>
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Typography variant="body2">{name}</Typography>
                        <Typography variant="body2" color="text.secondary">({email})</Typography>
                      </div>
                    </div>
                  </li>
                );
              }}
              renderInput={(params) => {
                return (
                  <TextField
                    {...params}
                    label={t("fields.groupLeader")}
                  />
                );
              }}
            />
            {errors.leaderId && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1 }}>
                {t(errors.leaderId.message || "")}
              </Typography>
            )}
          </FormControl>
        )}
      />
    </Box>
  );
}
