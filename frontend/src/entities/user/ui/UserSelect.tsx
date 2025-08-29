import React from "react";
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { useGetUsersQuery } from "@/entities/user";
import type { UserExt } from "@/entities/user/model/types";

interface UserSelectProps {
  value: string | null;
  onChange: (userId: string) => void;
  users?: UserExt[];
  label?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  users,
  label = "User",
}) => {
  // If users is not provided, we load it via RTK Query
  const { data, isLoading, isError } = useGetUsersQuery(undefined, {
    skip: !!users,
  });

  const userList = users ?? data ?? [];
  const isValidValue = userList.some((user) => user.id === value);

  return (
    <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={isValidValue ? value : ""}
        label={label}
        onChange={(e) => onChange(e.target.value || "")}
        size="small"
        sx={{ height: 40, padding: "0 8px" }}
        disabled={isLoading || isError}
      >
        {isLoading ? (
          <MenuItem value="">
            <CircularProgress size={20} />
          </MenuItem>
        ) : userList.length === 0 ? (
          <MenuItem value="" disabled>
            {isError ? "Failed to load" : "No users found"}
          </MenuItem>
        ) : (
          userList.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};