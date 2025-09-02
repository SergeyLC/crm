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
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { LogoutButton } from "@/features/app/LogoutButton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import { LanguageSwitcher } from "./LanguageSwitcher";
const drawerWidth = 220;
const collapsedWidth = 60;

import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';
const buildMenuItems = (t:(k:string)=>string, locale:string) => [
  { text: t('nav:leads'), href: localePath('/leads', locale), icon: <AssignmentIcon /> },
  { text: t('nav:deals'), href: localePath('/deals', locale), icon: <MonetizationOnIcon /> },
  { text: t('nav:users'), href: localePath('/users', locale), icon: <PeopleIcon /> },
];

export function SidebarDrawer() {
  const [collapsed, setCollapsed] = useState(true);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const locale = useLocale();
  const menuItems = React.useMemo(()=>buildMenuItems(t, locale), [t, locale]);

  const pathname = usePathname() || "/";

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

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
    return t(`user:role.${key}`, user.role);
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
        sx={{ flexDirection: 'column', alignItems: 'stretch', p: 1, gap: 1 }}
      >
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('nav:appName', 'Loya Care')}
            </Typography>
          )}
          <IconButton onClick={() => setCollapsed((v) => !v)} size="small" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        {/* Language switcher */}
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <LanguageSwitcher />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
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
                    justifyContent: "center",
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
            <ListItemText
      primary={user.name}
      secondary={secondaryUserLine}
            />
            {userMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={userMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: 4 }} component={Link} href={localePath('/profile', locale)}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav:profile', 'Profile')} />
              </ListItemButton>

              <ListItemButton sx={{ pl: 4 }} component={Link} href={localePath('/settings', locale)}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('nav:settings', 'Settings')} />
              </ListItemButton>

              {user.role === "ADMIN" && (
                <ListItemButton sx={{ pl: 4 }} component={Link} href={localePath('/admin', locale)}>
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('nav:admin', 'Admin Panel')} />
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

      {/* Additional links */}
      <List>
        <ListItemButton
          component={Link}
          href={localePath('/deals/archived', locale)}
          sx={{ pl: 2, py: 1.5 }}
        >
          <ListItemIcon>
            <ArchiveIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav:archivedDeals', 'Archived Deals')}>
            <Link href={localePath('/deals/archived', locale)}>{t('nav:view', 'View')}</Link>
          </ListItemText>
        </ListItemButton>
      </List>
    </Drawer>
  );
}
