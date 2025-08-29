import { BaseTableRowData } from "@/features/BaseTable";

export interface DealTableRowData extends BaseTableRowData {
  id: string;
  title: string;
  stage: string;
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
