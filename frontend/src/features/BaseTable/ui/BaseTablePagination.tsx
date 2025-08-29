import React from "react";
import TablePagination from "@mui/material/TablePagination";
import { TablePaginationComponent } from "../model/types";

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
