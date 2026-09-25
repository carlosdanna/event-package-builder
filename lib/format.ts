// Money formatting for the interface. Prices are stored as whole öre.
const kronorFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

// 1240000 öre becomes "12,400 kronor".
export function formatKronor(ore: number) {
  return `${kronorFormat.format(Math.round(ore / 100))} kronor`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ISO dates as a short range: "14 Oct 2026", "14–15 Oct 2026" or "30 Oct – 2 Nov 2026".
// Read as plain calendar dates, so the time zone never shifts the day.
export function formatDateRange(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const end = `${endDay} ${MONTHS[endMonth - 1]} ${endYear}`;

  if (startDate === endDate) return end;
  if (startYear === endYear && startMonth === endMonth) return `${startDay}–${end}`;
  if (startYear === endYear) return `${startDay} ${MONTHS[startMonth - 1]} – ${end}`;
  return `${startDay} ${MONTHS[startMonth - 1]} ${startYear} – ${end}`;
}
