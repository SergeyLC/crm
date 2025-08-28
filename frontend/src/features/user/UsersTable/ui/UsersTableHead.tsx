import React from "react";
import { BaseTableHeadProps, BaseTableHead } from "@/features/BaseTable";
import { userTableColumns } from "../model/columns";
import { UserTableRowData } from "../model/types";

export const UsersTableHead = <TTableData extends UserTableRowData>(
  props: BaseTableHeadProps<TTableData>
) => {
  return (
    <BaseTableHead
      {...props}
      columns={userTableColumns}
    />
  );
};