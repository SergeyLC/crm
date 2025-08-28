import { Column } from "@/features/BaseTable";
import { UserTableRowData } from "./types";

export const userTableColumns: Column<UserTableRowData>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    minWidth: 150,
    align: "right",
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    minWidth: 200,
    align: "right",
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    minWidth: 100,
    align: "right",
    // formatter: (value: string) => {
    //   return (
    //     <Chip
    //       label={value === "ADMIN" ? "Admin" : "Employee"}
    //       color={value === "ADMIN" ? "primary" : "default"}
    //       size="small"
    //     />
    //   );
    // },
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    minWidth: 120,
    align: "right",
    // formatter: (value: string) => {
    //   return (
    //     <Chip
    //       label={value === "ACTIVE" ? "Active" : "Blocked"}
    //       color={value === "ACTIVE" ? "success" : "error"}
    //       size="small"
    //     />
    //   );
    // },
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    minWidth: 120,
    align: "right",
    // formatter: dateFormatter,
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
