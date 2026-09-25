// The guests and dates step, shared by the wizard and the proposal route.
import { z } from "zod";

const isoDate = z.iso.date({ message: "Enter a date as YYYY-MM-DD." });

export const eventBasicsSchema = z
  .object({
    guests: z
      .number({ message: "Enter the number of guests." })
      .int("Guests must be a whole number.")
      .min(1, "There must be at least one guest."),
    startDate: isoDate,
    endDate: isoDate,
  })
  // ISO dates compare correctly as strings.
  .refine((basics) => basics.endDate >= basics.startDate, {
    message: "The end date cannot be before the start date.",
    path: ["endDate"],
  });
export type EventBasics = z.infer<typeof eventBasicsSchema>;
