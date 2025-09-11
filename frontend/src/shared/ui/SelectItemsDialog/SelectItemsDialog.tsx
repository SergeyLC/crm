"use client";
import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  TextField,
  Box,
  InputAdornment,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";

/**
 * Base interface for items that can be used with SelectItemsDialog
 */
export interface BaseItem {
  id: string;
  name?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

/**
 * Props for SelectItemsDialog component
 */
export interface SelectItemsDialogProps<T extends BaseItem> {
  /** Controls whether the dialog is open */
  open: boolean;

  /** Function called when the dialog is closed */
  onClose: () => void;

  /** Function called with selected item IDs when submitted */
  onSubmit: (itemIds: string[]) => void;

  /** Array of items to display in the dialog */
  items: T[];

  /** Optional dialog title (if not provided, will use i18n "title" key) */
  title?: string;

  /** Optional submit button label (if not provided, will use i18n "add" key) */
  submitLabel?: string;

  /** Optional cancel button label (if not provided, will use i18n "cancel" key) */
  cancelLabel?: string;

  /** Optional search placeholder text (if not provided, will use i18n "search" key) */
  searchPlaceholder?: string;

  /** Optional text when no items match search (if not provided, will use i18n "noItemsFound" key) */
  noItemsFoundText?: string;

  /** Optional text when no items are available (if not provided, will use i18n "noAvailableItems" key) */
  noAvailableItemsText?: string;

  /** i18n namespace for translations, defaults to "common" */
  translationNamespace?: string;

  /** Custom filter function for search */
  filterItems?: (items: T[], searchTerm: string) => T[];

  /** Function to render the primary text for an item */
  renderPrimary?: (item: T) => ReactNode;

  /** Function to render the secondary text for an item */
  renderSecondary?: (item: T) => ReactNode;
}

/**
 * SelectItemsDialog
 *
 * A reusable dialog component for selecting multiple items from a list.
 * Uses a generic approach to work with any data type that has an ID.
 *
 * @template T Type of items displayed in the dialog, must extend BaseItem
 */
export function SelectItemsDialog<T extends BaseItem>({
  open,
  onClose,
  onSubmit,
  items,
  title,
  submitLabel,
  cancelLabel,
  searchPlaceholder,
  noItemsFoundText,
  noAvailableItemsText,
  translationNamespace = "common",
  filterItems,
  renderPrimary = (item) => item.name || item.id,
  renderSecondary = (item) => item.description || "",
}: SelectItemsDialogProps<T>): React.ReactElement {
  const { t } = useTranslation(translationNamespace);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedItemIds([]);
      setSearchTerm("");
    }
  }, [open]);

  /**
   * Filters items based on search term
   */
  const filteredItems = filterItems
    ? filterItems(items, searchTerm)
    : items.filter((item) => {
        const primary = renderPrimary(item);
        const secondary = renderSecondary(item);
        const searchLower = searchTerm.toLowerCase();

        return (
          (typeof primary === "string" &&
            primary.toLowerCase().includes(searchLower)) ||
          (typeof secondary === "string" &&
            secondary.toLowerCase().includes(searchLower))
        );
      });

  /**
   * Toggles selection state for an item
   */
  const handleToggleItem = (itemId: string): void => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  /**
   * Handles form submission with selected items
   */
  const handleSubmit = (): void => {
    onSubmit(selectedItemIds);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="select-items-dialog-title"
    >
      <DialogTitle id="select-items-dialog-title">
        {title || t("title")}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder || t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
              },
            }}
            variant="outlined"
            size="small"
          />
        </Box>

        <List sx={{ pt: 0, maxHeight: 400, overflow: "auto" }}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <ListItem
                  key={item.id}
                  dense
                  onClick={() => handleToggleItem(item.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    cursor: "pointer",
                    bgcolor: isSelected ? "action.selected" : "inherit",
                    "&:hover": {
                      bgcolor: isSelected ? "action.selected" : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedItemIds.includes(item.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={renderPrimary(item)}
                    secondary={renderSecondary(item)}
                  />
                </ListItem>
              );
            })
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  searchTerm
                    ? noItemsFoundText || t("noItemsFound")
                    : noAvailableItemsText || t("noAvailableItems")
                }
              />
            </ListItem>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{cancelLabel || t("cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedItemIds.length === 0}
          color="primary"
        >
          {submitLabel || t("add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
