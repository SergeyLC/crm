import * as React from "react";
import { alpha } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

export type ToolbarMenuItem = {
  title?: string | React.ReactNode;
  ariaLabel?: string;
  onClick?: (e: React.MouseEvent, id?: string) => Promise<void>;
  onClickMultiple?: (e: React.MouseEvent, ids?: readonly string[]) => Promise<void>;
  icon?: React.ReactNode;
  isGroupAction?: boolean;
};

export interface BaseTableToolbarProps {
  selected: readonly string[];
  menuItems?: ToolbarMenuItem[];
  title?: string | React.ReactNode;
  clearSelection?: () => void;
}

export function BaseTableToolbar(props: BaseTableToolbarProps) {
  const {
    selected,
    menuItems = [],
    title,
    clearSelection,
  } = props;

  // const numSelected = React.useMemo(() => selected.length, [selected]);
  const numSelected = selected.length;

  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          display: "flex",
          justifyContent: "space-between",
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        },
      ]}
    >
      <Box sx={{ flex: "1 1 100%", display: "flex", alignItems: "center" }}>
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: "1 1 100%" }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: "1 1 100%" }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        )}
        {numSelected > 0
          ? menuItems
              .filter((item) => item.isGroupAction)
              .map((item, index) => (
                <Tooltip
                  title={item.title}
                  aria-label={item.ariaLabel}
                  key={index}
                >
                  <IconButton
                    onClick={async (e) => {
                      await item.onClickMultiple?.(e, selected);
                      clearSelection?.();
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              ))
          : menuItems
              .filter((item) => !item.isGroupAction)
              .map((item, index) => (
                <Tooltip
                  title={item.title}
                  aria-label={item.ariaLabel}
                  key={index}
                >
                  <IconButton onClick={(e) => item.onClick?.(e)}>
                    {item.icon}
                  </IconButton>
                </Tooltip>
              ))}
      </Box>
    </Toolbar>
  );
}
