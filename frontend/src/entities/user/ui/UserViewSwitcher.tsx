"use client";
import React from "react";
import { Box, Typography, SxProps, Theme } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import BlockIcon from '@mui/icons-material/Block';
import { SimpleViewSwitcher, SimpleViewSwitcherElement } from "@/shared/ui";
import { UserStatus } from "../model/types";
import { useTranslation } from 'react-i18next';

export type UserStatusFilter = UserStatus | 'ALL';

export interface UserViewSwitcherProps {
  title?: string;
  value: UserStatusFilter;
  onChange: (filter: UserStatusFilter) => void;
  size?: "small" | "medium" | "large";
  elements?: SimpleViewSwitcherElement<UserStatusFilter>[];
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

const buildDefaultSwitcherElements = (t: (k: string) => string): SimpleViewSwitcherElement<UserStatusFilter>[] => [
  {
    value: 'ACTIVE',
    icon: <PersonIcon />,
    label: t('user:view.active'),
    tooltip: t('user:view.tooltip.active'),
  },
  {
    value: 'ALL',
    icon: <GroupIcon />,
    label: t('user:view.all'),
    tooltip: t('user:view.tooltip.all'),
  },
  {
    value: 'BLOCKED',
    icon: <BlockIcon />,
    label: t('user:view.blocked'),
    tooltip: t('user:view.tooltip.blocked'),
  },
];

/**
 * Component for switching between different user status filters.
 * Includes title "Users" and switch with active, all and blocked views.
 * 
 * @example
 * // Default small size
 * <UserViewSwitcher value={filter} onChange={setFilter} />
 * 
 * @example 
 * // Medium size with custom title
 * <UserViewSwitcher 
 *   value={filter} 
 *   onChange={setFilter}
 *   size="medium"
 *   title="Team Members" 
 * />
 * 
 * @example
 * // Large size
 * <UserViewSwitcher 
 *   value={filter} 
 *   onChange={setFilter}
 *   size="large" 
 * />
 */
export const UserViewSwitcher: React.FC<UserViewSwitcherProps> = ({
  title,
  value,
  onChange,
  size = 'small',
  elements,
  ariaLabel,
  sx,
}) => {
  const { t } = useTranslation('user');
  const els = React.useMemo(() => elements || buildDefaultSwitcherElements(t), [elements, t]);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <SimpleViewSwitcher
        elements={els}
        value={value}
        onChange={onChange}
        size={size}
        ariaLabel={ariaLabel || t('user:view.ariaSwitcher')}
        sx={{ mr: 2 }}
      />
      <Typography variant="h6">{title || t('user:view.title')}</Typography>
    </Box>
  );
};
