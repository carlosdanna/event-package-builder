"use client";

import { useState } from "react";
import { addDays, format, max, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Typography } from "@/components/ui/typography";
import { plural } from "@/lib/format";
import type { Currency } from "@/lib/money";
import { eventLength } from "@/lib/package";
import {
  MAX_EVENT_DAYS,
  MAX_GUESTS,
  eventBasicsDraftSchema,
  type EventBasicsDraft,
} from "@/lib/schemas/event-basics";
import { Field } from "./field";
import { fieldErrors } from "./field-errors";

type FieldName = keyof EventBasicsDraft;

// Element ids in form order, so the wizard can focus the first invalid field.
export const basicsFieldIds: Record<FieldName, string> = {
  guests: "guests",
  startDate: "start-date",
  endDate: "end-date",
  budget: "budget",
};

type BasicsStepProps = {
  draft: EventBasicsDraft;
  currency: Currency;
  showAllErrors: boolean;
  onChange: (field: FieldName, value: string) => void;
};

export function BasicsStep({ draft, currency, showAllErrors, onChange }: BasicsStepProps) {
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const errors = fieldErrors<FieldName>(eventBasicsDraftSchema, draft);
  const errorFor = (field: FieldName) => (showAllErrors || touched[field] ? errors[field] : undefined);
  const touch = (field: FieldName) => setTouched((current) => ({ ...current, [field]: true }));

  return (
    <div className="flex flex-col gap-6">
      <Field id={basicsFieldIds.guests} label="Number of guests" error={errorFor("guests")}>
        {(describedBy) => (
          <Input
            id={basicsFieldIds.guests}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_GUESTS}
            step={1}
            placeholder="For example 40"
            className="max-w-40"
            value={draft.guests}
            onChange={(event) => onChange("guests", event.target.value)}
            onBlur={() => touch("guests")}
            aria-invalid={Boolean(errorFor("guests"))}
            aria-describedby={describedBy}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id={basicsFieldIds.startDate} label="Start date" error={errorFor("startDate")}>
            {(describedBy) => (
              <DatePicker
                id={basicsFieldIds.startDate}
                value={draft.startDate}
                describedBy={describedBy}
                invalid={Boolean(errorFor("startDate"))}
                onChange={(value) => {
                  onChange("startDate", value);
                  touch("startDate");
                  // Keep the range valid: a single-day event is the natural default.
                  if (!draft.endDate || draft.endDate < value || draft.endDate > lastEndDate(value)) {
                    onChange("endDate", value);
                  }
                }}
              />
            )}
          </Field>
          <Field id={basicsFieldIds.endDate} label="End date" error={errorFor("endDate")}>
            {(describedBy) => (
              <DatePicker
                id={basicsFieldIds.endDate}
                value={draft.endDate}
                earliest={draft.startDate}
                latest={draft.startDate ? lastEndDate(draft.startDate) : undefined}
                describedBy={describedBy}
                invalid={Boolean(errorFor("endDate"))}
                onChange={(value) => {
                  onChange("endDate", value);
                  touch("endDate");
                }}
              />
            )}
          </Field>
        </div>
        <EventLengthNote startDate={draft.startDate} endDate={draft.endDate} />
      </div>

      <Field
        id={basicsFieldIds.budget}
        label={`Budget in ${currency} (optional)`}
        hint="Excluding tax. The summary shows how much of it the package uses."
        error={errorFor("budget")}
      >
        {(describedBy) => (
          <Input
            id={basicsFieldIds.budget}
            inputMode="numeric"
            placeholder="For example 120,000"
            className="max-w-56"
            value={draft.budget}
            onChange={(event) => onChange("budget", event.target.value)}
            onBlur={() => touch("budget")}
            aria-invalid={Boolean(errorFor("budget"))}
            aria-describedby={describedBy}
          />
        )}
      </Field>
    </div>
  );
}

type DatePickerProps = {
  id: string;
  value: string;
  earliest?: string;
  latest?: string;
  describedBy?: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

function DatePicker({ id, value, earliest, latest, describedBy, invalid, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? fromIsoDate(value) : undefined;
  // Events cannot start in the past; the end date cannot be before the start.
  const today = startOfToday();
  const earliestDate = earliest ? max([fromIsoDate(earliest), today]) : today;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className="w-full justify-start font-normal sm:max-w-64"
          // The label alone would hide the chosen date from screen readers.
          aria-labelledby={`${id}-label ${id}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        >
          <CalendarIcon aria-hidden />
          {selected ? (
            format(selected, "EEE d MMM yyyy")
          ) : (
            <Typography as="span" color="muted">Pick a date</Typography>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? earliestDate}
          disabled={
            latest ? [{ before: earliestDate }, { after: fromIsoDate(latest) }] : { before: earliestDate }
          }
          onSelect={(date) => {
            if (!date) return;
            onChange(toIsoDate(date));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function EventLengthNote({ startDate, endDate }: { startDate: string; endDate: string }) {
  if (!startDate || !endDate || endDate < startDate) return null;
  const { days, nights } = eventLength(startDate, endDate);
  return (
    <Typography aria-live="polite" size="sm" color="muted">
      {plural(days, "day")}, {plural(nights, "night")}
    </Typography>
  );
}

// The last end date that keeps the event within MAX_EVENT_DAYS.
function lastEndDate(startDate: string) {
  return toIsoDate(addDays(fromIsoDate(startDate), MAX_EVENT_DAYS - 1));
}

// Calendar dates are local days, so they are read and written without time zones.
function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}
