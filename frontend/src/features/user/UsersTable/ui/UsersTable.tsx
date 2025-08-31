"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  BaseTable,
  BaseTableProps,
  BaseTableToolbar,
  BaseTableToolbarProps,
  SortableFields,
  ToolbarMenuItem,
} from "@/features/BaseTable";
import {
  UserExt,
  UserStatus,
  UserStatusFilter,
  UserViewSwitcher,
  useGetUsersQuery,
} from "@/entities/user";
import { useTranslation } from "react-i18next";
import { useEntityDialog } from "@/shared/lib";
import { UserTableRowData } from "../model/types";
import { userTableColumns } from "../model/columns";
import { mapUsersToUserRows } from "../lib/mappers";
import { useUserOperations } from "../lib/useUserOperations";
import { useTableActions } from "../lib/useTableActions";
import { useUserRowActions } from "../lib/useUserRowActions";
import { UsersTableHead } from "./UsersTableHead";
import FilterList from "@mui/icons-material/FilterList";
import Refresh from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AddIcon from "@mui/icons-material/Add";

// Dynamically import the edit dialog
const UserEditDialog = dynamic(
  () =>
    import("@/features/user/UserEditDialog").then((mod) => mod.UserEditDialog),
  { ssr: false }
);

// header titles resolved via i18n inside component

export interface UsersTableProps
  extends Omit<BaseTableProps<UserExt, UserTableRowData>, "initialData"> {
  initialData?: UserExt[];
  status?: UserStatus;
}

export function UsersTable({
  initialData = [],
  order = "asc",
  orderBy = "name" as SortableFields<UserTableRowData>,
  sx,
  status,
}: UsersTableProps) {
  const { t } = useTranslation("user");
  // Local state for status filter
  const [statusFilter, setStatusFilter] = React.useState<UserStatusFilter>(
    status || "ACTIVE"
  );

  // Update local state when status prop changes
  React.useEffect(() => {
    setStatusFilter(status || "ACTIVE");
  }, [status]);

  // Hooks for handling dialogs and actions
  const {
    entityId: clickedId,
    handleEditClick: handleEditDialogOpen,
    handleCreateClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const {
    handleBlock,
    handleUnblock,
    handleBlocks,
    handleUnblocks,
    handleRefreshData,
  } = useUserOperations();

  const { } = useTableActions();

  // Create row actions using custom hook
  const { rowActionMenuItemsCreator } = useUserRowActions({
    onEdit: handleEditDialogOpen,
    onBlock: handleBlock,
    onUnblock: handleUnblock,
  });

  // Get user data
  const { data: users = initialData } = useGetUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  //  Filtering users by status
  const filteredUsers = React.useMemo(() => {
    if (statusFilter === "ALL") return users;
    return users.filter((user) => user.status === statusFilter);
  }, [users, statusFilter]);

  // Handle status filter change
  const handleStatusFilterChange = React.useCallback(
    (filter: UserStatusFilter) => {
      setStatusFilter(filter);
    },
    []
  );

  const groupActions = useMemo(
    () => ({
      BLOCKED: [
        {
          title: t("table.action.unblockSelected"),
          icon: <LockOpenIcon fontSize="small" />,
          onClickMultiple: handleUnblocks,
          isGroupAction: true,
        },
      ],
      ACTIVE: [
        {
          title: t("table.action.blockSelected"),
          icon: <BlockIcon fontSize="small" />,
          onClickMultiple: handleBlocks,
          isGroupAction: true,
        },
      ],
      INACTIVE: [],
      ALL: [],
    }),
    [handleUnblocks, handleBlocks, t]
  );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(() => {
    const base = [
      {
        title: t("table.action.filter"),
        icon: <FilterList fontSize="small" />,
      },
      {
        title: t("table.action.refresh"),
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: t("table.action.create"),
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
    ];

    return base.concat(groupActions[statusFilter]);
  }, [statusFilter, handleRefreshData, groupActions, handleCreateClick, t]);

  const ToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={
        <UserViewSwitcher
          title={headerTitle}
          value={statusFilter}
          onChange={handleStatusFilterChange}
        />
      }
      selected={selected}
      menuItems={toolbarMenuItems}
      clearSelection={clearSelection}
    />
  );

  const headerTitle = useMemo(
    () =>
      (
        {
          ACTIVE: t("view.active"),
          ALL: t("view.all"),
          BLOCKED: t("view.blocked"),
          INACTIVE: t("view.inactive", "Inactive Users"),
        } as Record<UserStatusFilter, string>
      )[statusFilter],
    [statusFilter, t]
  );

  const localizedColumns = React.useMemo(() => {
    const mapping: Record<string, string> = {
      name: 'user:table.column.name',
      email: 'user:table.column.email',
      role: 'user:table.column.role',
      status: 'user:table.column.status',
      createdAt: 'user:table.column.createdAt'
    };
    return userTableColumns.map(col => col.key && mapping[col.key as string]
      ? { ...col, label: t(mapping[col.key as string]) }
      : col);
  }, [t]);

  return (
    <>
      <BaseTable
        initialData={filteredUsers}
        order={order}
        orderBy={orderBy}
        columnsConfig={localizedColumns}
        TableToolbarComponent={ToolbarComponent}
        TableHeadComponent={UsersTableHead}
        rowMapper={mapUsersToUserRows}
        rowActionMenuItemsCreator={rowActionMenuItemsCreator}
        sx={sx}
      />
      {showDialog && (
        <UserEditDialog
          id={clickedId || undefined}
          open={true}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
