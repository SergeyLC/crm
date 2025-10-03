import { BaseTableRowData } from "@/features/base-table";

export interface LeadTableRowData extends BaseTableRowData {
  id: string;
  title: string;
  potentialValue: number;
  creatorName: string;
  assigneeName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientOrganization: string;
  createdAt: string;
  productInterest: string;
  actions?: string;
}
