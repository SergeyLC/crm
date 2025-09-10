import { formatDate } from "@/shared/lib/formatDate";
import { LeadExt } from "@/entities/lead/model/types";
import { LeadTableRowData } from "./types";

export function mapLeadsToLeadRows(leads: LeadExt[]): LeadTableRowData[] {
  return leads.map(
    (lead) =>
      ({
        id: lead.id,
        title: lead?.title,
        potentialValue: lead?.potentialValue,
        assigneeName: lead.assignee?.name,
        creatorName: lead.creator.name,
        clientName: lead.contact?.name,
        clientPhone: lead.contact?.phone,
        clientEmail: lead.contact?.email,
        createdAt: formatDate(lead.createdAt),
        productInterest: lead.productInterest,
        actions: undefined,
      }) as LeadTableRowData
  );
}
