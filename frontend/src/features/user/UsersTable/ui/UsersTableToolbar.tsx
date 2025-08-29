import React from "react";
import { BaseTableToolbar } from "@/features/BaseTable";

export interface UsersTableToolbarProps {
  title: React.ReactNode | string;
  selected: readonly string[];
}

export const UsersTableToolbar: React.FC<UsersTableToolbarProps> = ({
  title,
  selected,
}) => {
  return (
    <BaseTableToolbar
      title={title}
      selected={selected}
      // onCreateClick={onCreateClick}
      // onRefreshClick={onRefreshClick}
      // onDeleteClick={onDeleteClick}
    />
  );
};
