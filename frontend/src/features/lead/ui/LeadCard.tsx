"use client";
import React from "react";
import { LeadCardType } from "@/entities/lead/model/types";
import { formatDate } from "@/shared/lib/formatDate";

type LeadCardProps = {
  initialData: LeadCardType;
  onOpenLeadForm?: (leadId: string) => void;
};
const normalizeLeadCard = (data: LeadCardType) => ({
  id: data.id,
  stage: data.stage || "LEAD",
  status: data.status || "ACTIVE",
  productInterest: data.productInterest,
  potentialValue: data.potentialValue || null,
  createdAt: data.createdAt,
});

export const LeadCard: React.FC<LeadCardProps> = ({
  initialData,
  onOpenLeadForm,
}) => {
  const leadData = normalizeLeadCard(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onOpenLeadForm?.(leadData.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="p-4 border rounded-lg shadow-sm">
        <h3 className="font-semibold">
          {leadData.stage} - {leadData.id}
        </h3>
        <div className="text-sm text-gray-600">
          <p>Stage: {leadData.stage}</p>
          <p>Status: {leadData.status}</p>
          <p>Product Interest: {leadData.productInterest}</p>
          <p>Potential Value: {leadData.potentialValue}</p>
          <p>Created at: {formatDate(leadData.createdAt)}</p>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Edit Lead
        </button>
      </div>
    </form>
  );
};
