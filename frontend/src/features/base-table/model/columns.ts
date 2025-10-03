import type { Column, BaseTableRowData } from "./types";

// Default columns for the table. This can be imported by BaseTable or overridden by callers.
export const baseTableColumns: Column<BaseTableRowData>[] = [
  { label: "", isActions: true, maxWidth: 30 },
];

export default baseTableColumns;
