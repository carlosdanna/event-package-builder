// How long an event lasts, from its ISO start and end dates.
const DAY_MS = 24 * 60 * 60 * 1000;

export type EventLength = { days: number; nights: number };

// Days count both the start and the end date. Dates are read as UTC so
// a daylight saving change cannot make a day 23 or 25 hours long.
export function eventLength(startDate: string, endDate: string): EventLength {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new RangeError(`Invalid dates: ${startDate} to ${endDate}.`);
  }
  if (end < start) {
    throw new RangeError(`The end date ${endDate} is before the start date ${startDate}.`);
  }

  const days = Math.round((end - start) / DAY_MS) + 1;
  return { days, nights: days - 1 };
}
