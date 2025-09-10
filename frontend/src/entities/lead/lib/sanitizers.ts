import { UpdateLeadDTO } from "../model/types";

export const sanitizeLeadData = (lead: UpdateLeadDTO) => ({
  ...lead,
  creatorId: undefined,
  contactId: undefined,
  assigneeId: undefined,
  contact: undefined,
  creator: undefined,
  assignee: undefined,
  appointments: undefined,
  notes: undefined
});
