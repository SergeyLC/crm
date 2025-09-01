import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBlockUserMutation,
  useUnblockUserMutation,
  useUpdateUserStatusMutation,
} from "@/entities/user";
import { UserStatus } from "@/entities/user/model/types";

export function useUserOperations() {
  const queryClient = useQueryClient();
  const blockUserMutation = useBlockUserMutation();
  const unblockUserMutation = useUnblockUserMutation();
  const updateUserStatusMutation = useUpdateUserStatusMutation();

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }, [queryClient]);

  const handleBlock = useCallback(
    async (e: React.MouseEvent | undefined, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await blockUserMutation.mutateAsync(id);
      } catch (err) {
        console.error("Block action failed", err);
      }
    },
    [blockUserMutation]
  );

  const handleBlocks = useCallback(
    async (e: React.MouseEvent | undefined, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids?.length) return;
      try {
        await Promise.all(ids.map(async (id) => await blockUserMutation.mutateAsync(id)));
      } catch (err) {
        console.error("Block action failed", err);
      }
    },
    [blockUserMutation]
  );

  const handleUnblock = useCallback(
    async (e: React.MouseEvent | undefined, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await unblockUserMutation.mutateAsync(id);
      } catch (err) {
        console.error("Unblock action failed", err);
      }
    },
    [unblockUserMutation]
  );

  const handleUnblocks = useCallback(
    async (e: React.MouseEvent | undefined, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids?.length) return;
      try {
        await Promise.all(
          ids.map(async (id) => await unblockUserMutation.mutateAsync(id))
        );
      } catch (err) {
        console.error("Unblock action failed", err);
      }
    },
    [unblockUserMutation]
  );

  const handleRefreshData = useCallback(async () => {
    invalidateUsers();
  }, [invalidateUsers]);

  const handleStatusChange = useCallback(
    async (e: React.MouseEvent | undefined, id: string, status: UserStatus) => {
      e?.stopPropagation();
      try {
        await updateUserStatusMutation.mutateAsync({ id, status });
      } catch (err) {
        console.error("Status change failed", err);
      }
    },
    [updateUserStatusMutation]
  );

  return {
    handleBlock,
    handleUnblock,
    handleBlocks,
    handleUnblocks,
    handleRefreshData,
    handleStatusChange,
    invalidateUsers,
  };
}
