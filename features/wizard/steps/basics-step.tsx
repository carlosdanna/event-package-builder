"use client";

import { useState } from "react";
import { addDays, format, max, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { eventLength } from "@/lib/package";
import {
  MAX_EVENT_DAYS,
  MAX_GUESTS,
  eventBasicsDraftSchema,
  type EventBasicsDraft,
} from "@/lib/schemas/event-basics";
import { Field } from "./field";

type FieldName = keyof EventBasicsDraft;

type BasicsStepProps = {
  draft: EventBasicsDraft;
  showAllErrors: boolean;
  onChange: (field: FieldName, value: string) => void;
};

export function BasicsStep({ draft, showAllErrors, onChange }: BasicsStepProps) {
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const errors = fieldErrors(draft);
  const errorFor = (field: FieldName) => (showAllErrors || touched[field] ? errors[field] : undefined);
  const touch = (field: FieldName) => setTouched((current) => ({ ...current, [field]: true }));

  return (
    <div className="flex flex-col gap-6">
      <Field id="guests" label="Number of guests" error={errorFor("guests")}>
        {(describedBy) => (
          <Input
            id="guests"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="start-date" label="Start date" error={errorFor("startDate")}>
            {(describedBy) => (
              <DatePicker
                id="start-date"
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
          <Field id="end-date" label="End date" error={errorFor("endDate")}>
            {(describedBy) => (
              <DatePicker
                id="end-date"
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
        id="budget"
        label="Budget in kronor (optional)"
        hint="Excluding tax. The summary shows how much of it the package uses."
        error={errorFor("budgetKronor")}
      >
        {(describedBy) => (
          <Input
            id="budget"
            inputMode="numeric"
            placeholder="For example 120,000"
            className="max-w-56"
            value={draft.budgetKronor}
            onChange={(event) => onChange("budgetKronor", event.target.value)}
            onBlur={() => touch("budgetKronor")}
            aria-invalid={Boolean(errorFor("budgetKronor"))}
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
          aria-invalid={invalid}
          aria-describedby={describedBy}
        >
          <CalendarIcon aria-hidden />
          {selected ? (
            format(selected, "EEE d MMM yyyy")
          ) : (
            <span className="text-muted-foreground">Pick a date</span>
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
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {plural(days, "day")}, {plural(nights, "night")}
    </p>
  );
}

// The last end date that keeps the event within MAX_EVENT_DAYS.
function lastEndDate(startDate: string) {
  return toIsoDate(addDays(fromIsoDate(startDate), MAX_EVENT_DAYS - 1));
}

function fieldErrors(draft: EventBasicsDraft) {
  const result = eventBasicsDraftSchema.safeParse(draft);
  const errors: Partial<Record<FieldName, string>> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = issue.path[0] as FieldName;
    errors[field] ??= issue.message;
  }
  return errors;
}

// Calendar dates are local days, so they are read and written without time zones.
function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
