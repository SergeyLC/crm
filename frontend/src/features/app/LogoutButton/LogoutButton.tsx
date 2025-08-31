"use client";
import React from "react";
import { Button, CircularProgress, ButtonProps } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/features/auth";
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps {
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  fullWidth?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "text",
  color = "inherit",
  fullWidth = false
}) => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      // Redirecting to the login page will happen automatically
      // thanks to AuthProvider and ProtectedRoute
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleLogout}
      disabled={isLoading}
      startIcon={isLoading ? <CircularProgress size={20} /> : <LogoutIcon />}
      fullWidth={fullWidth}
    >
  {isLoading ? t('nav:loggingOut','Logging out...') : t('nav:logout','Logout')}
    </Button>
  );
};

export default LogoutButton;