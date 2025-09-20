import { useCallback } from "react";
import { useDealUpdate } from "./useDealUpdate";
import { DealExt, UpdateDealMutationOnSuccess } from "@/entities/deal";

export function useDealRestoreOperations(onSuccess?: UpdateDealMutationOnSuccess) {
  const { update } = useDealUpdate({ onSuccess });

  const restoreDeal = useCallback(
    async (id: string) =>
      await update(id, (deal: DealExt) => ({
        ...deal,
        status: "ACTIVE",
      })),
    [update]
  );

  const handleRestore = useCallback(
    async (e?: React.MouseEvent, id?: string) => {
      e?.stopPropagation();
      if (!id) return;
      try {
        await restoreDeal(id);
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreDeal]
  );

  const handleRestores = useCallback(
    async (e?: React.MouseEvent, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids || !ids.length) return;
      try {
        await Promise.all(ids.map(async (id) => await restoreDeal(id)));
        console.log("Restored deals:", ids);
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreDeal]
  );

  return { restoreDeal, handleRestore, handleRestores };
}