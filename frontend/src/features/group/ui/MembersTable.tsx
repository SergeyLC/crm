"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import { Group } from "@/entities/group";
import { User } from "@/entities/user";

interface MembersTableProps {
  membersToAdd: string[];
  membersToRemove: string[];
  currentMembers: Group["members"];
  users: User[];
  watchedLeaderId: string;
  isCreateMode: boolean;
  onUndoAddMember: (userId: string) => void;
  onUndoRemoveMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  isRemovePending?: boolean;
  isAddPending?: boolean;
  isSaving?: boolean;
}

export function MembersTable({
  membersToAdd,
  membersToRemove,
  currentMembers,
  users,
  watchedLeaderId,
  isCreateMode,
  onUndoAddMember,
  onUndoRemoveMember,
  onRemoveMember,
  isRemovePending = false,
  isAddPending = false,
  isSaving = false,
}: MembersTableProps) {
  const { t } = useTranslation("group");

  // When adding members we also optimistically insert them into the group's detail cache.
  // To avoid rendering duplicates (the same user appears in `membersToAdd` and in `currentMembers`),
  // filter out current members that are already in the add-queue.
  const displayedCurrentMembers = currentMembers.filter(
    (m) => !membersToAdd.includes(m.userId)
  );

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>
              {t("table.headers.member")}
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              {t("table.headers.email")}
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              {t("table.headers.role")}
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              {t("table.headers.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Show members to be added */}
          {membersToAdd.map((userId) => {
            const user = users.find((u) => u.id === userId);
            if (!user) return null;
            return (
              <TableRow
                key={`add-${userId}`}
                sx={{ bgcolor: "success.light", opacity: 0.7 }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 18, height: 18 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                {/* <TableCell>
                  <Chip
                    label={t("status.adding")}
                    color="success"
                    size="small"
                  />
                </TableCell> */}
                <TableCell>
                  <Chip
                    label={t("roles.member")}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onUndoAddMember(userId)}
                    sx={{ color: "warning.main" }}
                    title={t("tooltips.undoAdd")}
                      disabled={isAddPending || isSaving}
                  >
                    {isAddPending ? (
                      <CircularProgress size={14} />
                    ) : (
                      <Remove fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Show current members (only in edit mode) */}
          {!isCreateMode &&
            displayedCurrentMembers.map((member) => {
              const isMarkedForRemoval = membersToRemove.includes(
                member.userId
              );
              return (
                <TableRow
                  key={`current-${member.userId}`}
                  hover
                  sx={{
                    opacity: isMarkedForRemoval ? 0.5 : 1,
                    bgcolor: isMarkedForRemoval ? "error.light" : "inherit",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ width: 18, height: 18 }}>
                        {member.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {member.user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {member.userId === watchedLeaderId ? (
                      <Chip
                        label={t("roles.leader")}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    ) : isMarkedForRemoval ? (
                      <Chip
                        label={t("status.removing")}
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={t("roles.member")}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {member.userId !== watchedLeaderId &&
                      (isMarkedForRemoval ? (
                        <IconButton
                          size="small"
                          onClick={() => onUndoRemoveMember(member.userId)}
                          sx={{ color: "warning.main" }}
                          title={t("tooltips.undoRemove")}
                          disabled={isRemovePending || isSaving || isAddPending}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => onRemoveMember(member.userId)}
                          disabled={isRemovePending || isSaving || isAddPending}
                          sx={{
                            color: "error.main",
                            "&:hover": {
                              backgroundColor: "error.light",
                              color: "error.contrastText",
                            },
                          }}
                          title={t("tooltips.markForRemoval")}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}

          {displayedCurrentMembers.length === 0 && membersToAdd.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {isCreateMode
                    ? t("messages.noMembersAdded")
                    : t("messages.noMembers")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isCreateMode
                    ? t("messages.addMembersBeforeCreate")
                    : t("messages.addMembersToWork")}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
