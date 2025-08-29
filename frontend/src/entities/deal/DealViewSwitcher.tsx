"use client";
import React from "react";
import { UrlViewSwitcher, UrlViewSwitcherElement } from "@/shared/ui";
import { Box, Typography } from "@mui/material";

import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableViewIcon from '@mui/icons-material/TableView';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const viewSwitcherItems: UrlViewSwitcherElement[] = [
  {
    name: "Table",
    path: "/deals",
    icon: <TableViewIcon />,
    label: "Table View",
  },
  {
    name: "Kanban",
    path: "/deals/kanban",
    icon: <ViewKanbanIcon />,
    label: "Kanban View",
  }
]

const statusSwitcherItems: UrlViewSwitcherElement[] = [
  {
    name: "Won",
    path: "/deals/won",
    icon: <CheckCircleIcon />,
    label: "Won Deals",
  },
  {
    name: "Lost",
    path: "/deals/lost",
    icon: <CancelIcon />,
    label: "Lost Deals",
  },
  {
    name: "Archived",
    path: "/deals/archived",
    icon: <ArchiveIcon />,
    label: "Show archived deals",
  },
];

export interface DealViewSwitcherProps {
  title?: string;
}

/**
 * Component for switching between different deal views.
 * Includes title "Deals" and switch with table, kanban and archived views.
 */
export const DealViewSwitcher: React.FC<DealViewSwitcherProps> = ({
  title = "Deals"
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <UrlViewSwitcher elements={viewSwitcherItems} sx={{ mr: 2 }} />
      <UrlViewSwitcher elements={statusSwitcherItems} ariaLabel="status switcher" sx={{ mr: 2 }} />
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};