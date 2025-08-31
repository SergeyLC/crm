"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { TextField, Button, Stack } from "@mui/material";
import { LeadExt, CreateLeadDTO, UpdateLeadDTO } from "@/entities/lead/types";
import { useGetLeadByIdQuery } from "@/entities/lead/api";

type LeadFormProps = {
  initialData?: LeadExt;
  leadId?: string;
  onSubmit?: (form: CreateLeadDTO | UpdateLeadDTO) => void;
};

export const LeadFormFields: React.FC<LeadFormProps> = ({
  initialData,
  leadId,
  onSubmit,
}) => {
  const { t } = useTranslation('lead');
  const skipFetch = Boolean(initialData);

  const { data: leadData = initialData } = useGetLeadByIdQuery(leadId || "", {
    skip: skipFetch,
  });

  const [form, setForm] = useState<CreateLeadDTO | UpdateLeadDTO>(
    leadData as CreateLeadDTO | UpdateLeadDTO
  );

  useEffect(() => {
    onSubmit?.(form);
  }, [form, onSubmit]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Stack spacing={2}>
      <TextField
        label={t('lead:form.productInterest')}
        name="productInterest"
        value={form.productInterest || ''}
        onChange={handleChange}
        placeholder={t('lead:form.productInterest')}
      />
      <TextField
        label={t('lead:form.potentialValue')}
        name="potentialValue"
        value={form.potentialValue || undefined}
        onChange={handleChange}
        placeholder={t('lead:form.potentialValue')}
      />
      <Button variant="contained" type="submit">
        {initialData ? t('lead:form.update') : t('lead:form.create')}
      </Button>
    </Stack>
  );
};
