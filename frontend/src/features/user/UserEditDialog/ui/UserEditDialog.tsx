"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UserForm } from "@/features/user/UserForm";
import {
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  CreateUserDTO,
  UpdateUserDTO,
  sanitizeUserData,
} from "@/entities/user";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

interface UserEditDialogProps {
  id?: string;
  open: boolean;
  onClose: () => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  id,
  open,
  onClose,
}) => {
  const isEditing = !!id;
  const [error, setError] = useState<string | undefined>();
  const { t } = useTranslation("user");
  
  const { enqueueSnackbar } = useSnackbar();

  // API requests
  const { data: user, isLoading: isLoadingUser } = useGetUserByIdQuery(id || "", !(!id || !open));
  
  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  
  const isLoading = isLoadingUser || createUser.isPending || updateUser.isPending;

  useEffect(() => {
    // Reset error on dialog open/close
    if (open) {
      setError(undefined);
    }
  }, [open, id]);

  const handleSubmit = async (formData: CreateUserDTO | UpdateUserDTO) => {
    try {
      if (isEditing && id) {
        // User update
        const sanitizedData = sanitizeUserData(formData as UpdateUserDTO);

        // If password is empty, remove it from the request
        if (sanitizedData.password === "") {
          delete sanitizedData.password;
        }
        
        await updateUser.mutateAsync({
          id,
          body: sanitizedData,
        });
        
  enqueueSnackbar(t("form.notify.updated"), { variant: "success" });
      } else {
        // User creation
        await createUser.mutateAsync(formData as CreateUserDTO);
  enqueueSnackbar(t("form.notify.created"), { variant: "success" });
      }
      
      onClose();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
  setError(error.data?.message || t("form.error.generic"));
  enqueueSnackbar(t("form.notify.failed"), { variant: "error" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {isEditing ? t("dialog.editTitle") : t("dialog.createTitle")}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {isLoadingUser && id ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <UserForm
            user={user}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            error={error}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};