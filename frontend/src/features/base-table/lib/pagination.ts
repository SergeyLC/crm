import { Order, SortableFields, BaseTableRowData } from "../model/types";

/**
 * Calculates empty rows for pagination
 */
export const calculateEmptyRows = (
  page: number,
  rowsPerPage: number,
  totalRows: number
) => {
  return page > 0 ? Math.max(0, (1 + page) * rowsPerPage - totalRows) : 0;
};

/**
 * Creates visible rows based on sorting and pagination
 */
export const getVisibleRows = <T extends BaseTableRowData>(
  rows: T[],
  order: Order,
  orderBy: SortableFields<T>,
  page: number,
  rowsPerPage: number,
  comparatorBuilder: (
    order: Order,
    orderBy: SortableFields<T>
  ) => (a: T, b: T) => number
) => {
  return rows
    .sort(comparatorBuilder(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
};
