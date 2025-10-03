'use client';

import React, { useCallback } from "react";
import { TextField, Box } from "@mui/material";
import {
  CreateContactDTO,
  UpdateContactDTO,
} from "@/entities/contact/types";

type ContactFormFieldsProps = {
  contactData?: CreateContactDTO | UpdateContactDTO;
  onChange?: (form: CreateContactDTO | UpdateContactDTO) => void;
};

export const ContactFormFields: React.FC<ContactFormFieldsProps> = ({
  contactData,
  onChange
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >) => {
        onChange?.({
          ...contactData,
          [e.target.name]: e.target.value,
        });
  }, [contactData, onChange]);

  return (
    <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
      <TextField
        label="Client Name"
        name="name"
        value={contactData?.name || ""}
        onChange={handleChange}
        placeholder="Client Name"
        required
        size="small"
        fullWidth
      />
      <TextField
        label="Organization"
        name="organization"
        value={contactData?.organization || ""}
        onChange={handleChange}
        placeholder="Organization"
        size="small"
        fullWidth
      />
      <TextField
        label="Email"
        name="email"
        value={contactData?.email || ""}
        onChange={handleChange}
        placeholder="Email"
        type="email"
        size="small"
        fullWidth
      />
      <TextField
        label="Phone"
        name="phone"
        value={contactData?.phone || ""}
        onChange={handleChange}
        placeholder="Phone"
        type="tel"
        size="small"
        fullWidth
      />
    </Box>
  );
};
