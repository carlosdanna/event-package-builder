// The guests and dates step, shared by the wizard and the proposal route.
import { z } from "zod";
import { toMinorUnits } from "@/lib/money";
import { eventLength } from "@/lib/package/event-length";

export const MAX_GUESTS = 500;
export const MAX_EVENT_DAYS = 30;

const isoDate = z.iso.date({ message: "Enter a date as YYYY-MM-DD." });

type DateRange = { startDate: string; endDate: string };

// Zod runs these checks even when a date field failed, so a missing or
// malformed date is left to that field's own message.
function hasValidDates(range: DateRange) {
  return isoDate.safeParse(range.startDate).success && isoDate.safeParse(range.endDate).success;
}

// ISO dates compare correctly as strings.
function endsOnOrAfterStart(range: DateRange) {
  return !hasValidDates(range) || range.endDate >= range.startDate;
}

// A range that ends before it starts is reported by endsOnOrAfterStart instead.
function lastsAtMostMaxDays(range: DateRange) {
  if (!hasValidDates(range) || range.endDate < range.startDate) return true;
  return eventLength(range.startDate, range.endDate).days <= MAX_EVENT_DAYS;
}

const endBeforeStartError = {
  message: "The end date cannot be before the start date.",
  path: ["endDate"],
};

const tooLongError = {
  message: `An event can last at most ${MAX_EVENT_DAYS} days.`,
  path: ["endDate"],
};

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
  .refine(endsOnOrAfterStart, endBeforeStartError)
  .refine(lastsAtMostMaxDays, tooLongError);
export type EventBasics = z.infer<typeof eventBasicsSchema>;

// Budget in the smallest unit of the chosen currency, or null when the
// salesperson has not set one.
export const budgetSchema = z.number().int().positive().nullable();

// The step's form fields as typed, before they are read as numbers.
export type EventBasicsDraft = {
  guests: string;
  startDate: string;
  endDate: string;
  budget: string;
};

export const emptyEventBasicsDraft: EventBasicsDraft = {
  guests: "",
  startDate: "",
  endDate: "",
  budget: "",
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
    message: "Enter the budget as a whole number.",
  })
  .transform((text) => (text === "" ? null : toMinorUnits(Number(text.replaceAll(/[\s,]/g, "")))))
  .refine((amount) => amount === null || amount > 0, { message: "The budget must be more than zero." });

// Reads the draft into event basics and a budget in the smallest currency unit.
export const eventBasicsDraftSchema = z
  .object({
    guests: guestsField,
    startDate: z.string().min(1, "Pick a start date.").pipe(isoDate),
    endDate: z.string().min(1, "Pick an end date.").pipe(isoDate),
    budget: budgetField,
  })
  .refine(endsOnOrAfterStart, endBeforeStartError)
  .refine(lastsAtMostMaxDays, tooLongError)
  // Only the wizard checks this: a draft for a date that has since passed is still valid.
  .refine((draft) => !hasValidDates(draft) || draft.startDate >= todayIsoDate(), {
    message: "The start date cannot be in the past.",
    path: ["startDate"],
  })
  .transform(({ budget, ...basics }) => ({ basics, budget }));

// Today as a local calendar date, YYYY-MM-DD.
export function todayIsoDate(now: Date = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
