import { useCallback } from "react";
import {
  useUpdateLeadMutation,
  useLazyGetLeadByIdQuery,
  UpdateLeadDTO,
  LeadExt,
  sanitizeLeadData,
} from "@/entities/lead";
import { UpdateDealMutationOptions } from "@/entities";

export function useLeadUpdate(options?: UpdateDealMutationOptions) {
const { onSuccess } = options || {};
  const triggerGetLeadById = useLazyGetLeadByIdQuery();
  const updateLeadMutation = useUpdateLeadMutation({ onSuccess });

  const update = useCallback(
    async (id: string, updateData: (lead: LeadExt) => UpdateLeadDTO) => {
      const lead = await triggerGetLeadById(id);
      if (!lead) {
        console.error("Lead not found for id", id);
        return;
      }

      const updatedData = updateData(lead);
      const preparedUpdate = sanitizeLeadData(updatedData);
      const body: UpdateLeadDTO = {
        ...preparedUpdate,
      };
      console.log("Updating lead with id:", id, " body:", body);
      await updateLeadMutation.mutateAsync({ id, body });
    },
    [triggerGetLeadById, updateLeadMutation]
  );

  return { update };
}