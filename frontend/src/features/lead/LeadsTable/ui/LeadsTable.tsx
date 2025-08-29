"use client";
import React from "react";
import dynamic from "next/dynamic";
import ArchiveIcon from "@mui/icons-material/Archive";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EditIcon from "@mui/icons-material/Edit";

import {
  BaseTable,
  BaseTableHeadProps,
  BaseTableProps,
  SortableFields,
  BaseTableHead,
  Column,
  BaseTableToolbar,
  BaseTableToolbarProps,
  ToolbarMenuItem,
} from "@/features/BaseTable";
import {
  useGetLeadsQuery,
  LeadExt,
} from "@/entities/lead";
import { ActionMenuItemProps } from "@/features/BaseTable";

import { useEntityDialog } from "@/shared";

import {
  leadTableColumns,
  LeadTableRowData,
  mapLeadsToLeadRows,
} from "../model";
import { useLeadOperations } from "../lib";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";

const EditDialog = dynamic(
  () => import("@/features/lead/ui/LeadEditDialog").then(
    (mod) => mod.LeadEditDialog
  ),
  { ssr: false }
);

const LeadsTableHead = <TTableData extends LeadTableRowData>(
  props: BaseTableHeadProps<TTableData>
) => {
  return (
    <BaseTableHead
      {...props}
      columns={leadTableColumns as unknown as Column<TTableData>[]}
    />
  );
};

export function LeadsTable<T extends LeadExt>({
  initialData,
  order = "asc",
  orderBy = "createdAt" as SortableFields<LeadTableRowData>,
}: BaseTableProps<T, LeadTableRowData>) {
  const {
    entityId: clickedId,
    handleEditClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const { handleConvert, handleConverts, handleArchive, handleArchives, handleRefreshData } = useLeadOperations();

  const { data: leads = initialData || [] } = useGetLeadsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const rowActionMenuItems: ActionMenuItemProps<LeadTableRowData>[] =
    React.useMemo(
      () => [
        {
          title: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
        {
          title: "Convert to deal",
          icon: <SwapHorizIcon fontSize="small" />,
          onClick: handleConvert,
        },
        {
          title: "Archive",
          icon: <ArchiveIcon fontSize="small" />,
          onClick: handleArchive,
        },
      ],
      [handleEditClick, handleConvert, handleArchive]
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
        title: "Convert to deal",
        icon: <SwapHorizIcon fontSize="small" />,
        onClickMultiple: handleConverts,
        isGroupAction: true,
      },
      {
        title: "Archive",
        icon: <ArchiveIcon fontSize="small" />,
        onClickMultiple: handleArchives,
        isGroupAction: true,
      },
    ],
    [handleConverts, handleArchives, handleRefreshData]
  );

  const ToolbarComponent = ({ selected, clearSelection }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title="Leads"
      selected={selected}
      menuItems={toolbarMenuItems}
      clearSelection={clearSelection}
    />
  );

  return (
    <>
      <BaseTable
        initialData={leads}
        order={order}
        orderBy={orderBy}
        TableToolbarComponent={ToolbarComponent}
        toolbarTitle="Leads"
        TableHeadComponent={LeadsTableHead}
        columnsConfig={leadTableColumns}
        rowMapper={mapLeadsToLeadRows}
        rowActionMenuItems={rowActionMenuItems}
        sx={{ p: 0, m: 0 }}
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
