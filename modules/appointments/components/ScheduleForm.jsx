import { useEffect, useRef, useState } from "react";
import { getSchedule, saveSchedule } from "../api";
import HolidayPicker from "./HolidayPicker";

const DAYS = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
];

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--primary-color)]";
const labelClass = "mb-1 block text-[13px] font-semibold text-[#1A1F36]";

const toMinutes = (time) => {
  const [hours, minutes] = String(time || "0:0").split(":").map(Number);
  return hours * 60 + minutes;
};

const slotsPerDay = ({ slot_minutes, buffer_minutes, start_time, end_time }) => {
  const slot = Number(slot_minutes);
  const open = toMinutes(end_time) - toMinutes(start_time);
  if (!slot || open < slot) return 0;
  return Math.floor((open - slot) / (slot + Number(buffer_minutes || 0))) + 1;
};

export default function ScheduleForm() {
  const [scope, setScope] = useState("mine");
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState({ uses_default: false, can_edit_default: false });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequest.current;
    setForm(null);
    setNotice(null);

    getSchedule(scope)
      .then((data) => {
        if (requestId !== latestRequest.current) return;
        setForm(data.schedule);
        setMeta({ uses_default: data.uses_default, can_edit_default: data.can_edit_default });
      })
      .catch((err) => {
        if (requestId === latestRequest.current) setNotice({ type: "error", text: err.message });
      });
  }, [scope]);

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const toggleDay = (day) => update(
    "working_days",
    form.working_days.includes(day) ? form.working_days.filter((item) => item !== day) : [...form.working_days, day]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const result = await saveSchedule(scope, {
        ...form,
        slot_minutes: Number(form.slot_minutes),
        buffer_minutes: Number(form.buffer_minutes),
        advance_days: Number(form.advance_days),
        blocked_dates: form.blocked_dates.map(({ date, name }) => ({ date, name: name?.trim() || null })),
      });
      setForm(result.data.schedule);
      setMeta((previous) => ({ ...previous, uses_default: false }));
      setNotice({ type: "success", text: result.message });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const noticeBanner = notice && (
    <p role={notice.type === "error" ? "alert" : "status"} className={`mb-4 rounded-lg px-3 py-2 text-sm ${notice.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
      {notice.text}
    </p>
  );

  const perDay = form ? slotsPerDay(form) : 0;

  return (
    <div>
      {meta.can_edit_default && (
        <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {[["mine", "My schedule"], ["default", "Default for all owners"]].map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${scope === value ? "bg-[var(--primary-color)] text-white" : "text-[#62748E] hover:text-[var(--primary-color)]"}`}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {!form ? (
        notice ? noticeBanner : <div className="h-80 animate-pulse rounded-lg bg-gray-200" aria-busy="true" aria-label="Loading schedule" />
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-[20px]">
          {noticeBanner}

          <p className="mb-4 text-[13px] text-[#62748E]">
            {scope === "default"
              ? "Used for every owner who has not saved their own schedule."
              : meta.uses_default
                ? "You are using the default schedule. Saving here creates your own."
                : "These settings apply to all of your listings."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="slot_minutes" className={labelClass}>Slot length (minutes)</label>
              <input id="slot_minutes" type="number" min={5} max={480} step={5} required value={form.slot_minutes} onChange={(e) => update("slot_minutes", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="buffer_minutes" className={labelClass}>Gap between slots (minutes)</label>
              <input id="buffer_minutes" type="number" min={0} max={240} step={5} required value={form.buffer_minutes} onChange={(e) => update("buffer_minutes", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="start_time" className={labelClass}>Day starts at</label>
              <input id="start_time" type="time" required value={form.start_time} onChange={(e) => update("start_time", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="end_time" className={labelClass}>Day ends at</label>
              <input id="end_time" type="time" required value={form.end_time} onChange={(e) => update("end_time", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="advance_days" className={labelClass}>Bookable how many days ahead</label>
              <input id="advance_days" type="number" min={1} max={365} required value={form.advance_days} onChange={(e) => update("advance_days", e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end">
              <p className="mb-0 w-full rounded-lg bg-[#fdf3e7] px-3 py-2 text-sm font-semibold text-[var(--secondary-color)]">
                {perDay} {perDay === 1 ? "slot" : "slots"} per day
              </p>
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className={labelClass}>Working days</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(([value, text]) => {
                const active = form.working_days.includes(value);

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(value)}
                    className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition ${active ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white" : "border-gray-300 text-[#62748E] hover:border-[var(--primary-color)]"}`}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4">
            <p className={labelClass}>Holidays / blocked dates</p>
            <HolidayPicker
              value={form.blocked_dates}
              workingDays={form.working_days}
              onChange={(next) => update("blocked_dates", next)}
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#1A1F36]">
            <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="h-4 w-4 accent-[var(--primary-color)]" />
            Accepting appointments
          </label>

          <div className="mt-[20px] border-t border-gray-100 pt-4">
            <button type="submit" disabled={saving || form.working_days.length === 0} className="rounded-lg bg-[var(--primary-color)] px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving..." : "Save Schedule"}
            </button>
            {form.working_days.length === 0 && <p className="mb-0 mt-2 text-xs text-red-600">Select at least one working day.</p>}
            <p className="mb-0 mt-2 text-xs text-[#62748E]">Existing appointments stay as they are when the schedule changes.</p>
          </div>
        </form>
      )}
    </div>
  );
}
