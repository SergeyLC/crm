"use client";
import React from "react";
import Link from "next/link";

import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import { usePathname } from "next/navigation";
import { UserMenu } from "../UserMenu";

const navItems = [
  { name: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { name: "Deals", href: "/deals", icon: <BusinessIcon /> },
  { name: "Contacts", href: "/contacts", icon: <PeopleIcon /> },
];

export const AppBar: React.FC = () => {
  // Используем useMediaQuery напрямую с точной строкой запроса
  // вместо theme.breakpoints.down("md")
  const isSmallScreen = useMediaQuery('(max-width:900px)');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <MuiAppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        {isSmallScreen && (
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu" 
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 0, mr: 4, fontWeight: 'bold' }}
        >
          LoyaCRM
        </Typography>
        
        {!isSmallScreen && (
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            {navItems.map((item) => (
              <Link href={item.href} key={item.name} passHref style={{ textDecoration: 'none' }}>
                <Button 
                  color="inherit"
                  sx={{ 
                    mx: 1,
                    fontWeight: isActive(item.href) ? 'bold' : 'normal',
                    borderBottom: isActive(item.href) ? '2px solid' : 'none',
                    borderRadius: 0,
                    pb: 0.5
                  }}
                  startIcon={item.icon}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </Box>
        )}
        
        <UserMenu />
      </Toolbar>
      
      {/* Мобильное меню */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <List>
            {navItems.map((item) => (
              <Link href={item.href} key={item.name} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItem disablePadding>
                  <ListItemButton selected={isActive(item.href)}>
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              </Link>
            ))}
          </List>
        </Box>
      </Drawer>
    </MuiAppBar>
  );
};

export default AppBar;