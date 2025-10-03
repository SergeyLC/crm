import { Column } from "@/features/base-table";
import { UserTableRowData } from "./types";

export const userTableColumns: Column<UserTableRowData>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    minWidth: 150,
    maxWidth: 220,
    width: 150,
    align: "right",
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    minWidth: 180,
    width: 180,
    align: "right",
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    minWidth: 80,
    maxWidth: 200,
    width: 80,
    align: "right",
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    minWidth: 80,
    maxWidth: 200,
    width: 80,
    align: "right",
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    minWidth: 100,
    width: 100,
    align: "right",
  },
  {
    key: "actions",
    label: "",
    isActions: true,
    width: 30,
    maxWidth: 30,
    sortable: false,
    isSticky: true,
  },
];
