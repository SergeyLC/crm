import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { BaseTableRowData } from "../model";

export type ActionMenuItemProps<TRowData extends BaseTableRowData> = {
  onClick?: (e: React.MouseEvent, id?: string) => void;
  icon?: React.ReactNode;
  getIcon?: (row: TRowData) => React.ReactNode;
  title?: string | React.ReactNode;
  getElement?: (row: TRowData) => React.ReactNode;
};

export type ActionMenuProps<TRowData extends BaseTableRowData> = {
  id: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  menuItems?: ActionMenuItemProps<TRowData>[];
  row?: TRowData;
  compact?: boolean;
};

export const ActionMenu = <TRowData extends BaseTableRowData>(
  {
    id,
    anchorEl,
    open,
    onClose,
    menuItems,
    row,
    compact = true,
  }: ActionMenuProps<TRowData>
) => {
  return (
    <Menu
      id={`action-menu-${id}`}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      slotProps={{
        paper: {
          sx: {
            minWidth: compact ? 150 : 200,
            "& .MuiMenuItem-root": {
              py: compact ? 0.4 : 0.6,
              px: compact ? 0.75 : 1,
              minHeight: compact ? 30 : 36,
              fontSize: compact ? "0.75rem" : "0.95rem",
            },
            "& .MuiListItemIcon-root": {
              minWidth: 32,
            },
          },
        },
      }}
    >
      {menuItems?.map((item, index) => (
        <MenuItem
          key={index}
          onClick={(e) => {
            item.onClick?.(e, id);
            onClose();
          }}
        >
          <ListItemIcon>
            {item.icon ? item.icon : row ? item.getIcon?.(row) : null}
          </ListItemIcon>
          <ListItemText
            primary={item.title ? item.title : row ? item.getElement?.(row) : null}
          />
        </MenuItem>
      ))}
    </Menu>
  );
};
