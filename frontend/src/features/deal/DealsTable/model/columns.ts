import { DealTableRowData } from "./types";
import { currencyFormatter, stageToComponentFormatter } from "@/features/BaseTable";
import type { Column, TGetColumns } from "@/features/BaseTable";
import { TFunction } from 'i18next';

// Columns definition for the Deals table.
export const buildDealTableColumns = (t: TFunction): Column<DealTableRowData>[] => ([
  {
    key: "title",
    label: t('columns.title'),
    padding: "none",
    minWidth: 180,
    width: 180,
    maxWidth: 200,
  },
  {
    key: "clientOrganization",
    label: t('columns.organization'),
    minWidth: 100,
    width: 100,
    maxWidth: 200,
  },
  {
    key: "potentialValue",
    label: t('columns.potential'),
    align: "right",
    formatter: currencyFormatter,
    minWidth: 100,
    width: 100,
    maxWidth: 100,
  },
  {
    key: "clientName",
    label: t('columns.client'),
    minWidth: 170,
    width: 170,
    maxWidth: 200,
  },
  {
    key: "stage",
    label: t('columns.stage'),
    minWidth: 100,
    width: 100,
    maxWidth: 100,
    formatter: stageToComponentFormatter,
  },
  {
    key: "productInterest",
    label: t('columns.product'),
    minWidth: 200,
    width: 200,
    maxWidth: 300,
  },
  {
    key: "assigneeName",
    label: t('columns.assignee'),
    minWidth: 150,
    width: 150,
    maxWidth: 200,
  },
  {
    key: "actions",
    label: "",
    isActions: true,
    width: 30,
    maxWidth: 30,
    sortable: false,
    isSticky: true,
  },
]);

export const getColumns: TGetColumns<DealTableRowData> = () => buildDealTableColumns(((k: string) => k) as unknown as TFunction);
