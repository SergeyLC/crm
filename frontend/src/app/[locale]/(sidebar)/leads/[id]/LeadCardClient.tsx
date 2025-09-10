"use client";
import { LeadCard } from "@/entities/lead/ui/LeadCard";
import { useTranslation } from "react-i18next";
import { useGetLeadByIdQuery } from "@/entities/lead";
import { LeadExt } from "@/entities/lead";

type Props = { id: string; initialLeadData?: LeadExt | null };
export default function LeadCardClient({ id, initialLeadData }: Props) {
  const skipFetch = Boolean(initialLeadData);
  const {
    data = initialLeadData,
    isLoading,
    isError,
  } = useGetLeadByIdQuery(id, !skipFetch);
  const lead = data;
  const { t } = useTranslation();
  if (isLoading && !lead) return <p>{t("app:loading")}</p>;
  if (isError)
    return <p className="text-red-500">{t("app:errorLoadingData")}</p>;
  if (!lead) return <p>{t("app:noData")}</p>;
  return <LeadCard initialLeadData={lead} />;
}
