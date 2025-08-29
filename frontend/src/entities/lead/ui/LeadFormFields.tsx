import React, { useState, useEffect } from "react";
import { TextField, Button, Stack } from "@mui/material";
import {
  LeadExt,
  CreateLeadDTO,
  UpdateLeadDTO,
} from "@/entities/lead/types";
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
  const skipFetch = Boolean(initialData);

  const {
    data: leadData = initialData,
  } = useGetLeadByIdQuery(leadId || "", {
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
        label="Product"
        name="productInterest"
        value={form.productInterest || ""}
        onChange={handleChange}
        placeholder="productInterest"
      />
      <TextField
        label="Wert"
        name="potentialValue"
        value={form.potentialValue || undefined}
        onChange={handleChange}
        placeholder="Wert"
      />
      <Button variant="contained" type="submit">
        {initialData ? "Update" : "Create"}
      </Button>
    </Stack>
  );
};
