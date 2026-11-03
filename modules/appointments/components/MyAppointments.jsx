import { useEffect, useState } from "react";
import { getMyAppointments } from "../api";

const FILTERS = [
  ["upcoming", "Upcoming"],
  ["all", "All"],
];

const STATUS_BADGES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-200 text-gray-700",
};

// Bookings made by the logged in customer (read only)
export default function MyAppointments({ getBookableUrl }) {
  const [filter, setFilter] = useState("upcoming");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setError("");
    getMyAppointments({ upcoming: filter === "upcoming" ? 1 : undefined, page })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
    setData(null);
  };

  return (
    <div>
      <h1 className="mb-[16px] text-2xl font-bold text-[var(--secondary-color)]">My Appointments</h1>

      <div className="mb-[16px] flex gap-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => changeFilter(key)}
            className={`rounded-lg px-[14px] py-[8px] text-sm font-semibold transition-colors ${
              filter === key
                ? "bg-[var(--primary-color)] text-white"
                : "border border-gray-200 bg-white text-[var(--secondary-color)] hover:border-[var(--primary-color)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-[20px] text-red-600">{error}</div>
      ) : !data ? (
        <div className="h-[150px] animate-pulse rounded-xl bg-gray-100" />
      ) : data.appointments.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-[20px] py-[48px] text-center text-sm text-[#62748E] shadow-sm">
          {filter === "upcoming" ? "No upcoming appointments." : "You have not booked any appointments yet."}
        </div>
      ) : (
        <ul className="mb-0 list-none space-y-3 p-0">
          {data.appointments.map((item) => {
            const url = getBookableUrl?.(item);

            return (
              <li key={item.id} className="rounded-2xl border border-gray-100 bg-white p-[16px] shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {url ? (
                      <a href={url} className="break-words font-semibold text-[var(--secondary-color)] no-underline hover:text-[var(--primary-color)]">
                        {item.bookable_title}
                      </a>
                    ) : (
                      <span className="break-words font-semibold text-[var(--secondary-color)]">{item.bookable_title}</span>
                    )}
                    <div className="mt-[4px] text-sm text-[#62748E]">{item.time_label}</div>
                    {item.owner_name && <div className="mt-[2px] text-xs text-[#62748E]">With {item.owner_name}</div>}
                  </div>
                  <span className={`shrink-0 rounded-full px-[10px] py-[3px] text-xs font-semibold capitalize ${STATUS_BADGES[item.status] || ""}`}>
                    {item.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data?.pagination.last_page > 1 && (
        <div className="mt-[20px] flex flex-wrap justify-center gap-2">
          {Array.from({ length: data.pagination.last_page }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-current={number === page ? "page" : undefined}
              onClick={() => setPage(number)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                number === page
                  ? "bg-[var(--primary-color)] text-white"
                  : "border border-gray-200 bg-white text-[var(--secondary-color)] hover:border-[var(--primary-color)]"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
