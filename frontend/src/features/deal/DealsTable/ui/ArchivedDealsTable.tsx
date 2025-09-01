"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

import EditIcon from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import UnarchiveIcon from "@mui/icons-material/Unarchive";

import { DealExt, DealViewSwitcher, useGetArchivedDealsQuery } from "@/entities/deal";
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
import { mapDealsToDealRows, useTableActions, useDealOperations } from "../lib";

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

  const { handleRestore, handleRestores, handleRefreshData } =
    useDealOperations();

  const {} = useTableActions();

  // fetch deals
  const { data: deals = initialData || [], refetch } = useGetArchivedDealsQuery();

  // Refetch data when component mounts to ensure fresh data
  React.useEffect(() => {
    refetch();
  }, [refetch]);

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
        initialData={deals ?? initialData}
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
        />
      )}
    </>
  );
}
