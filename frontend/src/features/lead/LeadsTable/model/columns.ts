import { LeadTableRowData } from "./types";
import { Column, currencyFormatter, TGetColumns } from "@/features/base-table";
import { TFunction } from 'i18next';

// Columns definition for the Leads table.
export const buildLeadTableColumns = (t: TFunction): Column<LeadTableRowData>[] => ([
  {
    key: "title",
    label: t("lead:table.column.title"),
    padding: "none",
    minWidth: 120,
    // width: 120,
    maxWidth: 200,
  },
  {
    key: "assigneeName",
    label: t("lead:table.column.assignee"),
    minWidth: 200,
    // width: 200,
    maxWidth: 300,
  },
  {
    key: "potentialValue",
    label: t("lead:table.column.potential"),
    align: "right",
    formatter: currencyFormatter,
    minWidth: 70,
    // width: 70,
    maxWidth: 100,
  },
  {
    key: "clientName",
    label: t("lead:table.column.client"),
    minWidth: 170,
    // width: 170,
    maxWidth: 200,
  },
  {
    key: "actions",
    label: "",
    isActions: true,
    maxWidth: 42,
    width: 42,
    minWidth: 42,
    sortable: false,
    isSticky: true,
  },
]);
export const getColumns: TGetColumns<LeadTableRowData> = () => buildLeadTableColumns(((k: string) => k) as unknown as TFunction);
