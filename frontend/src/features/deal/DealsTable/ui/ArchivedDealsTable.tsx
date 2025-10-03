"use client";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

import EditIcon from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import UnarchiveIcon from "@mui/icons-material/Unarchive";

import {
  DealActiveQueryKey,
  DealArchivedQueryKey,
  DealExt,
  DealLostQueryKey,
  DealViewSwitcher,
  DealWonQueryKey,
  useGetArchivedDealsQuery,
} from "@/entities/deal";

import { queryClient, QueryKeyType, useInvalidateQueries } from "@/shared";

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
} from "@/features/base-table";
import { useEntityDialog } from "@/shared/lib/hooks";

import { DealTableRowData, buildDealTableColumns } from "../model";
import { TFunction } from "i18next";
import { mapDealsToDealRows, useDealRestoreOperations } from "../lib";

const makeDealsTableHead = (t: TFunction) => {
  const Head = <TTableData extends BaseTableRowData>(
    props: BaseTableHeadProps<TTableData>
  ) => (
    <BaseTableHead
      {...props}
      columns={buildDealTableColumns(t) as unknown as Column<TTableData>[]}
    />
  );
  // displayName optional
  return Head;
};

const invalidateDealsQueryKeys = [
  DealActiveQueryKey,
  DealArchivedQueryKey,
  DealWonQueryKey,
  DealLostQueryKey,
];

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
  const { t } = useTranslation("deal");
  const {
    entityId: clickedId,
    handleEditClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const wasInitialDataUsed = React.useRef(false);
  const invalidateDeals = useInvalidateQueries();

  React.useEffect(() => {
    if (!wasInitialDataUsed.current && initialData) {
      wasInitialDataUsed.current = true;
    }
  }, [initialData]);


  const { useQuery, queryKey } = useGetArchivedDealsQuery(undefined, {
    placeholderData: wasInitialDataUsed.current ? undefined : initialData,
  });

  const { data: deals = [] } = useQuery;

  const onSuccess = React.useCallback(() => {
    // Invalidate all related deal queries for restore action
    invalidateDeals([
      queryKey as QueryKeyType,
      DealActiveQueryKey as unknown as QueryKeyType,
    ]);
  }, [invalidateDeals, queryKey]);
  const { handleRestore, handleRestores } = useDealRestoreOperations(onSuccess);

  const handleRefreshData = useCallback(async () => {
    invalidateDeals([queryKey as QueryKeyType]);
    await queryClient.refetchQueries({ queryKey });
  }, [invalidateDeals, queryKey]);

  const rowActionMenuItems: ActionMenuItemProps<DealTableRowData>[] =
    React.useMemo(
      () => [
        {
          title: t("action.edit"),
          tooltip: t("tooltip.editDeal"),
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
        {
          title: t("action.restore"),
          tooltip: t("tooltip.restoreDeal"),
          icon: <UnarchiveIcon fontSize="small" />,
          onClick: handleRestore,
        },
      ],
      [handleRestore, handleEditClick, t]
    );

  const toolbarMenuItems: ToolbarMenuItem[] = React.useMemo(
    () => [
      {
        title: t("toolbar.filter"),
        icon: <FilterListIcon fontSize="small" />,
      },
      {
        title: t("toolbar.refreshDeals"),
        tooltip: t("tooltip.refreshDeals"),
        icon: <Refresh fontSize="small" />,
        onClick: handleRefreshData,
      },
      {
        title: t("toolbar.restoreSelected"),
        tooltip: t("tooltip.restoreSelected"),
        icon: <UnarchiveIcon fontSize="small" />,
        onClickMultiple: handleRestores,
        isGroupAction: true,
      },
    ],
    [handleRestores, handleRefreshData, t]
  );

  const DealsTableHead = React.useMemo(() => makeDealsTableHead(t), [t]);

  const ToolbarComponent = ({
    selected,
    clearSelection,
  }: BaseTableToolbarProps) => (
    <BaseTableToolbar
      title={<DealViewSwitcher title={t("viewSwitcher.archivedDeals")} />}
      selected={selected}
      menuItems={toolbarMenuItems}
      clearSelection={clearSelection}
    />
  );

  return (
    <>
      <BaseTable
        initialData={deals || []}
        order={order}
        orderBy={orderBy}
        columnsConfig={buildDealTableColumns(t)}
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
          invalidateKeys={invalidateDealsQueryKeys as unknown as QueryKeyType[]}
        />
      )}
    </>
  );
}
