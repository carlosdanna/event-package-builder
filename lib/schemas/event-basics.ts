// The guests and dates step, shared by the wizard and the proposal route.
import { z } from "zod";

export const MAX_GUESTS = 500;

const isoDate = z.iso.date({ message: "Enter a date as YYYY-MM-DD." });

export const eventBasicsSchema = z
  .object({
    guests: z
      .number({ message: "Enter the number of guests." })
      .int("Guests must be a whole number.")
      .min(1, "There must be at least one guest.")
      .max(MAX_GUESTS, `There can be at most ${MAX_GUESTS} guests.`),
    startDate: isoDate,
    endDate: isoDate,
  })
  // ISO dates compare correctly as strings.
  .refine((basics) => basics.endDate >= basics.startDate, {
    message: "The end date cannot be before the start date.",
    path: ["endDate"],
  });
export type EventBasics = z.infer<typeof eventBasicsSchema>;

// Budget in öre, or null when the salesperson has not set one.
export const budgetOreSchema = z.number().int().positive().nullable();

// The step's form fields as typed, before they are read as numbers.
export type EventBasicsDraft = {
  guests: string;
  startDate: string;
  endDate: string;
  budgetKronor: string;
};

export const emptyEventBasicsDraft: EventBasicsDraft = {
  guests: "",
  startDate: "",
  endDate: "",
  budgetKronor: "",
};

const wholeNumber = /^\d+$/;

// Empty text becomes undefined so the schema's "required" message shows.
const guestsField = z.preprocess(
  (text: string) => (text.trim() === "" ? undefined : Number(text.trim())),
  eventBasicsSchema.shape.guests,
);

const budgetField = z
  .string()
  .trim()
  .refine((text) => text === "" || wholeNumber.test(text.replaceAll(/[\s,]/g, "")), {
    message: "Enter the budget as a whole number of kronor.",
  })
  .transform((text) => (text === "" ? null : Number(text.replaceAll(/[\s,]/g, "")) * 100))
  .refine((ore) => ore === null || ore > 0, { message: "The budget must be more than zero." });

// Reads the draft into event basics and a budget in öre.
export const eventBasicsDraftSchema = z
  .object({
    guests: guestsField,
    startDate: z.string().min(1, "Pick a start date.").pipe(isoDate),
    endDate: z.string().min(1, "Pick an end date.").pipe(isoDate),
    budgetKronor: budgetField,
  })
  .refine((draft) => draft.endDate >= draft.startDate, {
    message: "The end date cannot be before the start date.",
    path: ["endDate"],
  })
  .transform(({ budgetKronor, ...basics }) => ({ basics, budgetOre: budgetKronor }));
