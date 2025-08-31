"use client";
import React from "react";
import { useTranslation } from 'react-i18next';
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

import { DealTableRowData, buildDealTableColumns } from "../model";
import { TFunction } from 'i18next';
import { mapDealsToDealRows, useTableActions, useDealOperations } from "../lib";

// Will inject translated columns inside component (needs t), so export a factory.
const makeDealsTableHead = (t: TFunction) => {
  const Head = <TTableData extends BaseTableRowData>(props: BaseTableHeadProps<TTableData>) => (
    <BaseTableHead
      {...props}
      columns={buildDealTableColumns(t) as unknown as Column<TTableData>[]}
    />
  );
  return Head;
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
  toolbarTitle,
  ToolbarComponent,
}: DealsTableProps<T>) {
  const { t } = useTranslation('deal');
  const effectiveToolbarTitle = toolbarTitle ?? <DealViewSwitcher title={t('viewSwitcher.deals')} />;
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
          title: t('action.edit'),
          icon: <EditIcon fontSize="small" />,
          tooltip: t('tooltip.editDeal'),
          onClick: handleEditClick,
        },
        {
          title: t('action.archive'),
          icon: <ArchiveIcon fontSize="small" />,
          tooltip: t('tooltip.archiveDeal'),
          onClick: handleArchive,
        },
      ],
      [handleArchive, handleEditClick, t]
    );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(
    () => [
      {
        title: t('toolbar.filter'),
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: t('toolbar.refreshDeals'),
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: t('toolbar.create'),
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
      {
        title: t('toolbar.archiveSelected'),
        icon: <ArchiveIcon fontSize="small" />,
        onClickMultiple: handleArchives,
        isGroupAction: true,
      },
    ],
    [handleCreateClick, handleRefreshData, handleArchives, t]
  );

  const DealsTableHead = React.useMemo(() => makeDealsTableHead(t), [t]);

  const TableToolbarComponent = ({ selected, clearSelection }: BaseTableToolbarProps) => (
    <>
      {ToolbarComponent ? (
        <ToolbarComponent selected={selected} clearSelection={clearSelection} />
      ) : (
        <BaseTableToolbar
          title={effectiveToolbarTitle}
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
  columnsConfig={buildDealTableColumns(t)}
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
