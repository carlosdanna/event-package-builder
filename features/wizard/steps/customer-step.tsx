"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_NOTES_LENGTH,
  customerDetailsDraftSchema,
  type CustomerDetailsDraft,
} from "@/lib/schemas/customer";
import { Field } from "./field";
import { fieldErrors } from "./field-errors";

type FieldName = keyof CustomerDetailsDraft;

// Element ids in form order, so the wizard can focus the first invalid field.
export const customerFieldIds: Record<FieldName, string> = {
  company: "company",
  contactName: "contact-name",
  contactEmail: "contact-email",
  notes: "notes",
};

type CustomerStepProps = {
  draft: CustomerDetailsDraft;
  showAllErrors: boolean;
  onChange: (field: FieldName, value: string) => void;
};

export function CustomerStep({ draft, showAllErrors, onChange }: CustomerStepProps) {
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const errors = fieldErrors<FieldName>(customerDetailsDraftSchema, draft);
  const errorFor = (field: FieldName) => (showAllErrors || touched[field] ? errors[field] : undefined);
  const touch = (field: FieldName) => setTouched((current) => ({ ...current, [field]: true }));

  return (
    <div className="flex flex-col gap-6">
      <Field id={customerFieldIds.company} label="Company" error={errorFor("company")}>
        {(describedBy) => (
          <Input
            id={customerFieldIds.company}
            autoComplete="organization"
            placeholder="For example Acme AB"
            className="sm:max-w-md"
            value={draft.company}
            onChange={(event) => onChange("company", event.target.value)}
            onBlur={() => touch("company")}
            aria-invalid={Boolean(errorFor("company"))}
            aria-describedby={describedBy}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={customerFieldIds.contactName} label="Contact name" error={errorFor("contactName")}>
          {(describedBy) => (
            <Input
              id={customerFieldIds.contactName}
              autoComplete="name"
              value={draft.contactName}
              onChange={(event) => onChange("contactName", event.target.value)}
              onBlur={() => touch("contactName")}
              aria-invalid={Boolean(errorFor("contactName"))}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id={customerFieldIds.contactEmail} label="Contact email" error={errorFor("contactEmail")}>
          {(describedBy) => (
            <Input
              id={customerFieldIds.contactEmail}
              type="email"
              autoComplete="email"
              value={draft.contactEmail}
              onChange={(event) => onChange("contactEmail", event.target.value)}
              onBlur={() => touch("contactEmail")}
              aria-invalid={Boolean(errorFor("contactEmail"))}
              aria-describedby={describedBy}
            />
          )}
        </Field>
      </div>

      <Field
        id={customerFieldIds.notes}
        label="Notes (optional)"
        hint="Internal, not shown to the customer."
        error={errorFor("notes")}
      >
        {(describedBy) => (
          <Textarea
            id={customerFieldIds.notes}
            rows={4}
            maxLength={MAX_NOTES_LENGTH}
            placeholder="For example dietary needs or arrival times"
            value={draft.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            onBlur={() => touch("notes")}
            aria-invalid={Boolean(errorFor("notes"))}
            aria-describedby={describedBy}
          />
        )}
      </Field>
    </div>
  );
}
