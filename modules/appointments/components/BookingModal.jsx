import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowLeft, FaCheckCircle, FaEnvelope, FaMobileAlt, FaRegCalendarAlt, FaRegClock, FaTimes, FaUser } from "react-icons/fa";
import { bookAppointment, getCalendar, getSlots } from "../api";
import AppointmentCalendar from "./AppointmentCalendar";

const fieldLabelClass = "mb-1 block text-[13px] font-semibold text-[var(--secondary-color)]";
const fieldInputClass = "w-full min-w-0 bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none";

// "13:20" -> "01:20 PM", same format as the slot labels from the API
const formatTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
};

const Field = ({ id, label, icon: Icon, required, children }) => (
  <div>
    <label htmlFor={id} className={fieldLabelClass}>
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    <div className="flex items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-[var(--primary-color)]">
      <Icon className="shrink-0 text-gray-400" size={13} aria-hidden="true" />
      {children}
    </div>
  </div>
);

const SummaryRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--primary-color)] sm:flex">
      <Icon size={13} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="mb-0 text-xs text-[#62748E]">{label}</p>
      <p className="mb-0 text-sm font-semibold text-[var(--secondary-color)]">{value}</p>
    </div>
  </div>
);

const formatDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const SlotList = ({ date, slots, loading, selected, onSelect }) => {
  if (!date) {
    return <p className="mb-0 rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">Select a date to see the available time slots.</p>;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading slots">
        {[...Array(9)].map((_, index) => <div key={index} className="h-[38px] animate-pulse rounded-lg bg-gray-100" />)}
      </div>
    );
  }

  if (!slots.length) {
    return <p className="mb-0 rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">No slots left on this date. Please choose another one.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 md:max-h-[270px] md:overflow-y-auto">
      {slots.map((slot) => {
        const isSelected = selected?.start_time === slot.start_time;

        return (
          <button
            key={slot.start_time}
            type="button"
            disabled={!slot.available}
            aria-pressed={isSelected}
            onClick={() => onSelect(slot)}
            className={`rounded-lg border px-1 py-2 text-[13px] font-semibold transition ${
              isSelected
                ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                : slot.available
                  ? "border-gray-200 text-[var(--secondary-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                  : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 line-through"
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
};

export default function BookingModal({ bookableType, bookableKey, title, user, onClose }) {
  const [step, setStep] = useState("slot"); // slot -> details -> done
  const [month, setMonth] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState(null);

  // Only the latest request may update the screen when dates or months are clicked quickly
  const calendarRequest = useRef(0);
  const slotsRequest = useRef(0);
  const closeButton = useRef(null);

  const loadCalendar = useCallback(async (nextMonth) => {
    const requestId = ++calendarRequest.current;
    setCalendarLoading(true);
    try {
      const data = await getCalendar(bookableType, bookableKey, nextMonth);
      if (requestId !== calendarRequest.current) return;
      setCalendar(data);
      setMonth(data.month);
      setFatalError("");
    } catch (err) {
      if (requestId !== calendarRequest.current) return;
      if (calendar) setError(err.message);
      else setFatalError(err.message);
    } finally {
      if (requestId === calendarRequest.current) setCalendarLoading(false);
    }
  }, [bookableType, bookableKey, calendar]);

  const loadSlots = useCallback(async (nextDate) => {
    const requestId = ++slotsRequest.current;
    setSlotsLoading(true);
    try {
      const data = await getSlots(bookableType, bookableKey, nextDate);
      if (requestId === slotsRequest.current) setSlots(data.slots);
    } catch (err) {
      if (requestId === slotsRequest.current) {
        setSlots([]);
        setError(err.message);
      }
    } finally {
      if (requestId === slotsRequest.current) setSlotsLoading(false);
    }
  }, [bookableType, bookableKey]);

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeClose = useCallback(() => {
    if (!submitting) onClose();
  }, [submitting, onClose]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") safeClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [safeClose]);

  const selectDate = (nextDate) => {
    setDate(nextDate);
    setSlot(null);
    setError("");
    loadSlots(nextDate);
  };

  const changeMonth = (nextMonth) => {
    setDate(null);
    setSlot(null);
    setSlots([]);
    setError("");
    loadCalendar(nextMonth);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await bookAppointment(bookableType, bookableKey, { ...form, date, start_time: slot.start_time });
      setBooked(result);
      setStep("done");
    } catch (err) {
      setError(err.message);

      // Someone else took the slot meanwhile: go back to fresh availability
      if (err.status === 409) {
        setStep("slot");
        setSlot(null);
        loadSlots(date);
        loadCalendar(month);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorBanner = error && (
    <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) safeClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-[var(--secondary-color)] px-[20px] py-[12px] text-white">
          <div className="min-w-0">
            <h3 id="appointment-modal-title" className="mb-1 text-lg font-semibold text-white">Book an Appointment</h3>
            <p className="mb-0 truncate text-sm text-white/80" title={title}>{title}</p>
            {calendar?.bookable?.owner_name && (
              <p className="mb-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
                <span>With {calendar.bookable.owner_name}</span>
                <span className="flex items-center gap-1"><FaRegClock size={11} /> {calendar.slot_minutes} min</span>
              </p>
            )}
          </div>
          <button ref={closeButton} type="button" aria-label="Close" onClick={safeClose} className="shrink-0 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="overflow-y-auto px-[20px] py-[16px]">
          {fatalError ? (
            <p role="alert" className="mb-0 rounded-lg bg-red-50 px-4 py-8 text-center text-sm text-red-600">{fatalError}</p>
          ) : !calendar ? (
            <div className="h-[310px] animate-pulse rounded-lg bg-gray-100" aria-busy="true" aria-label="Loading calendar" />
          ) : step === "slot" ? (
            <>
              {errorBanner}
              <div className="grid gap-6 md:grid-cols-2">
                <AppointmentCalendar
                  calendar={calendar}
                  month={month}
                  loading={calendarLoading}
                  selectedDate={date}
                  onMonthChange={changeMonth}
                  onSelectDate={selectDate}
                />
                <div>
                  <p className="mb-3 text-sm font-bold text-[var(--secondary-color)]">
                    {date ? formatDate(date) : "Available slots"}
                  </p>
                  <SlotList date={date} slots={slots} loading={slotsLoading} selected={slot} onSelect={setSlot} />
                </div>
              </div>
              <div className="mt-[12px] flex justify-end border-t border-gray-100 pt-[12px]">
                <button
                  type="button"
                  disabled={!slot}
                  onClick={() => { setError(""); setStep("details"); }}
                  className="w-full rounded-lg bg-[var(--primary-color)] px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Continue
                </button>
              </div>
            </>
          ) : step === "details" ? (
            <form onSubmit={handleSubmit}>
              {errorBanner}

              <div className="grid gap-[20px] md:grid-cols-[240px_1fr]">
                {/* Chosen slot */}
                <div className="rounded-xl bg-[#fdf3e7] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#62748E]">Your appointment</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                    <SummaryRow icon={FaRegCalendarAlt} label="Date" value={formatDate(date)} />
                    <SummaryRow icon={FaRegClock} label="Time" value={`${slot.label} - ${formatTime(slot.end_time)}`} />
                  </div>
                  <p className="mb-0 mt-3 hidden border-t border-[#f3d9bf] pt-3 text-xs leading-relaxed text-[#62748E] md:block">
                    Your request goes to {calendar.bookable.owner_name}. We will email you once it is confirmed.
                  </p>
                </div>

                {/* Contact details */}
                <div className="min-w-0 space-y-3">
                  <Field id="appointment-name" label="Your name" icon={FaUser} required>
                    <input id="appointment-name" name="name" value={form.name} onChange={handleChange} required maxLength={100} placeholder="Enter your full name" autoComplete="name" className={fieldInputClass} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="appointment-phone" label="Mobile number" icon={FaMobileAlt} required>
                      <input id="appointment-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required minLength={8} maxLength={20} placeholder="Enter mobile number" autoComplete="tel" className={fieldInputClass} />
                    </Field>
                    <Field id="appointment-email" label="Email address" icon={FaEnvelope} required>
                      <input id="appointment-email" name="email" type="email" value={form.email} onChange={handleChange} required maxLength={255} placeholder="you@email.com" autoComplete="email" className={fieldInputClass} />
                    </Field>
                  </div>
                  <div>
                    <label htmlFor="appointment-message" className={fieldLabelClass}>
                      Message <span className="font-normal text-[#62748E]">(optional)</span>
                    </label>
                    <textarea id="appointment-message" name="message" value={form.message} onChange={handleChange} rows={3} maxLength={1000} placeholder="Anything the owner should know before the visit" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[var(--primary-color)]" />
                  </div>
                </div>
              </div>

              <div className="mt-[12px] flex items-center justify-between gap-3 border-t border-gray-100 pt-[12px]">
                <button type="button" disabled={submitting} onClick={() => { setError(""); setStep("slot"); }} className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-[var(--secondary-color)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-50">
                  <FaArrowLeft size={11} /> Back
                </button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-[var(--primary-color)] px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mx-auto max-w-md py-6 text-center" role="status">
              <FaCheckCircle className="mx-auto mb-3 text-emerald-500" size={44} />
              <h4 className="mb-2 text-lg font-bold text-[var(--secondary-color)]">Request sent</h4>
              <p className="mb-1 text-sm font-semibold text-[var(--secondary-color)]">{booked?.data?.appointment?.time_label}</p>
              <p className="mb-[20px] text-sm text-gray-600">{booked?.message} A confirmation email is on its way to {form.email}.</p>
              <button type="button" onClick={onClose} className="rounded-lg bg-[var(--primary-color)] px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
