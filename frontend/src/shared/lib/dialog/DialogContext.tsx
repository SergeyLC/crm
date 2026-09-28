"use client";

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
  type ComponentType,
} from "react";
import type { DialogProps } from "@/shared/ui/Dialog/Dialog";

export interface OpenDialogOptions {
  title?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
}

interface DialogContextValue {
  openDialog: (options: OpenDialogOptions) => void;
  closeDialog: () => void;
}

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
  const [DialogComp, setDialogComp] = useState<ComponentType<DialogProps> | null>(
    null,
  );

  const loadDialog = useCallback(() => {
    if (DialogComp) return;
    void import("@/shared/ui/Dialog/Dialog").then((mod) => {
      setDialogComp(() => mod.Dialog);
    });
  }, [DialogComp]);

  const openDialog = useCallback(
    (options: OpenDialogOptions) => {
      loadDialog();
      setDialogState({
        ...options,
        open: true,
      });
    },
    [loadDialog],
  );

  const closeDialog = useCallback(() => {
    setDialogState((state) => ({
      ...state,
      open: false,
    }));
  }, []);

  // Prefetch after first paint so the dialog chunk is usually ready
  useEffect(() => {
    const timer = window.setTimeout(loadDialog, 1200);
    return () => window.clearTimeout(timer);
  }, [loadDialog]);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogState.open && DialogComp ? (
        <DialogComp
          open={dialogState.open}
          title={dialogState.title}
          content={dialogState.content}
          actions={dialogState.actions}
          maxWidth={dialogState.maxWidth}
          fullWidth={dialogState.fullWidth}
          onClose={closeDialog}
        />
      ) : null}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
