import React from "react";
import TablePagination from "@mui/material/TablePagination";
import { TablePaginationComponent } from "../model/types"; 

interface BaseTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
}

export const BaseTablePagination: TablePaginationComponent = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [2, 10, 25, 50],
}) => (
  <TablePagination
    rowsPerPageOptions={rowsPerPageOptions}
    component="div"
    count={count}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={onPageChange}
    onRowsPerPageChange={onRowsPerPageChange}
  />
);
