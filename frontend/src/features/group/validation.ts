import * as yup from 'yup';

// Validation schema for group forms
export const groupSchema = yup.object().shape({
  name: yup
    .string()
    .required('validation.nameRequired')
    .min(2, 'validation.nameMinLength')
    .max(100, 'validation.nameMaxLength')
    .trim(),
  leaderId: yup
    .string()
    .required('validation.leaderRequired'),
});

// Infer the form data type from the schema
export type GroupFormData = yup.InferType<typeof groupSchema>;
