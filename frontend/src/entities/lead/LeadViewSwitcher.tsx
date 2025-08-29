"use client";
import React from "react";
import { UrlViewSwitcher, UrlViewSwitcherElement } from "@/shared/ui";
import { Box, Typography } from "@mui/material";

import ListIcon from '@mui/icons-material/List';
import ArchiveIcon from '@mui/icons-material/Archive';

const statusSwitcherItems: UrlViewSwitcherElement[] = [
  {
    name: "Active",
    path: "/leads",
    icon: <ListIcon />,
    label: "Active Leads",
  },
  {
    name: "Archived",
    path: "/leads/archived",
    icon: <ArchiveIcon />,
    label: "Archived Leads",
  },
];

export interface LeadViewSwitcherProps {
  title?: string;
}

/**
 * Component for switching between different lead views.
 * Includes title "Leads" and switch with active and archived views.
 */
export const LeadViewSwitcher: React.FC<LeadViewSwitcherProps> = ({
  title = "Leads"
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <UrlViewSwitcher elements={statusSwitcherItems} ariaLabel="leads status switcher" sx={{ mr: 2 }} />
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};
