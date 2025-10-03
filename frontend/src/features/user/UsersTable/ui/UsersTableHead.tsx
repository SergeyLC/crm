"use client";
import React from "react";
import { BaseTableHeadProps, BaseTableHead } from "@/features/base-table";
import { userTableColumns } from "../model/columns";
import { UserTableRowData } from "../model/types";
import { useTranslation } from "react-i18next";

export const UsersTableHead = <TTableData extends UserTableRowData>(
  props: BaseTableHeadProps<TTableData>
) => {
  const { t } = useTranslation("user");

  const localizedColumns = React.useMemo(
    () =>
      userTableColumns.map((column) => ({
        ...column,
        label: t(`table.column.${column.key}`),
      })),
    [t]
  );

  return <BaseTableHead {...props} columns={localizedColumns} />;
};