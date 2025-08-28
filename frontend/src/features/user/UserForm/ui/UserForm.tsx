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

interface UserFormProps {
  user?: UserExt;
  onSubmit: (data: CreateUserDTO | UpdateUserDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

// Schema of validation for new users
const createUserSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  role: yup
    .mixed<UserRole>()
    .oneOf(Object.values(UserRole), "Invalid role")
    .required("Role is required"),
  status: yup
    .mixed<UserStatus>()
    .oneOf([UserStatus.ACTIVE, UserStatus.BLOCKED], "Invalid status")
    .required("Status is required"),
});

// Schema of validation for updating users
const updateUserSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "password-length",
      "Password must be at least 6 characters",
      (value) => value === null || value === undefined || value.length >= 1
    ),
  role: yup
    .string()
    .oneOf(["ADMIN", "EMPLOYEE"], "Invalid role")
    .required("Role is required"),
  status: yup
    .string()
    .oneOf(["ACTIVE", "BLOCKED"], "Invalid status")
    .required("Status is required"),
});

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}) => {
  const isEditing = !!user;

  // Select the schema based on the mode (create/edit)
  const schema = isEditing ? updateUserSchema : createUserSchema;
  
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
                  label="Full Name"
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
                label="Email"
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
                    ? "Password (leave empty to keep unchanged)"
                    : "Password"
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
            <InputLabel id="role-label">Role</InputLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="role-label" label="Role">
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="EMPLOYEE">Employee</MenuItem>
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
            <InputLabel id="status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="status-label" label="Status">
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="BLOCKED">Blocked</MenuItem>
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
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isEditing ? "Update" : "Create"}
        </Button>
      </Box>
    </Box>
  );
};