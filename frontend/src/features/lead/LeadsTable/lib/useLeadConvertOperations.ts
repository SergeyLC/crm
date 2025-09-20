import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadUpdate } from "./useLeadUpdate";
import { UpdateDealMutationOnSuccess } from "@/entities";

export function useLeadConvertOperations(
  onSuccess?: UpdateDealMutationOnSuccess
) {
  const { update } = useLeadUpdate({ onSuccess });
  const queryClient = useQueryClient();

  const invalidateLeads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }, [queryClient]);

  const convertLead = useCallback(
    async (id: string) =>
      await update(id, (lead) => ({
        ...lead,
        stage: "QUALIFIED",
      })),
    [update]
  );

  const handleConvert = useCallback(
    async (e: React.MouseEvent | undefined, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await convertLead(id);
        invalidateLeads();
      } catch (err) {
        console.error("Convert action failed", err);
      }
    },
    [convertLead, invalidateLeads]
  );

  const handleConverts = useCallback(
    async (e?: React.MouseEvent, selectedIds?: readonly string[]) => {
      e?.stopPropagation();
      if (!selectedIds?.length) return;
      try {
        await Promise.all(selectedIds.map(convertLead));
        invalidateLeads();
      } catch (err) {
        console.error("Convert action failed", err);
      }
    },
    [invalidateLeads, convertLead]
  );

  return { convertLead, handleConvert, handleConverts };
}