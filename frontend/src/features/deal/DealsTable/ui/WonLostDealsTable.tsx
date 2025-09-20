"use client";
import React, { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

import EditIcon from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  DealActiveQueryKey,
  DealExt,
  DealLostQueryKey,
  DealViewSwitcher,
  DealWonQueryKey,
  useGetLostDealsQuery,
  useGetWonDealsQuery,
} from "@/entities/deal";

import { QueryKeyType, useInvalidateQueries } from "@/shared";

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
import { mapDealsToDealRows } from "../lib";

const makeTableHead = (t: TFunction) => {
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

const invalidateDealsQueryKeys = [
  DealActiveQueryKey,
  DealWonQueryKey,
  DealLostQueryKey,
];

const EditDialog = dynamic(
  () =>
    import("@/features/deal/DealEditDialog").then((mod) => mod.DealEditDialog),
  { ssr: false }
);

export type WonLostDealsTableProps<T extends DealExt> = BaseTableProps<
  T,
  DealTableRowData
> & {
  isWon?: boolean;
};

export function WonLostDealsTable<T extends DealExt>({
  initialData,
  order,
  orderBy = "modupdatedAt" as SortableFields<DealTableRowData>,
  isWon = true,
  sx,
}: WonLostDealsTableProps<T>) {
  const { t } = useTranslation("deal");
  const {
    entityId: clickedId,
    handleEditClick,
    handleDialogClose,
    showDialog,
  } = useEntityDialog();

  const invalidateDeals = useInvalidateQueries();

  const wasInitialDataUsed = React.useRef(false);

  React.useEffect(() => {
    if (!wasInitialDataUsed.current && initialData) {
      wasInitialDataUsed.current = true;
    }
  }, [initialData]);

  const {
    useQuery: { data: wonDeals = [] },
    queryKey: queryKeyWon,
  } = useGetWonDealsQuery(undefined, {
    enabled: isWon,
    placeholderData:
      isWon && !wasInitialDataUsed.current ? initialData : undefined,
  });

  const {
    useQuery: { data: lostDeals = [] },
    queryKey: queryKeyLost,
  } = useGetLostDealsQuery(undefined, {
    enabled: !isWon,
    placeholderData:
      !isWon && !wasInitialDataUsed.current ? initialData : undefined,
  });

  const deals = isWon ? wonDeals : lostDeals;
  const queryKey = isWon ? queryKeyWon : queryKeyLost;

  const handleRefreshData = useCallback(async () => {
    invalidateDeals([queryKey as QueryKeyType]);
  }, [invalidateDeals, queryKey]);

  const TableHead = React.useMemo(() => makeTableHead(t), [t]);

  const rowActionMenuItems: ActionMenuItemProps<DealTableRowData>[] =
    React.useMemo(
      () => [
        {
          title: t("action.view"),
          icon: <EditIcon fontSize="small" />,
          onClick: handleEditClick,
        },
      ],
      [handleEditClick, t]
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
    ],
    [handleRefreshData, t]
  );

  const switcherTitle = useMemo(
    () => (isWon ? t("viewSwitcher.wonDeals") : t("viewSwitcher.lostDeals")),
    [isWon, t]
  );

  // Memoize the ToolbarComponent so its identity is stable when passed to BaseTable.
  const ToolbarComponent = React.useCallback(
    ({ selected, clearSelection }: BaseTableToolbarProps) => (
      <BaseTableToolbar
        title={<DealViewSwitcher title={switcherTitle} />}
        selected={selected}
        menuItems={toolbarMenuItems}
        clearSelection={clearSelection}
      />
    ),
    [switcherTitle, toolbarMenuItems]
  );

  return (
    <>
      <BaseTable
        initialData={deals}
        order={order}
        orderBy={orderBy}
        columnsConfig={buildDealTableColumns(t)}
        TableToolbarComponent={ToolbarComponent}
        TableHeadComponent={TableHead}
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
