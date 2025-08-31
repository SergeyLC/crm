"use client";
import React from "react";
import { useTranslation } from 'react-i18next';
import { UrlViewSwitcher, UrlViewSwitcherElement } from "@/shared/ui";
import { Box, Typography } from "@mui/material";
import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';

import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableViewIcon from '@mui/icons-material/TableView';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const buildViewSwitcherItems = (t: (k:string)=>string, locale:string): UrlViewSwitcherElement[] => [
  {
    name: t('view.table'),
    path: localePath('/deals', locale),
    icon: <TableViewIcon />,
    label: t('view.tableView'),
  },
  {
    name: t('view.kanban'),
    path: localePath('/deals/kanban', locale),
    icon: <ViewKanbanIcon />,
    label: t('view.kanbanView'),
  }
];

const buildStatusSwitcherItems = (t:(k:string)=>string, locale:string): UrlViewSwitcherElement[] => [
  {
    name: t('view.won'),
    path: localePath('/deals/won', locale),
    icon: <CheckCircleIcon />,
    label: t('viewSwitcher.wonDeals'),
  },
  {
    name: t('view.lost'),
    path: localePath('/deals/lost', locale),
    icon: <CancelIcon />,
    label: t('viewSwitcher.lostDeals'),
  },
  {
    name: t('view.archived'),
    path: localePath('/deals/archived', locale),
    icon: <ArchiveIcon />,
    label: t('view.showArchived'),
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
  const { t } = useTranslation('deal');
  const locale = useLocale();
  const viewSwitcherItems = React.useMemo(()=>buildViewSwitcherItems(t, locale), [t, locale]);
  const statusSwitcherItems = React.useMemo(()=>buildStatusSwitcherItems(t, locale), [t, locale]);
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <UrlViewSwitcher elements={viewSwitcherItems} sx={{ mr: 2 }} />
      <UrlViewSwitcher elements={statusSwitcherItems} ariaLabel="status switcher" sx={{ mr: 2 }} />
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};