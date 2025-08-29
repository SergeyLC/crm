"use client";

import { useCallback } from "react";

import * as React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import { SxProps, Theme } from "@mui/material/styles";

import {
  BaseTableRowData,
  Order,
  SortableFields,
  getComparator,
  BaseTableHead,
  defaultConvertSrcDataToDataRows,
  BaseTableToolbarProps,
} from "../index";
import defaultColumnsConfig from "../model/columns";
import {
  BaseTableHeadProps,
  Column,
  TablePaginationComponent,
} from "../model/types";
import { BaseTablePagination } from "./BaseTablePagination";
import TableRow from "@mui/material/TableRow";
import { TConvertSrcDataToDataRows } from "../lib/formatters";
import { useSelection } from "../hooks/useSelection";
import { ActionCell } from "./ActionCell";
import { ActionMenu, ActionMenuItemProps, ActionMenuProps } from "./ActionMenu";

// Import helper functions from lib.ts
import {
  createStickySx,
  createTableSx,
  calculateEmptyRows,
  getVisibleRows,
  createCellProps,
} from "../lib";

export interface BaseTableProps<T, TTableData extends BaseTableRowData> {
  columnsConfig?: Column<TTableData>[];
  initialData?: T[];
  order?: Order;
  orderBy?: SortableFields<TTableData>;
  getInitData?: () => T[];
  TableHeadComponent?: React.FC<BaseTableHeadProps<TTableData>>;
  TableToolbarComponent?: React.FC<BaseTableToolbarProps>;
  TablePaginationComponent?: TablePaginationComponent;
  toolbarTitle?: string | React.ReactElement;
  rowActionMenuComponent?: React.FC<ActionMenuProps<TTableData>>;
  rowMapper?: TConvertSrcDataToDataRows<T, TTableData>;
  rowActionMenuItems?: ActionMenuItemProps<TTableData>[];
  comparatorBuilder?: (
    order: Order,
    orderBy: SortableFields<TTableData>
  ) => (a: TTableData, b: TTableData) => number;
  onRowDoubleClick?: (e: React.MouseEvent, id: string) => void;
  sx?: SxProps<Theme>;
  rowActionMenuItemsCreator?: (row: TTableData) => ActionMenuItemProps<TTableData>[];
}

export function BaseTable<T, TTableData extends BaseTableRowData>({
  initialData,
  order: defaultOrder = "asc",
  orderBy: defaultOrderBy = "createdAt" as SortableFields<TTableData>,
  getInitData,
  TableHeadComponent = BaseTableHead,
  TableToolbarComponent,
  TablePaginationComponent = BaseTablePagination,
  toolbarTitle,
  comparatorBuilder = getComparator<Order, TTableData>,
  columnsConfig: columnsConfigProp,
  rowMapper: rowConverter = defaultConvertSrcDataToDataRows<T, TTableData>,
  rowActionMenuComponent = ActionMenu,
  rowActionMenuItems,
  onRowDoubleClick,
  sx = {},
  rowActionMenuItemsCreator: createRowActionMenuItems

}: BaseTableProps<T, TTableData> & { columnsConfig?: Column<TTableData>[] }) {

  const columnsConfig: Column<TTableData>[] =
    (columnsConfigProp as Column<TTableData>[]) || defaultColumnsConfig;

  const data = React.useMemo(() => initialData || (getInitData ? getInitData() : []), [initialData, getInitData]);
  // Initialize rows state with initial data, then update with data from query
  const [rows, setRows] = React.useState<TTableData[]>(() =>
    rowConverter?.((data as T[]) || [])
  );

  const [order, setOrder] = React.useState<Order>(defaultOrder);
  const [orderBy, setOrderBy] =
    React.useState<SortableFields<TTableData>>(defaultOrderBy);
  const { selected, isSelected, handleClick, handleSelectAll, clearSelection } = useSelection();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  // Update rows when data changes
  React.useEffect(() => {
  // Debug: log when data reference changes to help diagnose update loops.
  // Remove or guard these logs in production.
  // eslint-disable-next-line no-console
  console.debug('[BaseTable] data changed, length=', Array.isArray(data) ? data.length : 'n/a');
  setRows(rowConverter?.((data ?? [] as T[]) || []));
  }, [data, rowConverter]);

  const handleRequestSort = useCallback(
    (_: React.MouseEvent<unknown>, property: keyof TTableData) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property as SortableFields<TTableData>);
    },
    [orderBy, order]
  );

  const handleSelectAllClick = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleSelectAll(event.target.checked, rows);
    },
    [handleSelectAll, rows]
  );

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  // Use helper function for empty rows
  const emptyRows = calculateEmptyRows(page, rowsPerPage, rows.length);

  // Use helper function for visible rows
  const visibleRows = React.useMemo(
    () =>
      getVisibleRows(
        rows,
        order,
        orderBy,
        page,
        rowsPerPage,
        comparatorBuilder
      ),
    [order, orderBy, page, rowsPerPage, rows, comparatorBuilder]
  );

  const handleRowDoubleClick = useCallback(
    (e: React.MouseEvent, id: string) => onRowDoubleClick?.(e, id),
    [onRowDoubleClick]
  );

  // Use helper function for sticky styles
  const stickySx = React.useMemo(() => createStickySx(), []);

  // Use helper function for table styles
  const tableSx = React.useMemo(() => createTableSx(), []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <Paper
        sx={{
          width: "100%",
          mb: 2,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {TableToolbarComponent && (
          <TableToolbarComponent
            selected={selected}
            title={toolbarTitle}
            clearSelection={clearSelection}
          />
        )}
        <TableContainer
          sx={{
            overflowX: "auto",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Table sx={tableSx} aria-labelledby="tableTitle" size="small">
            {TableHeadComponent && (
              <TableHeadComponent
                numSelected={selected.length}
                order={order}
                orderBy={orderBy as string}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
                columns={columnsConfig}
                
              />
            )}
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    onDoubleClick={(event) =>
                      handleRowDoubleClick(event, row.id)
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell
                      padding="checkbox"
                      sx={{
                        ...stickySx,
                        left: 0,
                        textOverflow: "clip",
                        boxSizing: "content-box", // Ensures checkbox does not affect width calculation
                      }}
                    >
                      <Checkbox
                        onClick={(event) => handleClick(event, row.id)}
                        color="primary"
                        checked={isItemSelected}
                        slotProps={{ input: { "aria-labelledby": labelId } }}
                      />
                    </TableCell>
                    {columnsConfig.map((col: Column<TTableData>, colIndex: number) => {
                      // Use helper function to create cell props
                      const { cellProps, cellSxProps, content } =
                        createCellProps(col, row, labelId, colIndex);

                      if (col.isActions) {
                        return (
                          <ActionCell
                            key={`col-${colIndex}`}
                            id={row.id}
                            MenuComponent={rowActionMenuComponent || null}
                            menuItems={
                              rowActionMenuItems || createRowActionMenuItems?.(row)
                            }
                            cellSx={Object.assign(
                              {},
                              stickySx,
                              cellSxProps,
                              {
                                right: 0,
                                textOverflow: "clip",
                                boxSizing: "content-box", // Ensures checkbox does not affect width calculation
                              }
                            )}
                          />
                        );
                      }

                      return (
                        <TableCell
                          key={`col-${colIndex}`}
                          sx={cellSxProps}
                          {...cellProps}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 20 * emptyRows,
                  }}
                >
                  <TableCell colSpan={columnsConfig.length + 1} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePaginationComponent
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
