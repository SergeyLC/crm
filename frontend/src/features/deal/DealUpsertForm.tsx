"use client";

import { DealExt, CreateDealDTO, UpdateDealDTO } from "@/entities/deal/model/types";
import { useGetDealByIdQuery } from "@/entities/deal/api-tanstack";
import { BaseUpsertForm, BaseUpsertFormProps } from "@/features/entityUpsert";
import { useTranslation } from 'react-i18next';

type DealFormProps = BaseUpsertFormProps<
  DealExt,
  CreateDealDTO | UpdateDealDTO
> & {
  dealId?: string;
};

export const DealUpsertForm: React.FC<DealFormProps> = ({
  initialData,
  dealId,
  // titleCreate = "Create Deal",
  // titleUpdate = "Update Deal",
  onSubmit,
}) => {
  const {
    data: dealData = initialData,
    isLoading,
    isError,
  } = useGetDealByIdQuery(dealId || "");

  const { t } = useTranslation('deal');

  if (isLoading) return <div>{t('dialog.loading')}</div>;
  if (isError) return <div>{t('dialog.errorLoad')}</div>;

  return (
    <BaseUpsertForm
      initialData={dealData}
      onSubmit={onSubmit}
  titleCreate={t('dialog.create')}
  titleUpdate={t('dialog.update')}
      isDeal={true}
    />
  );
};
