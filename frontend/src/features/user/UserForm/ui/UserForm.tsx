"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Button,
  Typography,
  CircularProgress,
  Grid,
} from "@mui/material";
import { CreateUserDTO, UpdateUserDTO, UserExt, UserRole, UserStatus } from "@/entities/user";
import { useTranslation } from "react-i18next";

interface UserFormProps {
  user?: UserExt;
  onSubmit: (data: CreateUserDTO | UpdateUserDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

// Schema of validation for new users
// Minimal translation function signature compatible with i18next's t
interface TOptions { [key: string]: unknown }
const createUserSchema = (t: (key: string, options?: TOptions) => string) =>
  yup.object().shape({
    name: yup.string().required(t("form.validation.nameRequired")),
    email: yup
      .string()
      .email(t("form.validation.emailInvalid"))
      .required(t("form.validation.emailRequired")),
    password: yup
      .string()
      .required(t("form.validation.passwordRequired"))
      .min(6, t("form.validation.passwordMin")),
    role: yup
      .mixed<UserRole>()
      .oneOf(Object.values(UserRole), t("form.validation.roleInvalid"))
      .required(t("form.validation.roleRequired")),
    status: yup
      .mixed<UserStatus>()
      .oneOf([UserStatus.ACTIVE, UserStatus.BLOCKED], t("form.validation.statusInvalid"))
      .required(t("form.validation.statusRequired")),
  });

// Schema of validation for updating users
const updateUserSchema = (t: (key: string, options?: TOptions) => string) =>
  yup.object().shape({
    name: yup.string().required(t("form.validation.nameRequired")),
    email: yup
      .string()
      .email(t("form.validation.emailInvalid"))
      .required(t("form.validation.emailRequired")),
    password: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test(
        "password-length",
        t("form.validation.passwordMin"),
        (value) => value === null || value === undefined || value.length >= 1
      ),
    role: yup
      .string()
      .oneOf(["ADMIN", "EMPLOYEE"], t("form.validation.roleInvalid"))
      .required(t("form.validation.roleRequired")),
    status: yup
      .string()
      .oneOf(["ACTIVE", "BLOCKED"], t("form.validation.statusInvalid"))
      .required(t("form.validation.statusRequired")),
  });

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation("user");
  const isEditing = !!user;

  // Select the schema based on the mode (create/edit)
  const schema = (isEditing ? updateUserSchema : createUserSchema)(t);
  
  const defaultValues = {
    name: user?.name || "",
    email: user?.email || "",
    password: "", // Password is always empty for security
    role: user?.role || "EMPLOYEE" as UserRole,
    status: user?.status || "ACTIVE" as UserStatus,
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserDTO | UpdateUserDTO>({
    // Cast to ObjectSchema to satisfy yupResolver typing for object schemas
    resolver: yupResolver(schema as unknown as yup.ObjectSchema<CreateUserDTO | UpdateUserDTO>),
    defaultValues,
  });

  const onFormSubmit = async (data: CreateUserDTO | UpdateUserDTO) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onFormSubmit)}
      noValidate
      sx={{ mt: 2 }}
    >
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        {/* <Grid xs={12}> */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("form.field.fullName")}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message as string}
                  disabled={isLoading}
                />
              )}
            />
        {/* </Grid> */}

        {/* <Grid xs={12}> */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t("form.field.email")}
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message as string}
                disabled={isLoading}
              />
            )}
          />
        {/* </Grid> */}

        {/* <Grid xs={12}> */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={
                  isEditing
                    ? t("form.field.passwordEdit")
                    : t("form.field.password")
                }
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message as string}
                disabled={isLoading}
              />
            )}
          />
        {/* </Grid> */}

        {/* <Grid xs={12} sm={6}> */}
          <FormControl fullWidth error={!!errors.role} disabled={isLoading}>
            <InputLabel id="role-label">{t("form.field.role")}</InputLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="role-label" label={t("form.field.role")}> 
                  <MenuItem value="ADMIN">{t("role.admin")}</MenuItem>
                  <MenuItem value="EMPLOYEE">{t("role.employee")}</MenuItem>
                </Select>
              )}
            />
            {errors.role && (
              <FormHelperText>{errors.role.message as string}</FormHelperText>
            )}
          </FormControl>
        {/* </Grid> */}

        {/* <Grid xs={12} sm={6}> */}
          <FormControl fullWidth error={!!errors.status} disabled={isLoading}>
            <InputLabel id="status-label">{t("form.field.status")}</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="status-label" label={t("form.field.status")}> 
                  <MenuItem value="ACTIVE">{t("status.active")}</MenuItem>
                  <MenuItem value="BLOCKED">{t("status.blocked")}</MenuItem>
                </Select>
              )}
            />
            {errors.status && (
              <FormHelperText>{errors.status.message as string}</FormHelperText>
            )}
          </FormControl>
        {/* </Grid> */}
       </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
          {t("form.action.cancel")}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isEditing ? t("form.action.update") : t("form.action.create")}
        </Button>
      </Box>
    </Box>
  );
};