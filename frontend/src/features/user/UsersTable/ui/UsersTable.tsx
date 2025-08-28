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
import { ALL } from "dns";

// Dynamically import the edit dialog
const UserEditDialog = dynamic(
  () =>
    import("@/features/user/UserEditDialog").then((mod) => mod.UserEditDialog),
  { ssr: false }
);

const headerTitles: Record<UserStatusFilter, string> = {
  ACTIVE: "Active users",
  ALL: "All users",
  BLOCKED: "Blocked users",
  INACTIVE: "Inactive users",
};

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

  const { handleDeleteClick, isDeleting } = useTableActions();

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
      headerTitles[filter];
    },
    []
  );

  const groupActions = useMemo(
    () => ({
      BLOCKED: [
        {
          title: "Unblock users",
          icon: <LockOpenIcon fontSize="small" />,
          onClickMultiple: handleUnblocks,
          isGroupAction: true,
        },
      ],
      ACTIVE: [
        {
          title: "Block users",
          icon: <BlockIcon fontSize="small" />,
          onClickMultiple: handleBlocks,
          isGroupAction: true,
        },
      ],
      INACTIVE: [],
      ALL: [],
    }),
    [handleUnblocks, handleBlocks]
  );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(() => {
    const base = [
      {
        title: "Filter",
        icon: <FilterList fontSize="small" />,
        // icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: "Refresh deals' list",
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: "Create user",
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
    ];

    return base.concat(groupActions[statusFilter]);
  }, [statusFilter, handleBlocks, handleRefreshData, handleUnblocks]);

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

  const headerTitle = useMemo(() => headerTitles[statusFilter], [statusFilter]);

  return (
    <>
      <BaseTable
        initialData={filteredUsers}
        order={order}
        orderBy={orderBy}
        columnsConfig={userTableColumns}
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
