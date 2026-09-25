// The customer details step, shared by the wizard and the proposal route.
import { z } from "zod";

export const MAX_NOTES_LENGTH = 2000;

export const customerDetailsSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Enter the company name.")
    .max(200, "Keep the company name under 200 characters."),
  contactName: z
    .string()
    .trim()
    .min(1, "Enter the contact's name.")
    .max(200, "Keep the name under 200 characters."),
  contactEmail: z
    .string()
    .trim()
    .min(1, "Enter the contact's email address.")
    .pipe(z.email("Enter a valid email address.")),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES_LENGTH, `Keep the notes under ${MAX_NOTES_LENGTH} characters.`)
    .optional(),
});
export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

// The step's form fields as typed.
export type CustomerDetailsDraft = {
  company: string;
  contactName: string;
  contactEmail: string;
  notes: string;
};

export const emptyCustomerDetailsDraft: CustomerDetailsDraft = {
  company: "",
  contactName: "",
  contactEmail: "",
  notes: "",
};

// Reads the draft into customer details, leaving out empty notes.
export const customerDetailsDraftSchema = customerDetailsSchema.transform(
  ({ notes, ...details }): CustomerDetails => (notes ? { ...details, notes } : details),
);
