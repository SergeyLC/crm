import { NEXT_PUBLIC_BACKEND_API_URL } from "@/shared/config/urls";
import { LeadExt } from "@/entities/lead/types";
import LeadCardClient from "./LeadCardClient";

export interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadCardPage({ params }: PageProps) {
  const { id } = await params;
  let leadData: LeadExt | null = null;
  try {
    const res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/api/leads/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      leadData = await res.json();
    }
  } catch (err) {
    console.error("Server fetch error:", err);
  }

  return <LeadCardClient id={id} initialLeadData={leadData} />;
}
