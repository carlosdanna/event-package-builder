// The first error message for each field of a form draft, keyed by field name.
import type { z } from "zod";

export function fieldErrors<Field extends string>(schema: z.ZodType, draft: Record<Field, string>) {
  const result = schema.safeParse(draft);
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = issue.path[0] as Field;
    errors[field] ??= issue.message;
  }
  return errors;
}
