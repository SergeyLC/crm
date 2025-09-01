import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLazyGetDealByIdQuery,
  useUpdateDealMutation,
  DealExt,
  UpdateDealDTO,
  sanitizeDealData,
} from "@/entities/deal";

export function useDealOperations() {
  const queryClient = useQueryClient();
  const triggerGetDealById = useLazyGetDealByIdQuery();
  const updateDealMutation = useUpdateDealMutation();

  const invalidateDeals = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["deals"] });
    console.log("Invalidated deals");
  }, [queryClient]);

  const update = useCallback(
    async (id: string, updateData: (deal: DealExt) => UpdateDealDTO) => {
      const deal = await triggerGetDealById(id);
      if (!deal) {
        console.error("Deal not found for id", id);
        return;
      }

      const updatedData = updateData(deal);
      const preparedUpdate = sanitizeDealData(updatedData);
      const body: UpdateDealDTO = {
        ...preparedUpdate,
      };
      console.log("Updating deal", JSON.stringify({ id, body }));
      await updateDealMutation.mutateAsync({ id, body });
    },
    [triggerGetDealById, updateDealMutation]
  );

  const archiveDeal = useCallback(
    async (id: string) =>
      await update(id, (deal) => ({
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
        invalidateDeals();
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [archiveDeal, invalidateDeals]
  );

  const handleArchives = useCallback(
    async (e: React.MouseEvent | undefined, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids || !ids.length) return;
      try {
        await Promise.all(ids.map((id) => archiveDeal(id)));
        invalidateDeals();
      } catch (err) {
        console.error("Archive action failed", err);
      }
    },
    [invalidateDeals, archiveDeal]
  );

  const restoreDeal = useCallback(
    async (id: string) =>
      await update(id, (deal) => ({
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
        invalidateDeals();
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreDeal, invalidateDeals]
  );

  const handleRestores = useCallback(
    async (e?: React.MouseEvent, ids?: readonly string[]) => {
      e?.stopPropagation();
      if (!ids || !ids.length) return;
      try {
        await Promise.all(ids.map(async (id) => await restoreDeal(id)));
        console.log("Restored deals:", ids);
        invalidateDeals();
      } catch (err) {
        console.error("Restore action failed", err);
      }
    },
    [restoreDeal, invalidateDeals]
  );

  const handleRefreshData = useCallback(async () => {
    invalidateDeals();
  }, [invalidateDeals]);

  return {
    update,
    handleArchive,
    handleArchives,
    handleRestore,
    handleRestores,
    handleRefreshData,
    invalidateDeals,
  };
}
