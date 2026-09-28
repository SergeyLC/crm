/**
 * Public API of the deal feature (FSD slice).
 * Prefer named exports so unused modules (e.g. DealEditDialog) can tree-shake.
 * DealEditDialog is only loaded via dynamic() inside the tables — not re-exported here.
 */
export { DealsTable } from "./DealsTable/ui/DealsTable";
export type { DealsTableProps } from "./DealsTable/ui/DealsTable";
export { ArchivedDealsTable } from "./DealsTable/ui/ArchivedDealsTable";
export { WonLostDealsTable } from "./DealsTable/ui/WonLostDealsTable";
export type { DealTableRowData } from "./DealsTable/model/types";
export { mapDealsToDealRows } from "./DealsTable/lib/mappers";
