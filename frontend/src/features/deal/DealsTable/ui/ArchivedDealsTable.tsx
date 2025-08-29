"use client";
import React from "react";
import dynamic from "next/dynamic";

import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  DealExt,
  DealViewSwitcher,
  useGetDealsQuery,
} from "@/entities/deal";
import {
  BaseTable,
  BaseTableHeadProps,
  BaseTableProps,
  BaseTableRowData,
  Column,
  SortableFields,
  ActionMenuItemProps,
  BaseTableHead,
  BaseTableToolbar,
  ToolbarMenuItem,
  BaseTableToolbarProps,
} from "@/features/BaseTable";
import { useEntityDialog } from "@/shared/lib/hooks";

import { DealTableRowData, dealTableColumns } from "../model";
import { mapDealsToDealRows, useTableActions, useDealOperations } from "../lib";

const DealsTableHead = <TTableData extends BaseTableRowData>(
  props: BaseTableHeadProps<TTableData>
) => {
  return (
    <BaseTableHead
      {...props}
      columns={dealTableColumns as unknown as Column<TTableData>[]}
    />
  );
};

const EditDialog = dynamic(
  () =>
    import("@/features/deal/DealEditDialog").then((mod) => mod.DealEditDialog),
  { ssr: false }
);

export type ArchivedDealsTableProps<T extends DealExt> = BaseTableProps<
  T,
  DealTableRowData
> & {};

export function ArchivedDealsTable<T extends DealExt>({
  initialData,
  order,
  orderBy = "stage" as SortableFields<DealTableRowData>,
  sx,
}: ArchivedDealsTableProps<T>) {
  const {
    entityId: clickedId,
    handleEditClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const { handleRestore, handleRestores, handleRefreshData } =
    useDealOperations();

  const { } = useTableActions();

  // fetch deals
  const { data: deals = initialData || [] } = useGetDealsQuery(
    { statuses: ["ARCHIVED"], excludeStatuses: ["ACTIVE"] },
    {
      refetchOnFocus: true,
    }
  );

  const rowActionMenuItems: ActionMenuItemProps<DealTableRowData>[] =
    React.useMemo(
      () => [
        {
          title: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
        {
          title: "Restore deal",
          icon: <RestoreIcon fontSize="small" />,
          onClick: handleRestore,
        },
      ],
      [handleRestore, handleEditClick]
    );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(
    () => [
      {
        title: "Filter",
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: "Refresh deals' list",
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: "Restore deals",
        icon: <RestoreIcon fontSize="small" />,
        onClickMultiple: handleRestores,
        isGroupAction: true,
      },
    ],
    [handleRestores, handleRefreshData]
  );

  const ToolbarComponent = ({ selected, clearSelection }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={<DealViewSwitcher title="Archived Deals" />}
      selected={selected}
      menuItems={toolbarMenuItems}
      clearSelection={clearSelection}
    />
  );

  return (
    <>
      <BaseTable
        initialData={deals ?? initialData}
        order={order}
        orderBy={orderBy}
        columnsConfig={dealTableColumns}
        TableToolbarComponent={ToolbarComponent}
        TableHeadComponent={DealsTableHead}
        rowMapper={mapDealsToDealRows}
        rowActionMenuItems={rowActionMenuItems}
        sx={sx}
      />
      {showDialog && (
        <EditDialog
          id={clickedId || undefined}
          open={true}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
