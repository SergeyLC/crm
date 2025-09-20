import { useCallback } from "react";
import { useDealUpdate } from "./useDealUpdate";
import { DealExt, UpdateDealMutationOnSuccess } from "@/entities/deal";

export function useDealArchiveOperations(onSuccess?: UpdateDealMutationOnSuccess) {
  const { update } = useDealUpdate({ onSuccess });

  const archiveDeal = useCallback(
    async (id: string) =>
      await update(id, (deal: DealExt) => ({
        ...deal,
        status: "ARCHIVED",
      })),
    [update]
  );

  const handleArchive = useCallback(
    async (e: React.MouseEvent | undefined, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await archiveDeal(id);
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [archiveDeal]
  );

  const handleArchives = useCallback(
    async (e: React.MouseEvent | undefined, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids || !ids.length) return;
      try {
        await Promise.all(ids.map((id) => archiveDeal(id)));
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [archiveDeal]
  );

  return { archiveDeal, handleArchive, handleArchives };
}