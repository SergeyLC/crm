'use client';

import React, { useCallback, useState } from "react";
import { TextField, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("form");
  const requiredMessage = t("clientNameRequired");
  const [nameError, setNameError] = useState<string>("");

  const isValidityTarget = useCallback(
    (value: unknown): value is HTMLInputElement =>
      typeof value === "object" &&
      value !== null &&
      "setCustomValidity" in value &&
      typeof (value as HTMLInputElement).setCustomValidity === "function",
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >) => {
        setNameError("");
        onChange?.({
          ...contactData,
          [e.target.name]: e.target.value,
        });
  }, [contactData, onChange]);

  const handleNameInvalid = useCallback<
    React.FormEventHandler<HTMLInputElement>
  >(
    (event) => {
      event.preventDefault();
      const target = event.target;
      if (isValidityTarget(target)) {
        target.setCustomValidity(requiredMessage);
      }
      setNameError(requiredMessage);
    },
    [isValidityTarget, requiredMessage]
  );

  const handleNameInput = useCallback<
    React.FormEventHandler<HTMLInputElement>
  >((event) => {
    const target = event.target;
    if (isValidityTarget(target)) {
      target.setCustomValidity("");
    }
    setNameError("");
  }, [isValidityTarget]);

  return (
    <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
      <TextField
        label={t("clientNameLabel")}
        name="name"
        value={contactData?.name || ""}
        onChange={handleChange}
        placeholder={t("clientNamePlaceholder")}
        required
        size="small"
        fullWidth
        slotProps={{
          input: {
            onInvalid: handleNameInvalid,
            onInput: handleNameInput,
          },
          htmlInput: {
            "data-testid": "name-input"
          }
        }}
        error={Boolean(nameError)}
        helperText={nameError || undefined}
      />
      {/* <FormHelperText id="username-helper">
        must be more than 5 characters
      </FormHelperText> */}
      <TextField
        label="Organization"
        name="organization"
        value={contactData?.organization || ""}
        onChange={handleChange}
        placeholder="Organization"
        size="small"
        fullWidth
        data-testid="organization-input"
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
        data-testid="email-input"
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
        data-testid="phone-input"
      />
    </Box>
  );
};
