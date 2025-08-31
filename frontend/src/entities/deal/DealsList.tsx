"use client";

import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { DealExt } from "@/entities/deal/model/types";
import { useGetDealsQuery } from "@/entities/deal/api";
import { formatDate } from "@/shared/lib/formatDate";

export const DealsList = ({
  initialDeals,
}: {
  initialDeals: DealExt[];
}) => {
  const skipFetch = Boolean(initialDeals);
  const { t } = useTranslation('deal');
  const { data: deals = initialDeals, isFetching } = useGetDealsQuery(undefined, {
    skip: skipFetch,
  });

  useEffect(() => {
    console.log("Deals uploaded:", deals);
  }, [deals]);

  return (
    <>
  {isFetching && <p>{t('list.loading')}</p>}
      <ul className="space-y-4">
        {deals?.map((deal) => (
          <li key={deal.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="font-semibold">
              {deal.stage} - {deal.id}
            </h3>
            <div className="text-sm text-gray-600">
              <p>{t('list.creatorName')}: {deal.creator.name}</p>
              <p>{t('list.creatorEmail')}: {deal.creator.email}</p>
              <p>{t('list.status')}: {deal.status}</p>
              <p>{t('list.potentialValue')}: {deal.potentialValue}</p>
              <p>{t('list.contactName')}: {deal.contact.name}</p>
              <p>{t('list.contactEmail')}: {deal.contact.email}</p>
              <p>{t('list.contactPhone')}: {deal.contact.phone}</p>
              <ul className="mt-2">
                {deal?.notes?.map((note) => (
                  <li key={note.id} className="text-xs text-gray-500">
                    {note.content} - {formatDate(note.createdAt)}
                  </li>
                ))}
              </ul>
              <p>{t('list.createdAt')}: {formatDate(deal.createdAt)}</p>
              <p>{t('list.updatedAt')}: {formatDate(deal.updatedAt)}</p>
              <p>{t('list.assignedTo')}: {deal.assignee?.name}</p>
              <p>{t('list.contractId')}: {deal.contact.id}</p>
              <p>{t('list.productInterest')}: {deal.productInterest}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
