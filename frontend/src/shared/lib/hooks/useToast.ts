"use client";
import { useSnackbar, VariantType } from 'notistack';

export const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showToast = (message: string, variant: VariantType = 'default') => {
    enqueueSnackbar(message, { variant });
  };

  return {
    success: (messageKey: string) => showToast(messageKey, 'success'),
    error: (messageKey: string) => showToast(messageKey, 'error'),
    info: (messageKey: string) => showToast(messageKey, 'info'),
    warning: (messageKey: string) => showToast(messageKey, 'warning'),
  };
};