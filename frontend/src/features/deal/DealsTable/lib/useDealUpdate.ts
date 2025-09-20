import { useCallback } from "react";
import {
  useLazyGetDealByIdQuery,
  useUpdateDealMutation,
  DealExt,
  UpdateDealDTO,
  sanitizeDealData,
  UpdateDealMutationOptions,
} from "@/entities/deal";

export function useDealUpdate(options?: UpdateDealMutationOptions) {
  const { onSuccess } = options || {};
  const triggerGetDealById = useLazyGetDealByIdQuery();
  const updateDealMutation = useUpdateDealMutation({ onSuccess });

  const update = useCallback(
    async (id: string, updateData: (deal: DealExt) => UpdateDealDTO) => {
      const deal = await triggerGetDealById(id);
      if (!deal) {
        console.error("Deal not found for id", id);
        return;
      }
      const updatedData = updateData(deal);
      const preparedUpdate = sanitizeDealData(updatedData);
      const body: UpdateDealDTO = { ...preparedUpdate };
      await updateDealMutation.mutateAsync({ id, body });
    },
    [triggerGetDealById, updateDealMutation]
  );

  return { update };
}