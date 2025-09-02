"use client";
import React from "react";
import { UrlViewSwitcher, UrlViewSwitcherElement } from "@/shared/ui";
import { Box, Typography } from "@mui/material";
import { useLocale, localePath } from '@/shared/lib/hooks/useLocale';
import { useTranslation } from 'react-i18next';

import ListIcon from '@mui/icons-material/List';
import ArchiveIcon from '@mui/icons-material/Archive';

const buildStatusSwitcherItems = (
  locale: string,
  t: (key: string) => string
): UrlViewSwitcherElement[] => [
  {
    name: t("lead:view.active"),
    path: localePath("/leads", locale),
    icon: <ListIcon />,
    label: t("lead:view.active"),
    ariaLabel: t("lead:view.ariaSwitcher"),
  },
  {
    name: t("lead:view.archived"),
    path: localePath("/leads/archived", locale),
    icon: <ArchiveIcon />,
    label: t("lead:view.archived"),
    ariaLabel: t("lead:view.ariaSwitcher"),
  },
];

export interface LeadViewSwitcherProps {
  title?: string;
}

/**
 * Component for switching between different lead views.
 * Includes title "Leads" and switch with active and archived views.
 */
export const LeadViewSwitcher: React.FC<LeadViewSwitcherProps> = ({ title }) => {
  const locale = useLocale();
  const { t } = useTranslation('lead');
  const items = React.useMemo(() => buildStatusSwitcherItems(locale, t), [locale, t]);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <UrlViewSwitcher 
        elements={items} 
        ariaLabel={t("lead:view.ariaSwitcher")} 
        sx={{ mr: 2 }} 
      />
      <Typography variant="h6">{title || t("lead:view.title")}</Typography>
    </Box>
  );
};
