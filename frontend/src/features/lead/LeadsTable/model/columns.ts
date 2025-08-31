import { LeadTableRowData } from "./types";
import { Column, currencyFormatter } from "@/features/BaseTable";

// Columns definition for the Leads table.
export const leadTableColumns: Column<LeadTableRowData>[] = [
  {
    key: "title",
    label: "Title",
    padding: "none",
    minWidth: 120,
    width: 120,
    maxWidth: 200,
  },
  {
    key: "assigneeName",
    label: "Assignee",
    minWidth: 200,
    width: 200,
    maxWidth: 300,
  },
  {
    key: "potentialValue",
    label: "Potential",
    align: "right",
    formatter: currencyFormatter,
    minWidth: 70,
    width: 70,
    maxWidth: 100,
  },
  {
    key: "clientName",
    label: "Client",
    minWidth: 170,
    width: 170,
    maxWidth: 200,
  },
  {
    key: "actions",
    label: "",
    isActions: true,
    maxWidth: 20,
    width: 20,
    minWidth: 20,
    sortable: false,
    isSticky: true,
  },
];
