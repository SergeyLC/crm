"use client";
import React from "react";
import dynamic from "next/dynamic";

import ArchiveIcon from "@mui/icons-material/Archive";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  DealExt,
  DealStatus,
  DealStage,
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

export type DealsTableProps<T extends DealExt> = BaseTableProps<
  T,
  DealTableRowData
> & {
  ToolbarComponent?: React.FC<BaseTableToolbarProps>
  stages?: DealStage[];
  excludeStages?: DealStage[];
  statuses?: DealStatus[];
  excludeStatuses?: DealStatus[];
};

export function DealsTable<T extends DealExt>({
  initialData,
  order,
  stages,
  excludeStages,
  statuses,
  excludeStatuses,
  orderBy = "stage" as SortableFields<DealTableRowData>,
  sx,
  toolbarTitle = <DealViewSwitcher title="Deals" />,
  ToolbarComponent,
}: DealsTableProps<T>) {
  const {
    entityId: clickedId,
    handleEditClick,
    handleCreateClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const { handleArchive, handleArchives, handleRefreshData } =
    useDealOperations();

  const { } = useTableActions();

  // fetch deals
  const { data: deals = initialData || [] } = useGetDealsQuery(
    { statuses, stages, excludeStatuses, excludeStages },
    {
      // Remove refetchOnMountOrArgChange to prevent double requests
      // RTK Query will automatically refetch when tags are invalidated
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
          title: "Archive",
          icon: <ArchiveIcon fontSize="small" />,
          onClick: handleArchive,
        },
      ],
      [handleArchive, handleEditClick]
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
        title: "Create deal",
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
      {
        title: "Archive deals",
        icon: <ArchiveIcon fontSize="small" />,
        onClickMultiple: handleArchives,
        isGroupAction: true,
      },
    ],
    [handleCreateClick, handleRefreshData, handleArchives]
  );

  const TableToolbarComponent = ({ selected, clearSelection }: BaseTableToolbarProps) => (
    <>
      {ToolbarComponent ? (
        <ToolbarComponent selected={selected} clearSelection={clearSelection} />
      ) : (
        <BaseTableToolbar
          title={toolbarTitle}
          selected={selected}
          menuItems={toolbarMenuItems}
          clearSelection={clearSelection}
        />
      )}
    </>
  );

  return (
    <>
      <BaseTable
        initialData={deals?.length > 0 ? deals : initialData}
        order={order}
        orderBy={orderBy}
        columnsConfig={dealTableColumns}
        TableToolbarComponent={TableToolbarComponent}
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
