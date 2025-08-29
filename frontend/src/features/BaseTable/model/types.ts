import React from "react";
export type Order = "asc" | "desc";

//  Exclude field actions from the possible keys for sorting
export type SortableFields<T> = keyof T;

export type TBaseColumnType = { id: string }

type Formatter<T extends TBaseColumnType> = (value: string | undefined, row: T) => React.ReactNode;

export type Column<T extends TBaseColumnType> = {
  key?: keyof T;
  label: string;
  align?: "left" | "right" | "center";
  padding?: "normal" | "checkbox" | "none";
  /**
   * Optional function to format the cell value for display.
   * Receives the cell value and the entire row object as arguments.
   * Should return a React node to be rendered in the cell.
   */
  formatter?: Formatter<T>;
  isActions?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  isSticky?: boolean;
};

export type TGetColumns<T extends TBaseColumnType> = () => Column<T>[];

export interface BaseTableHeadProps<T extends TBaseColumnType> {
  columns?: Column<T>[];
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof T) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

export type TablePaginationComponentProps = {
  count: number;
  rowsPerPage: number;
  page: number;
  rowsPerPageOptions?: (
    | number
    | {
        value: number;
        label: string;
      }
  )[];
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export type TablePaginationComponent =
  React.ComponentType<TablePaginationComponentProps>;

export type TEditDialogComponent = React.ComponentType<{
  id?: string;
  titleEdit?: string;
  titleCreate?: string;
  open?: boolean;
  onClose?: () => void;
}>;

export interface BaseTableRowData {
  id: string;
  actions?: string;
}
