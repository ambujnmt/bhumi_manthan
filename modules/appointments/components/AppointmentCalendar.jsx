import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "2026-11" + 1 -> "2026-12" (string math, so the viewer's timezone cannot shift the month)
export const shiftMonth = (month, delta) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const monthParts = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));

  return {
    label: first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }),
    leadingBlanks: first.getUTCDay(),
  };
};

const DAY_STYLES = {
  available: "font-semibold text-[var(--secondary-color)] hover:bg-[var(--primary-color)]/10",
  full: "cursor-not-allowed text-gray-400 line-through",
  closed: "cursor-not-allowed text-gray-300",
};

// Keeps the tooltip inside the modal on the first and last columns
const tooltipPosition = (column) => {
  if (column <= 1) return "left-0";
  if (column >= 5) return "right-0";
  return "left-1/2 -translate-x-1/2";
};

const STATUS_TEXT = { available: "available", full: "fully booked", closed: "not available" };

export default function AppointmentCalendar({ calendar, month, loading, selectedDate, onMonthChange, onSelectDate }) {
  const { label, leadingBlanks } = monthParts(month);
  const canGoBack = calendar && month > calendar.min_month;
  const canGoForward = calendar && month < calendar.max_month;
  const navButton = "flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600";

  return (
    <div>
      <div className="mb-[8px] flex items-center justify-between">
        <button type="button" aria-label="Previous month" disabled={!canGoBack || loading} onClick={() => onMonthChange(shiftMonth(month, -1))} className={navButton}>
          <FaChevronLeft size={11} />
        </button>
        <p className="mb-0 text-sm font-bold text-[var(--secondary-color)]" aria-live="polite">{label}</p>
        <button type="button" aria-label="Next month" disabled={!canGoForward || loading} onClick={() => onMonthChange(shiftMonth(month, 1))} className={navButton}>
          <FaChevronRight size={11} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-center text-[11px] font-semibold uppercase text-gray-500">{day}</span>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? "opacity-40" : ""}`} aria-busy={loading}>
        {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} />)}

        {(calendar?.days || []).map((day, index) => {
          const isSelected = day.date === selectedDate;
          const isToday = day.date === calendar.today;
          const dayNumber = Number(day.date.slice(8));

          if (day.holiday) {
            // Not "disabled", so a keyboard or tap can focus it and reveal the name
            return (
              <div key={day.date} className="group relative">
                <button
                  type="button"
                  aria-disabled="true"
                  aria-label={`${day.date}, closed for ${day.holiday}`}
                  className="flex h-9 w-full cursor-not-allowed items-center justify-center rounded-lg bg-red-50 text-sm font-semibold text-red-600"
                >
                  {dayNumber}
                </button>
                <span
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-[170px] whitespace-normal break-words rounded-md bg-[var(--secondary-color)] px-2.5 py-1.5 text-center text-xs font-semibold text-white shadow-lg group-hover:block group-focus-within:block ${tooltipPosition((leadingBlanks + index) % 7)}`}
                >
                  {day.holiday}
                </span>
              </div>
            );
          }

          return (
            <button
              key={day.date}
              type="button"
              disabled={day.status !== "available" || loading}
              aria-pressed={isSelected}
              aria-label={`${day.date}, ${STATUS_TEXT[day.status]}`}
              onClick={() => onSelectDate(day.date)}
              className={`relative flex h-9 items-center justify-center rounded-lg text-sm transition ${isSelected ? "bg-[var(--primary-color)] font-bold text-white" : DAY_STYLES[day.status]} ${isToday && !isSelected ? "ring-1 ring-inset ring-[var(--primary-color)]" : ""}`}
            >
              {dayNumber}
              {day.status === "available" && !isSelected && (
                <span aria-hidden="true" className="absolute bottom-[3px] h-1 w-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-[8px] flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Slots open</span>
        <span className="flex items-center gap-1.5"><span className="line-through">12</span> Fully booked</span>
        <span className="flex items-center gap-1.5"><span className="rounded bg-red-50 px-1 font-semibold text-red-600">12</span> Holiday</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-300">12</span> Closed</span>
      </div>
    </div>
  );
}
