import { useEffect, useRef, useState } from "react";
import { getAppointments, updateAppointmentStatus } from "../api";

const STATUS_FILTERS = [
  ["", "All"],
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

const STATUS_BADGES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const ACTIONS = {
  confirmed: { label: "Confirm", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  completed: { label: "Complete", className: "bg-blue-600 text-white hover:bg-blue-700" },
};

export default function AppointmentList({ getBookableUrl }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const load = async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);

    try {
      const result = await getAppointments({ status, search: debouncedSearch, page });
      if (requestId !== latestRequest.current) return;
      setData(result);
      setError("");
    } catch (err) {
      if (requestId === latestRequest.current) setError(err.message);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch, page]);

  const changeStatus = async (id, nextStatus) => {
    setBusyId(id);
    setError("");
    setConfirmCancelId(null);

    try {
      await updateAppointmentStatus(id, nextStatus);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const appointments = data?.appointments || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => { setStatus(value); setPage(1); }}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${status === value ? "bg-[var(--primary-color)] text-white" : "bg-white text-[#62748E] hover:text-[var(--primary-color)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, email or listing"
          aria-label="Search appointments"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] lg:w-80"
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className={`overflow-x-auto rounded-lg border border-gray-200 bg-white transition-opacity ${loading && data ? "opacity-60" : ""}`} aria-busy={loading}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-[#62748E]">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">When</th>
              {data?.can_view_all && <th className="px-4 py-3">Owner</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!data && loading && [...Array(4)].map((_, index) => (
              <tr key={index}>
                <td colSpan={6} className="px-4 py-3"><div className="h-10 animate-pulse rounded bg-gray-100" /></td>
              </tr>
            ))}

            {data && appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#62748E]">
                  {status || debouncedSearch ? "No appointments match this filter." : "No appointments yet. New bookings will appear here."}
                </td>
              </tr>
            )}

            {appointments.map((item) => {
              const url = getBookableUrl?.(item);
              const canCancel = item.allowed_statuses.includes("cancelled");
              const isBusy = busyId === item.id;

              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="mb-0.5 font-semibold text-[#1A1F36]">{item.name}</p>
                    <a href={`tel:${item.phone}`} className="block text-xs text-[#62748E] no-underline hover:text-[var(--primary-color)]">{item.phone}</a>
                    <a href={`mailto:${item.email}`} className="block break-all text-xs text-[#62748E] no-underline hover:text-[var(--primary-color)]">{item.email}</a>
                    {item.message && <p className="mb-0 mt-1 max-w-[240px] whitespace-pre-line break-words text-xs italic text-[#62748E]">{item.message}</p>}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-[#1A1F36]">
                    {url ? <a href={url} target="_blank" rel="noreferrer" className="text-[#1A1F36] no-underline hover:text-[var(--primary-color)] hover:underline">{item.bookable_title}</a> : item.bookable_title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#1A1F36]">{item.time_label}</td>
                  {data.can_view_all && <td className="px-4 py-3 text-[#1A1F36]">{item.owner_name || "-"}</td>}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGES[item.status]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {confirmCancelId === item.id ? (
                        <>
                          <span className="self-center text-xs text-[#62748E]">Cancel this?</span>
                          <button type="button" disabled={isBusy} onClick={() => changeStatus(item.id, "cancelled")} className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">Yes, cancel</button>
                          <button type="button" onClick={() => setConfirmCancelId(null)} className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-[#62748E] hover:bg-gray-50">No</button>
                        </>
                      ) : (
                        <>
                          {item.allowed_statuses.filter((next) => ACTIONS[next]).map((next) => (
                            <button key={next} type="button" disabled={isBusy} onClick={() => changeStatus(item.id, next)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${ACTIONS[next].className}`}>
                              {ACTIONS[next].label}
                            </button>
                          ))}
                          {canCancel && (
                            <button type="button" disabled={isBusy} onClick={() => setConfirmCancelId(item.id)} className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">Cancel</button>
                          )}
                          {item.allowed_statuses.length === 0 && <span className="text-xs text-gray-400">-</span>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[#62748E]">
          <span>{pagination.total} appointments</span>
          <div className="flex items-center gap-3">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
            <span>Page {pagination.current_page} of {pagination.last_page}</span>
            <button type="button" disabled={page >= pagination.last_page || loading} onClick={() => setPage(page + 1)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
