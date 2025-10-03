import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { ActionMenuItemProps } from "@/features/base-table";
import { UserTableRowData } from "../model/types";

export interface UseUserRowActionsConfig {
  onEdit: (e: React.MouseEvent, id: string) => void;
  onBlock: (e?: React.MouseEvent, id?: string) => void;
  onUnblock: (e?: React.MouseEvent, id?: string) => void;
}

export function useUserRowActions({
  onEdit,
  onBlock,
  onUnblock,
}: UseUserRowActionsConfig): {
  rowActionMenuItemsCreator: (
    row: UserTableRowData
  ) => ActionMenuItemProps<UserTableRowData>[];
} {
  const { t } = useTranslation("user");
  const rowActionMenuItemsCreator = useCallback(
    (row: UserTableRowData): ActionMenuItemProps<UserTableRowData>[] => [
      {
        title: t("table.action.edit", "Edit"),
        icon: <EditIcon fontSize="small" />,
        onClick: (e: React.MouseEvent) => {
          onEdit(e, row.id);
        },
      },
      {
        title:
          row.status === "ACTIVE"
            ? t("table.action.block", "Block")
            : t("table.action.unblock", "Unblock"),
        icon:
          row.status === "ACTIVE" ? (
            <BlockIcon fontSize="small" />
          ) : (
            <LockOpenIcon fontSize="small" />
          ),
        onClick: (e: React.MouseEvent) => {
          const { id, status } = row;
          if (status === "ACTIVE") {
            onBlock(e, id);
          } else {
            onUnblock(e, id);
          }
        },
      },
    ],
    [onEdit, onBlock, onUnblock, t]
  );

  return { rowActionMenuItemsCreator };
}
