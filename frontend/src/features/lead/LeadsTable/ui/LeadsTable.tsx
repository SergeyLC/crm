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
  BaseTableRowData,
} from "@/features/BaseTable";
import {
  useGetLeadsQuery,
  useGetArchivedLeadsQuery,
  LeadExt,
  LeadViewSwitcher,
} from "@/entities/lead";
import { ActionMenuItemProps } from "@/features/BaseTable";

import { useEntityDialog } from "@/shared/lib/hooks";

import {
  buildLeadTableColumns,
  LeadTableRowData,
  mapLeadsToLeadRows,
} from "../model";
import { useLeadOperations } from "../lib";
import { useTranslation } from "react-i18next";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useQueryClient } from "@tanstack/react-query";
import { leadKeys } from "@/entities/lead";
import { TFunction } from "i18next/typescript/t";

const EditDialog = dynamic(
  () =>
    import("@/features/lead/ui/LeadEditDialog").then(
      (mod) => mod.LeadEditDialog
    ),
  { ssr: false }
);

// Will inject translated columns inside component (needs t), so export a factory.
const makeLeadsTableHead = (t: TFunction) => {
  const Head = <TTableData extends BaseTableRowData>(
    props: BaseTableHeadProps<TTableData>
  ) => (
    <BaseTableHead
      {...props}
      columns={buildLeadTableColumns(t) as unknown as Column<TTableData>[]}
    />
  );
  return Head;
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

  const { data: archivedLeads = [], isLoading: isLoadingArchived } = useGetArchivedLeadsQuery(showArchived);
  const { data: activeLeads = [], isLoading: isLoadingActive } = useGetLeadsQuery(!showArchived);

  // Select the appropriate data based on showArchived prop
  const leads = showArchived ? archivedLeads : activeLeads;
  const isLoading = showArchived ? isLoadingArchived : isLoadingActive;

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

  const LeadsTableHead = React.useMemo(() => makeLeadsTableHead(t), [t]);

  const ToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={
        <LeadViewSwitcher
          title={
            showArchived ? t('table.archivedTitle') : t('table.title')
          }
        />
      }
      selected={selected}
      menuItems={toolbarMenuItems}
      clearSelection={clearSelection}
    />
  );

  const columnsConfig = React.useMemo(() => buildLeadTableColumns(t), [t]);

  // Show loading state if data is being fetched
  if (isLoading && leads.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        {showArchived ? t('list.loading') : t('list.loading')}
      </div>
    );
  }

  return (
    <>
      <BaseTable
        initialData={leads}
        order={order}
        orderBy={orderBy}
        TableToolbarComponent={ToolbarComponent}
        toolbarTitle={t('table.title')}
        TableHeadComponent={LeadsTableHead}
        columnsConfig={columnsConfig}
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
