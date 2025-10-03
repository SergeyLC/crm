"use client";
import React from "react";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Skeleton,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogoutButton } from "../LogoutButton";
import { useRouter } from "next/navigation";
import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';
import { useTranslation } from "react-i18next";

export const UserMenu: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const { t } = useTranslation('UserMenu');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigate = (path: string) => {
    path = localePath(path, locale);
    handleClose();
    router.push(path);
  };
  
  // Получение инициалов пользователя для аватара
  const getUserInitials = () => {
    if (!user || !user.name) return "?";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return user.name.substring(0, 2).toUpperCase();
  };

  // Показываем плейсхолдер во время загрузки
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ ml: 1 }}>
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="text" width={60} height={14} />
        </Box>
      </Box>
    );
  }

  // If user is not authenticated or user data is not available, do not render the menu
  if (!isAuthenticated || !user) {
    return null; // Hide menu for unauthenticated users
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            mr: 2,
            textAlign: "right",
            display: { xs: "none", sm: "block" },
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role === "ADMIN" ? t("administrator") : t("employee")}
          </Typography>
        </Box>

        <IconButton onClick={handleMenuOpen} color="inherit" sx={{ p: 0 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>{getUserInitials()}</Avatar>
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1, display: { xs: "block", sm: "none" } }}>
          <Typography variant="body1" fontWeight="bold">
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>

  <MenuItem onClick={() => handleNavigate("/profile")}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("profile")}</ListItemText>
        </MenuItem>

  <MenuItem onClick={() => handleNavigate("/settings")}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("settings")}</ListItemText>
        </MenuItem>

        {user.role === "ADMIN" && <Divider />}
        {user.role === "ADMIN" && (
          <MenuItem onClick={() => handleNavigate("/admin")}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("adminPanel")}</ListItemText>
          </MenuItem>
        )}

        <Divider />
        <MenuItem>
          <LogoutButton fullWidth />
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;