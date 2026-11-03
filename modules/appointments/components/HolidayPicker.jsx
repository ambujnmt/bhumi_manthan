import { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaRegCalendarTimes, FaTimes } from "react-icons/fa";
import { monthParts, shiftMonth, WEEKDAYS } from "./AppointmentCalendar";

const pad = (number) => String(number).padStart(2, "0");

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * value: [{ date: "2026-11-08", name: "Diwali" }]
 * Click a date to block it, then type its name in the list. workingDays only shades weekly offs.
 */
export default function HolidayPicker({ value, workingDays, onChange }) {
  const today = localToday();
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [focusRequest, setFocusRequest] = useState(null);
  const nameInputs = useRef({});

  useEffect(() => {
    if (focusRequest) nameInputs.current[focusRequest.date]?.focus();
  }, [focusRequest]);

  const blocked = new Map(value.map((item) => [item.date, item.name]));
  const { label, leadingBlanks } = monthParts(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const selectDate = (date) => {
    if (!blocked.has(date)) {
      onChange([...value, { date, name: null }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setFocusRequest({ date });
  };

  const rename = (date, name) => onChange(value.map((item) => (item.date === date ? { ...item, name } : item)));

  const navButton = "flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600";

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Previous month" disabled={month <= currentMonth} onClick={() => setMonth(shiftMonth(month, -1))} className={navButton}>
            <FaChevronLeft size={11} />
          </button>
          <p className="mb-0 text-sm font-bold text-[var(--secondary-color)]" aria-live="polite">{label}</p>
          <button type="button" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className={navButton}>
            <FaChevronRight size={11} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1 text-center text-[11px] font-semibold uppercase text-gray-500">{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} />)}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const dayNumber = index + 1;
            const date = `${month}-${pad(dayNumber)}`;
            const isBlocked = blocked.has(date);
            const isPast = date < today;
            const isWeeklyOff = !workingDays.includes((leadingBlanks + index) % 7);
            const name = blocked.get(date);

            return (
              <button
                key={date}
                type="button"
                disabled={isPast && !isBlocked}
                aria-pressed={isBlocked}
                aria-label={`${date}${isBlocked ? `, blocked${name ? `, ${name}` : ""}` : ""}`}
                title={isBlocked ? name || "Blocked" : undefined}
                onClick={() => selectDate(date)}
                className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${
                  isBlocked
                    ? "bg-red-600 font-bold text-white hover:bg-red-700"
                    : isPast
                      ? "cursor-not-allowed text-gray-300"
                      : isWeeklyOff
                        ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-700"
                        : "font-semibold text-[var(--secondary-color)] hover:bg-red-50 hover:text-red-700"
                } ${date === today && !isBlocked ? "ring-1 ring-inset ring-[var(--primary-color)]" : ""}`}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-600" /> Holiday</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" /> Weekly off</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-[var(--primary-color)]" /> Today</span>
        </div>
      </div>

      {/* Selected holidays */}
      <div className="flex min-w-0 flex-col rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-bold text-[var(--secondary-color)]">
          Selected holidays{value.length > 0 && <span className="font-normal text-[#62748E]"> ({value.length})</span>}
        </p>

        {value.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-10 text-center">
            <FaRegCalendarTimes className="text-gray-400" size={24} />
            <p className="mb-0 text-sm text-[#62748E]">Click a date on the calendar to mark it as a holiday.</p>
          </div>
        ) : (
          <ul className="mb-0 max-h-[320px] list-none space-y-2 overflow-y-auto p-0 pr-1">
            {value.map(({ date, name }) => (
              <li key={date} className="flex flex-col gap-2 rounded-lg bg-gray-50 p-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setMonth(date.slice(0, 7))}
                  className="shrink-0 text-left text-[13px] font-semibold text-[#1A1F36] hover:text-[var(--primary-color)] sm:w-[130px]"
                >
                  {formatDate(date)}
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    ref={(element) => { nameInputs.current[date] = element; }}
                    type="text"
                    value={name || ""}
                    maxLength={100}
                    placeholder="Holiday name (optional), e.g. Diwali"
                    aria-label={`Holiday name for ${date}`}
                    onChange={(event) => rename(date, event.target.value)}
                    onKeyDown={(event) => {
                      // Enter must not save the whole schedule form
                      if (event.key === "Enter") event.preventDefault();
                    }}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--primary-color)]"
                  />
                  <button type="button" aria-label={`Remove ${date}`} onClick={() => onChange(value.filter((item) => item.date !== date))} className="shrink-0 rounded-full p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600">
                    <FaTimes size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
