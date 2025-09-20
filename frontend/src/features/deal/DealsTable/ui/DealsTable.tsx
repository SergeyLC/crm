"use client";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

import ArchiveIcon from "@mui/icons-material/Archive";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  DealExt,
  DealViewSwitcher,
  useGetActiveDealsQuery,
} from "@/entities/deal";

import { QueryKeyType, useInvalidateQueries } from "@/shared";
import {
  DealActiveQueryKey,
  DealArchivedQueryKey,
  DealLostQueryKey,
  DealWonQueryKey,
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
import { TFunction } from "i18next";
import { mapDealsToDealRows, useDealArchiveOperations } from "../lib";

// Will inject translated columns inside component (needs t), so export a factory.
const makeDealsTableHead = (t: TFunction) => {
  const Head = <TTableData extends BaseTableRowData>(
    props: BaseTableHeadProps<TTableData>
  ) => (
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
  ToolbarComponent?: React.FC<BaseTableToolbarProps>;
};

const invalidateDealsQueryKeys = [
  DealActiveQueryKey,
  DealArchivedQueryKey,
  DealWonQueryKey,
  DealLostQueryKey,
] as unknown[] as QueryKeyType[];

export function DealsTable<T extends DealExt>({
  initialData,
  order = "desc",
  orderBy = "potentialValue" as SortableFields<DealTableRowData>,
  sx,
  toolbarTitle,
  ToolbarComponent,
}: DealsTableProps<T>) {
  const { t } = useTranslation("deal");
  const effectiveToolbarTitle = toolbarTitle ?? (
    <DealViewSwitcher title={t("viewSwitcher.deals")} />
  );
  const {
    entityId: clickedId,
    handleEditClick,
    handleCreateClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();
  // Use initialData only on first render, thereafter — undefined
  const wasInitialDataUsed = React.useRef(false);

  // After the first render, do not pass initialData anymore
  React.useEffect(() => {
    if (!wasInitialDataUsed.current && initialData) {
      wasInitialDataUsed.current = true;
    }
  }, [initialData]);

  const { useQuery, queryKey } = useGetActiveDealsQuery(undefined, {
    placeholderData: wasInitialDataUsed.current ? undefined : initialData,
  });

  const { data: deals = [] } = useQuery;

  const invalidateDeals = useInvalidateQueries();

  const onSuccess = React.useCallback(() => {
    // Invalidate all related deal queries
    invalidateDeals([
      queryKey as QueryKeyType,
      DealArchivedQueryKey as unknown as QueryKeyType,
    ]);
  }, [invalidateDeals, queryKey]);
  const { handleArchive, handleArchives } = useDealArchiveOperations(onSuccess);

  const handleRefreshData = useCallback(async () => {
    invalidateDeals([queryKey as QueryKeyType]);
  }, [invalidateDeals, queryKey]);

  const rowActionMenuItems: ActionMenuItemProps<DealTableRowData>[] =
    React.useMemo(
      () => [
        {
          title: t("action.edit"),
          icon: <EditIcon fontSize="small" />,
          tooltip: t("tooltip.editDeal"),
          onClick: handleEditClick,
        },
        {
          title: t("action.archive"),
          icon: <ArchiveIcon fontSize="small" />,
          tooltip: t("tooltip.archiveDeal"),
          onClick: handleArchive,
        },
      ],
      [handleArchive, handleEditClick, t]
    );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(
    () => [
      {
        title: t("toolbar.filter"),
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: t("toolbar.refreshDeals"),
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: t("toolbar.create"),
        icon: <AddIcon fontSize="small" />,
        onClick: handleCreateClick,
      },
      {
        title: t("toolbar.archiveSelected"),
        icon: <ArchiveIcon fontSize="small" />,
        onClickMultiple: handleArchives,
        isGroupAction: true,
      },
    ],
    [handleCreateClick, handleRefreshData, handleArchives, t]
  );

  const DealsTableHead = React.useMemo(() => makeDealsTableHead(t), [t]);

  const TableToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
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
        initialData={deals}
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
          // Invalidate all related deal queries
          invalidateKeys={invalidateDealsQueryKeys}
        />
      )}
    </>
  );
}
