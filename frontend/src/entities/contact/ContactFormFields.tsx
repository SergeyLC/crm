'use client';

import React, { useEffect, useState, useCallback } from "react";
import { TextField, Box } from "@mui/material";
import {
  CreateContactDTO,
  UpdateContactDTO,
} from "@/entities/contact/types";
import { useGetContactByIdQuery } from "@/entities/contact/api";


type ContactFormFieldsProps = {
  initialData?: CreateContactDTO | UpdateContactDTO;
  contactId?: string;
  onChange?: (form: CreateContactDTO | UpdateContactDTO) => void;
};

export const ContactFormFields: React.FC<ContactFormFieldsProps> = ({
  initialData,
  contactId,
  onChange,
}) => {
  // Skip the initial fetch if we already have data from SSR
  const skipFetch = !!initialData || !initialData && !contactId;

  const {
    data: contactData = initialData,
  } = useGetContactByIdQuery(contactId || "", {
    skip: skipFetch,
  });

  // Initialize form state with normalized data
  const [form, setForm] = useState<CreateContactDTO | UpdateContactDTO>(
    contactData as (CreateContactDTO | UpdateContactDTO)
  );

  useEffect(() => {
    onChange?.(form);    
  }, [form]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >) => {
      setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  return (
    <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
      <TextField
        label="Client Name"
        name="name"
        value={form?.name || ""}
        onChange={handleChange}
        placeholder="Client Name"
        required
        size="small"
        fullWidth
      />
      <TextField
        label="Organization"
        name="organization"
        value={form?.organization || ""}
        onChange={handleChange}
        placeholder="Organization"
        size="small"
        fullWidth
      />
      <TextField
        label="Email"
        name="email"
        value={form?.email || ""}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        size="small"
        fullWidth
      />
      <TextField
        label="Phone"
        name="phone"
        value={form?.phone || ""}
        onChange={handleChange}
        placeholder="Phone"
        type="tel"
        size="small"
        fullWidth
      />
    </Box>
  );
};
