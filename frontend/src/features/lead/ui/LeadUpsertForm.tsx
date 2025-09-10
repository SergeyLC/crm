"use client";

import {
  LeadExt,
  CreateLeadDTO,
  UpdateLeadDTO,
  useGetLeadByIdQuery,
} from "@/entities/lead";
import {
  BaseUpsertForm,
  BaseUpsertFormProps,
} from "@/features/form";
import { useTranslation } from "react-i18next";

type LeadFormProps = BaseUpsertFormProps<
  LeadExt,
  CreateLeadDTO | UpdateLeadDTO
> & {
  leadId?: string;
};

export const LeadUpsertForm: React.FC<LeadFormProps> = ({
  initialData,
  leadId,
  titleCreate = "Create Lead",
  titleUpdate = "Update Lead",
  onSubmit,
}) => {
  const { t } = useTranslation("lead");
  const skipFetch = !!initialData || (!initialData && !leadId);

  const {
    data: leadData = initialData,
    isLoading,
    isError,
  } = useGetLeadByIdQuery(leadId || "", !skipFetch);

  if (isLoading) {
    return <div>{t("card.loading")}</div>;
  }

  if (isError) {
    return <div>{t("card.error")}</div>;
  }

  return (
    <BaseUpsertForm
      initialData={leadData}
      onSubmit={onSubmit}
      titleCreate={titleCreate}
      titleUpdate={titleUpdate}
      isDeal={false}
    />
  );
};
