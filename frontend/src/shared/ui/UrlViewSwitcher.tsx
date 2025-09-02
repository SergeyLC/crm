"use client";
import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SxProps, Theme } from "@mui/material";
import {
  SimpleViewSwitcher,
  SimpleViewSwitcherElement,
} from "./SimpleViewSwitcher";

export type UrlViewSwitcherElement = {
  name: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
  tooltip?: string;
};

export type UrlViewSwitcherProps = {
  elements: UrlViewSwitcherElement[];
  size?: "small" | "medium" | "large";
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

/**
 * A view switcher component with URL navigation.
 * Built on top of SimpleViewSwitcher but handles URL routing automatically.
 */
export const UrlViewSwitcher: React.FC<UrlViewSwitcherProps> = ({
  elements = [],
  size = "small",
  ariaLabel = "view mode",
  sx,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const pathnameWithoutQuery = useMemo(() => {
    if (!pathname) return '';
    return pathname.split('?')[0];
  }, [pathname]);

  // Convert URL elements to SimpleViewSwitcher format
  const switcherElements: SimpleViewSwitcherElement<string>[] = React.useMemo(
    () =>
      elements.map((element) => ({
        value: element.name,
        icon: element.icon,
        label: element.label,
        tooltip: element.tooltip,
        ariaLabel: element.ariaLabel,
      })),
    [elements]
  );

  // Get current active view based on the path
  const getCurrentView = React.useCallback(() => {
    const activeElement = elements.find((element) =>
      pathnameWithoutQuery?.endsWith(element.path)
    );
    return activeElement?.name || "";
  }, [elements, pathnameWithoutQuery]);

  const currentView = React.useMemo(getCurrentView, [getCurrentView]);

  const handleViewChange = React.useCallback(
    (newView: string) => {
      const activeElement = elements.find(
        (element) => element.name === newView
      );
      if (activeElement) {
        router.push(activeElement.path);
      }
    },
    [elements, router]
  );

  return (
    <SimpleViewSwitcher
      elements={switcherElements}
      value={currentView}
      onChange={handleViewChange}
      size={size}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    />
  );
};
