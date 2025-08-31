import { LeadExt } from '@/entities/lead/types';
import { ssrFetch } from '@/shared/api/ssrFetch';
import LeadCardClient from './LeadCardClient';

export default async function LeadCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leadData = await ssrFetch<LeadExt>(`leads/${id}`);
  return <LeadCardClient id={id} initialLeadData={leadData} />;
}
