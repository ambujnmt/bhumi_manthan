import { useState } from "react";
import AppointmentList from "./AppointmentList";
import ScheduleForm from "./ScheduleForm";

const TABS = [
  ["appointments", "Appointments"],
  ["schedule", "Slot Settings"],
];

/**
 * Owner / admin screen. getBookableUrl(item) optionally links a row to its public page.
 */
export default function AppointmentManager({ getBookableUrl }) {
  const [tab, setTab] = useState("appointments");

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-[#001737]">Appointment Management</h1>

      <div role="tablist" className="mb-4 flex gap-5 border-b border-gray-200">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold transition ${tab === value ? "border-[var(--primary-color)] text-[var(--primary-color)]" : "border-transparent text-[#62748E] hover:text-[#1A1F36]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "appointments" ? <AppointmentList getBookableUrl={getBookableUrl} /> : <ScheduleForm />}
    </div>
  );
}
