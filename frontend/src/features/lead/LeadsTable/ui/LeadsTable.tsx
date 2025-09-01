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
import { useTranslation } from "react-i18next";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useQueryClient } from '@tanstack/react-query';
import { leadKeys } from '@/entities/lead/api-tanstack';

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

  const { data: archivedLeads = [] } = useGetArchivedLeadsQuery(showArchived);
    const { data: activeLeads = [] } = useGetLeadsQuery(!showArchived);

  // Select the appropriate data based on showArchived prop
  const leads = showArchived ? archivedLeads : activeLeads;

  const queryClient = useQueryClient();

  // Invalidate queries when showArchived changes to ensure fresh data
  React.useEffect(() => {
    if (showArchived) {
      queryClient.invalidateQueries({ queryKey: leadKeys.archived() });
    } else {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    }
  }, [showArchived, queryClient]);

  const { t } = useTranslation("lead");

  // Localize column labels at render time (avoid i18next in model layer)
  const localizedColumns = React.useMemo(() => {
    const mapping: Record<string, string> = {
      title: "lead:table.column.title",
      assigneeName: "lead:table.column.assignee",
      potentialValue: "lead:table.column.potential",
      clientName: "lead:table.column.client",
    };
    return leadTableColumns.map((col) =>
      col.key && mapping[col.key as string]
        ? { ...col, label: t(mapping[col.key as string]) }
        : col
    );
  }, [t]);

  const rowActionMenuItems: ActionMenuItemProps<LeadTableRowData>[] =
    React.useMemo(() => {
      const baseItems = [
        {
          title: t("lead:table.action.edit"),
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
      ];

      if (showArchived) {
        return [
          ...baseItems,
          {
            title: t("lead:table.action.restore"),
            tooltip: t("lead:table.tooltip.restore"),
            icon: <UnarchiveIcon fontSize="small" />,
            onClick: handleRestore,
          },
        ];
      }
      return [
        ...baseItems,
        {
          title: t("lead:table.action.convert"),
          tooltip: t("lead:table.tooltip.convert"),
          icon: <SwapHorizIcon fontSize="small" />,
          onClick: handleConvert,
        },
        {
          title: t("lead:table.action.archive"),
          tooltip: t("lead:table.tooltip.archive"),
          icon: <ArchiveIcon fontSize="small" />,
          onClick: handleArchive,
        },
      ];
    }, [
      showArchived,
      handleEditClick,
      handleConvert,
      handleArchive,
      handleRestore,
      t,
    ]);

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(() => {
    const baseItems = [
      {
        title: t("lead:table.action.filter"),
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: t("lead:table.action.refresh"),
        tooltip: t("lead:table.tooltip.refresh"),
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
    ];
    if (showArchived) {
      return [
        ...baseItems,
        {
          title: t("lead:table.action.restore"),
          tooltip: t("lead:table.tooltip.restoreSelected"),
          icon: <UnarchiveIcon fontSize="small" />,
          onClickMultiple: handleRestores,
          isGroupAction: true,
        },
      ];
    }
    return [
      ...baseItems,
      {
        title: t("lead:table.action.create"),
        tooltip: t("lead:table.tooltip.create"),
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
      {
        title: t("lead:table.action.convert"),
        tooltip: t("lead:table.tooltip.convertSelected"),
        icon: <SwapHorizIcon fontSize="small" />,
        onClickMultiple: handleConverts,
        isGroupAction: true,
      },
      {
        title: t("lead:table.action.archive"),
        tooltip: t("lead:table.tooltip.archiveSelected"),
        icon: <ArchiveIcon fontSize="small" />,
        onClickMultiple: handleArchives,
        isGroupAction: true,
      },
    ];
  }, [
    showArchived,
    handleRefreshData,
    handleCreateClick,
    handleConverts,
    handleArchives,
    handleRestores,
    t,
  ]);

  const ToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={
        <LeadViewSwitcher
          title={
            showArchived ? t("lead:table.archivedTitle") : t("lead:table.title")
          }
        />
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
        toolbarTitle={t("lead:table.title")}
        TableHeadComponent={LeadsTableHead}
        columnsConfig={localizedColumns}
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
