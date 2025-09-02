"use client";
import React from "react";
import {
  ToggleButtonGroup,
  ToggleButton,
  Theme,
  SxProps,
  Tooltip,
} from "@mui/material";

export type SimpleViewSwitcherElement<T = string> = {
  value: T;
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
  tooltip?: string;
};

export type SimpleViewSwitcherProps<T = string> = {
  elements: SimpleViewSwitcherElement<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "small" | "medium" | "large";
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

/**
 * A simple view switcher component without URL navigation.
 * Generic component that can work with any value type.
 */
export const SimpleViewSwitcher = <T extends string | number>({
  elements,
  value,
  onChange,
  ariaLabel = "view mode",
  sx,
  size = "small",
  className,
}: SimpleViewSwitcherProps<T>) => {
  const handleViewChange = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newValue: T | null) => {
      if (newValue !== value && newValue !== null) {
        onChange(newValue);
      }
    },
    [onChange, value]
  );

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleViewChange}
      aria-label={ariaLabel}
      size={size}
      sx={sx}
      className={className}
    >
      {elements?.map((element) => (
        <Tooltip
          key={element.value}
          title={element.tooltip || element.label}
          arrow
          placement="top"
        >
          <ToggleButton
            value={element.value}
            aria-label={element.ariaLabel}
            sx={{ textTransform: "none" }}
          >
            {element.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};
