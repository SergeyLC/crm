"use client";
import React from "react";
import dynamic from "next/dynamic";
import ArchiveIcon from "@mui/icons-material/Archive";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import UnarchiveIcon from "@mui/icons-material/Unarchive";

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
  useGetArchivedLeadsQuery,
  LeadExt,
  LeadViewSwitcher,
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
  () =>
    import("@/features/lead/ui/LeadEditDialog").then(
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
  showArchived = false,
}: BaseTableProps<T, LeadTableRowData> & { showArchived?: boolean }) {
  const {
    entityId: clickedId,
    handleEditClick,
    handleDialogClose,
    handleCreateClick,
    showDialog,
  } = useEntityDialog();

  const {
    handleConvert,
    handleConverts,
    handleArchive,
    handleArchives,
    handleRestore,
    handleRestores,
    handleRefreshData,
  } = useLeadOperations();

  const { data: archivedLeads = initialData || [] } = useGetArchivedLeadsQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      skip: !showArchived,
    }
  );

  const { data: leads = initialData || archivedLeads || [] } = useGetLeadsQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      skip: showArchived,
    }
  );

  const rowActionMenuItems: ActionMenuItemProps<LeadTableRowData>[] =
    React.useMemo(() => {
      const baseItems = [
        {
          title: "Edit",
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
      ];

      if (showArchived) {
        // For archived leads: only edit and restore
        return [
          ...baseItems,
          {
            title: "Restore",
            tooltip: "Restore leads from archive",
            icon: <UnarchiveIcon fontSize="small" />,
            onClick: handleRestore,
          },
        ];
      } else {
        // For active leads: all actions
        return [
          ...baseItems,
          {
            title: "Convert to deal",
            tooltip: "Convert lead to deals",
            icon: <SwapHorizIcon fontSize="small" />,
            onClick: handleConvert,
          },
          {
            title: "Archive",
            tooltip: "Archive lead",
            icon: <ArchiveIcon fontSize="small" />,
            onClick: handleArchive,
          },
        ];
      }
    }, [
      showArchived,
      handleEditClick,
      handleConvert,
      handleArchive,
      handleRestore,
    ]);

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(() => {
    const baseItems = [
      {
        title: "Filter",
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: "Refresh leads' list",
        tooltip: "Refresh leads' list",
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
    ];

    if (showArchived) {
      // For archived leads: only filter, refresh, and restore
      return [
        ...baseItems,
        {
          title: "Restore leads",
          tooltip: "Restore selected leads from archive",
          icon: <UnarchiveIcon fontSize="small" />,
          onClickMultiple: handleRestores,
          isGroupAction: true,
        },
      ];
    } else {
      // For active leads: all actions
      return [
        ...baseItems,
        {
          title: "Create lead",
          tooltip: "Create a new lead",
          icon: <AddIcon fontSize="small" />,
          onClick: handleCreateClick,
        },
        {
          title: "Convert to deal",
          tooltip: "Convert selected leads to deals",
          icon: <SwapHorizIcon fontSize="small" />,
          onClickMultiple: handleConverts,
          isGroupAction: true,
        },
        {
          title: "Archive",
          tooltip: "Archive selected leads",
          icon: <ArchiveIcon fontSize="small" />,
          onClickMultiple: handleArchives,
          isGroupAction: true,
        },
      ];
    }
  }, [
    showArchived,
    handleRefreshData,
    handleCreateClick,
    handleConverts,
    handleArchives,
    handleRestores,
  ]);

  const ToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={
        <LeadViewSwitcher title={showArchived ? "Archived Leads" : "Leads"} />
      }
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
