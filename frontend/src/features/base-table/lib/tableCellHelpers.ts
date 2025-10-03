import { Column, BaseTableRowData, TBaseColumnType } from "../model/types";
import { SxProps, Theme } from "@mui/material/styles";

/**
 * Creates table cell props based on column definition
 */
export const createCellProps = <T extends TBaseColumnType>(
  col: Column<T>,
  row: T,
  labelId?: string,
  colIndex?: number
) => {
  const cellProps: Record<string, unknown> = {
    align: col.align || undefined,
    width: col.width || undefined,
  };

  const cellSxProps: SxProps<Theme> = {
    width: col.width || undefined,
    minWidth: col.minWidth || undefined,
    maxWidth: col.maxWidth || undefined,
  };

  if (col.padding === "none") {
    cellProps.padding = "none";
    if (colIndex === 0) {
      cellProps.id = labelId;
      cellProps.scope = "row";
    }
  }

  // Generate cell content
  const value = col.key ? (row[col.key as keyof typeof row] as string | undefined) : undefined;
  const content = col.formatter ? col.formatter(value, row) : value;

  return { cellProps, cellSxProps, content } as {
    cellProps: Record<string, unknown>;
    cellSxProps: SxProps<Theme>;
    content: React.ReactNode;
  };
};


/**
 * Default row converter function
 */
export const defaultConvertRows = <T, TData extends BaseTableRowData>(
  data: T[]
): TData[] => {
  return data as unknown as TData[];
};
