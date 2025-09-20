import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadUpdate } from "./useLeadUpdate";
import { UpdateDealMutationOnSuccess } from "@/entities";

export function useLeadArchiveOperations(
  onSuccess?: UpdateDealMutationOnSuccess
) {
  const { update } = useLeadUpdate({ onSuccess });
  const queryClient = useQueryClient();

  const invalidateLeads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }, [queryClient]);

  const archiveLead = useCallback(
    async (id: string) =>
      await update(id, (lead) => ({
        ...lead,
        archivedAt: new Date(),
        status: "ARCHIVED",
      })),
    [update]
  );

  const handleArchive = useCallback(
    async (e?: React.MouseEvent, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await archiveLead(id);
        invalidateLeads();
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [archiveLead, invalidateLeads]
  );

  const handleArchives = useCallback(
    async (e?: React.MouseEvent, selectedIds?: readonly string[]) => {
      e?.stopPropagation();
      console.log("Selected ids for archive:", selectedIds);
      if (!selectedIds?.length) return;
      try {
        await Promise.all(selectedIds.map(archiveLead));
        invalidateLeads();
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [archiveLead, invalidateLeads]
  );

  return { archiveLead, handleArchive, handleArchives };
}