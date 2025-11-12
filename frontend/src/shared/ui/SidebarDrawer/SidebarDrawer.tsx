"use client";

import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { LogoutButton } from "@/features/side-menu/ui/LogoutButton";
import { useAuth } from "@/features/auth/hooks";
import { useUserPermissions, userHasPermission } from "@/entities/user";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { UserPermission } from "@/entities/user";
const drawerWidth = 220;
const collapsedWidth = 60;

import { useLocale, localePath } from "@/shared/lib/hooks/useLocale";
const buildMenuItems = (t: (k: string) => string, locale: string) => [
  {
    text: t("leads"),
    permissions: UserPermission.CAN_VIEW_LEADS,
    href: localePath("/leads", locale),
    icon: <AssignmentIcon />,
  },
  {
    text: t("deals"),
    permissions: UserPermission.CAN_VIEW_DEALS,
    href: localePath("/deals", locale),
    icon: <MonetizationOnIcon />,
  },
  {
    text: t("users"),
    permissions: UserPermission.CAN_EDIT_USERS,
    href: localePath("/users", locale),
    icon: <PersonOutlineIcon />,
  },
  {
    text: t("groups"),
    permissions: UserPermission.CAN_VIEW_GROUPS,
    href: localePath("/groups", locale),
    icon: <GroupAddIcon />,
  },
  {
    text: t("pipelines"),
    permissions: UserPermission.CAN_EDIT_PIPELINES || UserPermission.CAN_CREATE_PIPELINES,
    href: localePath("/pipelines", locale),
    icon: <FilterListIcon />,
  },
];

export function SidebarDrawer() {
  const [collapsed, setCollapsed] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const userPermissions = useUserPermissions();
  const { t } = useTranslation("SidebarDrawer");
  const locale = useLocale();
  const menuItems = React.useMemo(() => buildMenuItems(t, locale), [t, locale]);

  const pathname = usePathname() || "/";

   const handleDrawerToggle = () => {
     setOpen(!open);
   };

  // useEffect(() => {
  //   console.log(
  //     `can UserPermission.CAN_VIEW_USERS: ${userHasPermission(userPermissions, UserPermission.CAN_VIEW_USERS)}  userPermissions ${JSON.stringify(userPermissions)}`
  //   );
  // }, [userPermissions]);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Getting user initials for avatar
  const userInitials = useMemo(() => {
    if (!user || !user.name) return "?";

    const nameParts = user.name.split(" ");

    return nameParts.length >= 1
      ? `${nameParts[0][0]}`.toUpperCase()
      : user.name.substring(0, 1).toUpperCase();
  }, [user]);

  // const userInitials = useMemo(() => getUserInitials(), [getUserInitials]);

  // Derived localized labels for role & status (if available)
  const roleLabel = useMemo(() => {
    if (!user?.role) return undefined;
    const key = user.role.toLowerCase();
    return t(`${key}`, user.role);
  }, [user?.role, t]);

  const secondaryUserLine = roleLabel;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          transition: "width 0.2s",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar
        sx={{ flexDirection: "column", alignItems: "stretch", p: 1, gap: 1 }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("companyName", "Loya Care")}
            </Typography>
          )}
          <IconButton
            onClick={() => setCollapsed((v) => !v)}
            size="small"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        {/* Language switcher */}
        <Box
          sx={{
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <LanguageSwitcher />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          if (item.permissions) {
            const hasPermission = userHasPermission(
              userPermissions,
              item.permissions
            );
            if (!hasPermission) {
              return null; // Skip rendering this item if no permission
            }
          }
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ justifyContent: "center" }}
            >
              <Link
                href={item.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  width: "100%",
                }}
              >
                <ListItemButton
                  sx={{
                    // When collapsed we keep icons centered; when expanded
                    // align items to the left and add a gap between icon and text.
                    display: "flex",
                    justifyContent: collapsed ? "center" : "flex-start",
                    alignItems: "center",
                    gap: collapsed ? 0 : 1.5,
                    minHeight: 48,
                    bgcolor: isActive ? "action.selected" : "transparent",
                    "&:hover": {
                      bgcolor: isActive ? "action.selected" : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: "center",
                      color: isActive ? "primary.main" : "inherit",
                      // Add separation between icon and text when expanded
                      mr: collapsed ? 0 : 1,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      slotProps={{
                        primary: {
                          sx: { fontWeight: isActive ? 700 : 400 },
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />

      {/* User Avatar behind the collapsed sidebar */}
      {isAuthenticated && user && collapsed && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ my: 2 }}
          aria-label="User profile"
        >
          <Avatar
            sx={{ width: "1.5em", height: "1.5em", bgcolor: "primary.main" }}
          >
            {userInitials}
          </Avatar>
        </IconButton>
      )}
      {/* User profile and menu */}
      {isAuthenticated && !collapsed && user ? (
        <>
          <ListItemButton onClick={toggleUserMenu} sx={{ pl: 2, py: 1.5 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: "primary.main" }}>{userInitials}</Avatar>
            </ListItemIcon>
            <ListItemText primary={user.name} secondary={secondaryUserLine} />
            {userMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={userMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                sx={{ pl: 4 }}
                component={Link}
                href={localePath("/profile", locale)}
              >
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("profile", "Profile")} />
              </ListItemButton>

              <ListItemButton
                sx={{ pl: 4 }}
                component={Link}
                href={localePath("/settings", locale)}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("settings", "Settings")} />
              </ListItemButton>

              {user.role === "ADMIN" && (
                <ListItemButton
                  sx={{ pl: 4 }}
                  component={Link}
                  href={localePath("/admin", locale)}
                >
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t("adminPanel", "Admin Panel")} />
                </ListItemButton>
              )}

              <ListItem sx={{ pl: 4 }}>
                <LogoutButton fullWidth variant="outlined" />
              </ListItem>
            </List>
          </Collapse>

          <Divider sx={{ my: 1 }} />
        </>
      ) : null}

      {/* Version and Environment Info */}
      {!collapsed && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", fontSize: "0.7rem" }}
          >
            {t("version")}: {process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: "0.65rem",
              color: (() => {
                const version = process.env.NEXT_PUBLIC_APP_VERSION || "";
                if (version.includes("+dev")) return "info.main";
                if (version.includes("+sha.")) return "warning.main";
                return "success.main";
              })(),
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {(() => {
              const version = process.env.NEXT_PUBLIC_APP_VERSION || "";
              if (version.includes("+dev")) return t("develop");
              if (version.includes("+sha.")) return t("staging");
              return t("production");
            })()}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
