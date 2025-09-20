import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadUpdate } from "./useLeadUpdate";
import { UpdateDealMutationOnSuccess } from "@/entities";

export function useLeadRestoreOperations(onSuccess?: UpdateDealMutationOnSuccess) {
  const { update } = useLeadUpdate({ onSuccess });
  const queryClient = useQueryClient();

  const invalidateLeads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }, [queryClient]);

  const restoreLead = useCallback(async (id: string) =>
    await update(id, (lead) => ({
      ...lead,
      archivedAt: null,
      status: "ACTIVE",
    })), [update]);

  const handleRestore = useCallback(
    async (e?: React.MouseEvent, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await restoreLead(id);
        invalidateLeads();
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreLead, invalidateLeads]
  );

  const handleRestores = useCallback(
    async (e?: React.MouseEvent, selectedIds?: readonly string[]) => {
      e?.stopPropagation();
      console.log("Selected ids for restore:", selectedIds);
      if (!selectedIds?.length) return;
      try {
        await Promise.all(selectedIds.map(restoreLead));
        invalidateLeads();
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreLead, invalidateLeads]
  );

  return { restoreLead, handleRestore, handleRestores };
}