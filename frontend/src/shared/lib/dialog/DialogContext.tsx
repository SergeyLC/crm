"use client";

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { Dialog, DialogProps } from "@/shared/ui/Dialog/Dialog";

// Type for opening dialog options
export interface OpenDialogOptions {
  title?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
}

// Context interface
interface DialogContextValue {
  openDialog: (options: OpenDialogOptions) => void;
  closeDialog: () => void;
}

// Creating context
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dialogState, setDialogState] = useState<
    { open: boolean } & OpenDialogOptions
  >({
    open: false,
    content: null,
  });

  const openDialog = useCallback((options: OpenDialogOptions) => {
    setDialogState({
      ...options,
      open: true,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((state) => ({
      ...state,
      open: false,
    }));
  }, []);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog
        open={dialogState.open}
        title={dialogState.title}
        content={dialogState.content}
        actions={dialogState.actions}
        maxWidth={dialogState.maxWidth}
        fullWidth={dialogState.fullWidth}
        onClose={closeDialog}
      />
    </DialogContext.Provider>
  );
};

// Hook for using the dialog
export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
