/**
 * Public API of the deal feature — active deals table only.
 * Archived / won / lost tables: import from their UI modules so they stay out of /deals first paint.
 */
export { DealsTable } from "./DealsTable/ui/DealsTable";
export type { DealsTableProps } from "./DealsTable/ui/DealsTable";
export type { DealTableRowData } from "./DealsTable/model/types";
export { mapDealsToDealRows } from "./DealsTable/lib/mappers";
