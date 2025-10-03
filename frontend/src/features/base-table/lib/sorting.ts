import { SortableFields, BaseTableRowData } from "../model/types";
/**
 * Creates a comparator for sorting table data
 */
export function createComparator<
  TOrder extends string,
  TData extends BaseTableRowData,
>(order: TOrder, orderBy: SortableFields<TData>) {
  return (a: TData, b: TData) => {
    // Handle null values
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (aValue === null || aValue === undefined)
      return order === "asc" ? -1 : 1;
    if (bValue === null || bValue === undefined)
      return order === "asc" ? 1 : -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    return order === "asc"
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  };
}