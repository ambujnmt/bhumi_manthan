"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiDownload } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";
import {
    cancelLeadSale,
    downloadLeadSales,
    getLeadRevenue,
    getLeadSaleOptions,
    getLeadSales,
    markLeadSalePaid,
    saveLeadPrices,
} from "../../../utils/adminFetchApi";
import RevenueChart, { BreakdownBars, formatINR } from "./RevenueChart";

const TABS = [
    { key: "revenue", label: "Revenue" },
    { key: "sales", label: "Sales" },
    { key: "pricing", label: "Pricing" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_STYLES = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    cancelled: "bg-gray-200 text-gray-600",
};

const inputClass =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "-";

// Change vs previous period: "+12% vs yesterday"
const change = (current, previous, label) => {
    if (!previous) return current > 0 ? `New vs ${label}` : `Same as ${label}`;

    const percent = Math.round(((current - previous) / previous) * 100);

    return `${percent >= 0 ? "+" : ""}${percent}% vs ${label}`;
};

function StatTile({ label, value, sub, hint }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#62748E]">{label}</p>
            <p className="mb-0 text-2xl font-bold tabular-nums text-[#1A1F36]">{value}</p>
            {sub && <p className="mb-0 mt-1 text-xs text-[#62748E]">{sub}</p>}
            {hint && <p className="mb-0 mt-0.5 text-[11px] text-[#94A3B8]">{hint}</p>}
        </div>
    );
}

/* ==================================================================
   REVENUE TAB
================================================================== */
function RevenueTab() {
    const now = new Date();
    const [period, setPeriod] = useState("daily");
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getLeadRevenue({ period, year, month })
            .then((res) => !cancelled && setData(res?.data || null))
            .catch((error) => {
                if (cancelled) return;
                setData(null);
                showToast(error?.message || "Unable to load revenue.", "error");
            })
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [period, year, month]);

    const summary = data?.summary;
    const years = useMemo(() => {
        const list = [];
        for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y -= 1) list.push(y);
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const chartTitle =
        period === "daily"
            ? `Daily revenue · ${MONTHS[month - 1]} ${year}`
            : period === "monthly"
                ? `Monthly revenue · ${year}`
                : "Yearly revenue";

    return (
        <div className="space-y-4">
            {/* Headline tiles */}
            {summary ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <StatTile
                        label="Today"
                        value={formatINR(summary.today.amount)}
                        sub={`${summary.today.count} leads sold`}
                        hint={change(summary.today.amount, summary.yesterday.amount, "yesterday")}
                    />
                    <StatTile
                        label="This Month"
                        value={formatINR(summary.this_month.amount)}
                        sub={`${summary.this_month.count} leads sold`}
                        hint={change(summary.this_month.amount, summary.last_month.amount, "last month")}
                    />
                    <StatTile label="This Year" value={formatINR(summary.this_year.amount)} sub={`${summary.this_year.count} leads sold`} />
                    <StatTile label="All Time" value={formatINR(summary.all_time.amount)} sub={`${summary.all_time.count} leads sold`} />
                    <StatTile label="Pending" value={formatINR(summary.pending.amount)} sub={`${summary.pending.count} sales waiting`} />
                    <StatTile
                        label="Leads Sold"
                        value={`${summary.leads_sold} / ${summary.leads_total}`}
                        sub={summary.leads_total ? `${Math.round((summary.leads_sold / summary.leads_total) * 100)}% of all leads` : "No leads yet"}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <div key={key} className="h-[104px] animate-pulse rounded-xl bg-white shadow-sm" />
                    ))}
                </div>
            )}

            {/* Filters: one row above the charts */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-gray-200 bg-white p-0.5" role="tablist" aria-label="Report period">
                    {[
                        ["daily", "Daily"],
                        ["monthly", "Monthly"],
                        ["yearly", "Yearly"],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={period === key}
                            onClick={() => setPeriod(key)}
                            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${period === key ? "bg-[#E87722] text-white" : "text-[#62748E] hover:text-[#1A1F36]"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {period === "daily" && (
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Month" className={inputClass}>
                        {MONTHS.map((name, index) => (
                            <option key={name} value={index + 1}>{name}</option>
                        ))}
                    </select>
                )}

                {period !== "yearly" && (
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year" className={inputClass}>
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                )}

                {loading && <Spinner size="sm" />}

                {data?.range && (
                    <p className="mb-0 ml-auto text-sm text-[#62748E]">
                        Total <span className="font-semibold text-[#1A1F36]">{formatINR(data.range.amount)}</span>
                        {" · "}{data.range.count} leads sold
                        {data.range.count > 0 && ` · avg ${formatINR(data.range.average)}`}
                    </p>
                )}
            </div>

            <RevenueChart
                series={data?.series || []}
                title={chartTitle}
                periodLabel={period === "daily" ? "day" : period === "monthly" ? "month" : "year"}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BreakdownBars title="By lead type" rows={data?.by_type || []} empty="No paid sales in this period" />
                <BreakdownBars title="By payment method" rows={data?.by_method || []} empty="No paid sales in this period" />
            </div>

            {/* Top buyers */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-[#1A1F36]">Top buyers (this period)</p>
                {(data?.top_buyers || []).length === 0 ? (
                    <p className="mb-0 py-6 text-center text-sm text-[#94A3B8]">No paid sales in this period</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-[#62748E]">
                            <tr>
                                <th className="px-2 py-1.5">#</th>
                                <th className="px-2 py-1.5">Seller / Broker</th>
                                <th className="px-2 py-1.5 text-right">Leads bought</th>
                                <th className="px-2 py-1.5 text-right">Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.top_buyers.map((buyer, index) => (
                                <tr key={buyer.id} className="border-t border-gray-100">
                                    <td className="px-2 py-1.5 text-[#94A3B8]">{index + 1}</td>
                                    <td className="px-2 py-1.5 text-[#1A1F36]">
                                        {buyer.name}
                                        {buyer.role && <span className="ml-1.5 text-xs capitalize text-[#62748E]">({buyer.role})</span>}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-[#62748E]">{buyer.count}</td>
                                    <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-[#1A1F36]">{formatINR(buyer.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

/* ==================================================================
   SALES TAB
================================================================== */
function SalesTab({ canEdit, paymentMethods }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(12);

    // { type: "paid" | "cancel", sale }
    const [modal, setModal] = useState(null);
    const [method, setMethod] = useState("upi");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getLeadSales({ status, from, to })
            .then((res) => !cancelled && setSales(Array.isArray(res?.data?.sales) ? res.data.sales : []))
            .catch((error) => {
                if (cancelled) return;
                setSales([]);
                showToast(error?.message || "Unable to load sales.", "error");
            })
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [status, from, to]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return sales;

        return sales.filter((sale) =>
            [sale.sale_no, sale.buyer?.name, sale.buyer?.phone, sale.lead?.name, sale.lead?.phone, sale.lead?.target, sale.payment_reference]
                .join(" ")
                .toLowerCase()
                .includes(term)
        );
    }, [sales, search]);

    const totals = useMemo(() => ({
        paid: filtered.filter((sale) => sale.payment_status === "paid").reduce((sum, sale) => sum + sale.amount, 0),
        pending: filtered.filter((sale) => sale.payment_status === "pending").reduce((sum, sale) => sum + sale.amount, 0),
    }), [filtered]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const pageItems = filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

    const tableProps = {
        pageCount,
        pageOptions: Array.from({ length: pageCount }),
        state: { pageIndex, pageSize },
        gotoPage: (page) => setPageIndex(page),
        setPageSize: (size) => {
            setPageSize(size);
            setPageIndex(0);
        },
    };

    const openModal = (type, sale) => {
        setModal({ type, sale });
        setMethod("upi");
        setReference(sale.payment_reference || "");
        setNote("");
    };

    const confirmModal = async () => {
        if (!modal) return;

        setSaving(true);

        try {
            const res = modal.type === "paid"
                ? await markLeadSalePaid(modal.sale.id, { payment_method: method, payment_reference: reference.trim() || null })
                : await cancelLeadSale(modal.sale.id, note.trim());

            const saved = res?.data?.sale;
            if (saved) setSales((prev) => prev.map((sale) => (sale.id === saved.id ? saved : sale)));
            showToast(res?.message || "Sale updated.");
            setModal(null);
        } catch (error) {
            showToast(error?.message || "Something went wrong.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Download the filtered sales (same filters + search as on screen): "csv" | "xlsx"
    const [downloading, setDownloading] = useState("");

    const downloadSales = async (format) => {
        setDownloading(format);

        try {
            const fileName = await downloadLeadSales({ format, status, from, to, q: search.trim() });
            showToast(`Downloaded ${fileName}`);
        } catch (error) {
            showToast(error?.message || "Download failed. Please try again.", "error");
        } finally {
            setDownloading("");
        }
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    placeholder="Search sale no, buyer, lead..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className={`${inputClass} w-full sm:w-64`}
                />
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPageIndex(0); }} aria-label="Payment status" className={inputClass}>
                    <option value="">All statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[#62748E]">
                    From
                    <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPageIndex(0); }} className={inputClass} />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#62748E]">
                    To
                    <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPageIndex(0); }} className={inputClass} />
                </label>
                <div className="ml-auto flex gap-2">
                    <button
                        type="button"
                        onClick={() => downloadSales("csv")}
                        disabled={filtered.length === 0 || Boolean(downloading)}
                        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-[#001737] bg-white px-4 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        {downloading === "csv" ? <Spinner size="sm" /> : <FiDownload size={15} />} Download CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadSales("xlsx")}
                        disabled={filtered.length === 0 || Boolean(downloading)}
                        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-[#001737] px-4 text-sm font-semibold text-white transition hover:bg-[#283A86] disabled:opacity-50"
                    >
                        {downloading === "xlsx" ? <Spinner size="sm" color="white" /> : <FiDownload size={15} />} Download Excel
                    </button>
                </div>
            </div>

            {!loading && (
                <p className="mb-2 text-sm text-[#62748E]">
                    {filtered.length} sales · Paid <span className="font-semibold text-[#1A1F36]">{formatINR(totals.paid)}</span>
                    {totals.pending > 0 && <> · Pending <span className="font-semibold text-[#1A1F36]">{formatINR(totals.pending)}</span></>}
                </p>
            )}

            {/* Sales as cards */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <div key={key} className="h-[230px] animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
                    ))}
                </div>
            ) : pageItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {pageItems.map((sale) => (
                        <div
                            key={sale.id}
                            className={`flex flex-col rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
                                sale.payment_status === "cancelled" ? "border-gray-200 opacity-75" : "border-gray-100"
                            }`}
                        >
                            {/* Header: sale no + status */}
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
                                <span className="font-mono text-xs font-semibold text-[#1A1F36]">{sale.sale_no}</span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[sale.payment_status] || ""}`}>
                                    {sale.payment_status}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col px-4 py-3">
                                {/* Amount + lead type */}
                                <div className="flex items-end justify-between gap-2">
                                    <p className={`mb-0 text-2xl font-bold tabular-nums ${sale.payment_status === "cancelled" ? "text-[#94A3B8] line-through" : "text-[#1A1F36]"}`}>
                                        {formatINR(sale.amount)}
                                    </p>
                                    <span className="mb-1 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-[#C2410C]">
                                        {sale.lead_type_label}
                                    </span>
                                </div>

                                {/* Lead -> buyer */}
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">Lead</p>
                                        <p className="mb-0 truncate font-medium text-[#1A1F36]" title={sale.lead?.name || ""}>{sale.lead?.name || "-"}</p>
                                        <p className="mb-0 truncate text-xs text-[#62748E]" title={sale.lead?.target || ""}>{sale.lead?.target || "-"}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">Sold To</p>
                                        <p className="mb-0 truncate font-medium text-[#1A1F36]" title={sale.buyer?.name || ""}>{sale.buyer?.name || "-"}</p>
                                        <p className="mb-0 truncate text-xs capitalize text-[#62748E]">
                                            {[sale.buyer?.role, sale.buyer?.phone].filter(Boolean).join(" · ") || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment + dates */}
                                <div className="mt-3 space-y-0.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#62748E]">
                                    <p className="mb-0">
                                        <span className="text-[#94A3B8]">Payment: </span>
                                        {sale.payment_method_label || "-"}
                                        {sale.payment_reference && <span className="font-mono"> · {sale.payment_reference}</span>}
                                    </p>
                                    <p className="mb-0">
                                        <span className="text-[#94A3B8]">Sold: </span>
                                        {formatDate(sale.created_at)}
                                        {sale.sold_by && ` by ${sale.sold_by}`}
                                    </p>
                                    {sale.paid_at && (
                                        <p className="mb-0">
                                            <span className="text-[#94A3B8]">Paid: </span>
                                            {formatDate(sale.paid_at)}
                                        </p>
                                    )}
                                    {sale.cancelled_at && (
                                        <p className="mb-0">
                                            <span className="text-[#94A3B8]">Cancelled: </span>
                                            {formatDate(sale.cancelled_at)}
                                        </p>
                                    )}
                                </div>

                                {sale.note && (
                                    <p className="mb-0 mt-2 line-clamp-2 whitespace-pre-line text-xs text-[#62748E]" title={sale.note}>
                                        <span className="font-semibold text-[#1A1F36]">Note: </span>
                                        {sale.note}
                                    </p>
                                )}

                                {/* Actions */}
                                {canEdit && sale.payment_status !== "cancelled" && (
                                    <div className="mt-auto flex gap-2 pt-3">
                                        {sale.payment_status === "pending" && (
                                            <button
                                                type="button"
                                                onClick={() => openModal("paid", sale)}
                                                className="h-9 flex-1 rounded-lg bg-green-600 text-xs font-semibold text-white transition hover:bg-green-700"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => openModal("cancel", sale)}
                                            className="h-9 flex-1 rounded-lg border border-red-600 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                        >
                                            {sale.payment_status === "paid" ? "Refund / Cancel" : "Cancel"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center text-[#62748E]">
                    No lead sales yet. Sell a lead from the Leads page.
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={[
                            { text: "12", value: 12 },
                            { text: "24", value: 24 },
                            { text: "48", value: 48 },
                        ]}
                    />
                </div>
            )}

            <Tmodal
                isOpen={Boolean(modal)}
                onClose={() => !saving && setModal(null)}
                title={modal?.type === "paid" ? "Mark Payment Received" : "Cancel Sale"}
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setModal(null)} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={confirmModal}
                            disabled={saving}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white ${modal?.type === "paid" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            {saving && <Spinner size="sm" color="white" />}
                            {modal?.type === "paid" ? "Mark Paid" : "Cancel Sale"}
                        </button>
                    </div>
                }
            >
                {modal && (
                    <div className="space-y-3">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm">
                            <p className="mb-0 font-semibold text-[#1A1F36]">{modal.sale.sale_no} · {formatINR(modal.sale.amount)}</p>
                            <p className="mb-0 text-xs text-[#62748E]">{modal.sale.lead?.name} → {modal.sale.buyer?.name}</p>
                        </div>

                        {modal.type === "paid" ? (
                            <>
                                <label className="block text-sm font-medium text-[#1A1F36]">
                                    Payment Method<span className="text-red-500"> *</span>
                                    <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputClass} mt-1 w-full`}>
                                        {Object.entries(paymentMethods || {}).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-[#1A1F36]">
                                    Reference / Txn ID
                                    <input value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} className={`${inputClass} mt-1 w-full`} />
                                </label>
                                <p className="mb-0 text-xs text-[#62748E]">Counts in today&apos;s revenue, and the buyer gets the lead.</p>
                            </>
                        ) : (
                            <>
                                <label className="block text-sm font-medium text-[#1A1F36]">
                                    Reason (optional)
                                    <textarea rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#E87722]" />
                                </label>
                                <p className="mb-0 text-xs text-red-600">
                                    {modal.sale.payment_status === "paid"
                                        ? "The amount is removed from revenue and the buyer loses access to this lead."
                                        : "The pending sale is closed."}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </Tmodal>
        </div>
    );
}

/* ==================================================================
   PRICING TAB
================================================================== */
function PricingTab({ options, canEdit, onSaved }) {
    const [prices, setPrices] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (options?.prices) setPrices(Object.fromEntries(Object.entries(options.prices).map(([key, value]) => [key, String(value)])));
    }, [options]);

    const save = async () => {
        setSaving(true);

        try {
            const res = await saveLeadPrices(Object.fromEntries(Object.entries(prices).map(([key, value]) => [key, Number(value)])));
            showToast(res?.message || "Prices saved.");
            onSaved(res?.data?.prices);
        } catch (error) {
            showToast(error?.message || "Unable to save prices.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!options) {
        return <div className="flex justify-center py-16"><Spinner /></div>;
    }

    return (
        <div className="max-w-xl rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[#1A1F36]">Default price per lead</p>
            <p className="mb-4 text-xs text-[#62748E]">Filled in when you sell a lead. You can still change the price on each sale.</p>

            <div className="space-y-3">
                {Object.entries(options.lead_types || {}).map(([type, label]) => (
                    <label key={type} className="flex items-center justify-between gap-4 text-sm text-[#1A1F36]">
                        <span className="font-medium">{label} lead</span>
                        <span className="flex items-center gap-1.5">
                            ₹
                            <input
                                type="number"
                                min="0"
                                step="1"
                                disabled={!canEdit}
                                value={prices[type] ?? ""}
                                onChange={(e) => setPrices((prev) => ({ ...prev, [type]: e.target.value }))}
                                className={`${inputClass} w-32 text-right tabular-nums disabled:bg-gray-50`}
                            />
                        </span>
                    </label>
                ))}
            </div>

            {canEdit && (
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="mt-5 flex items-center gap-2 rounded-lg bg-[#E87722] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d96818] disabled:opacity-60"
                >
                    {saving && <Spinner size="sm" color="white" />}
                    Save Prices
                </button>
            )}
        </div>
    );
}

export default function LeadRevenue() {
    const can = useAdminPermission();
    const canEdit = can("lead_sales.edit");
    const [tab, setTab] = useState("revenue");
    const [options, setOptions] = useState(null);

    useEffect(() => {
        getLeadSaleOptions()
            .then((res) => setOptions(res?.data || null))
            .catch(() => setOptions(null));
    }, []);

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Lead Revenue", active: true },
                ]}
                title="Lead Sales & Revenue"
            />

            <p className="mt-1 mb-0 text-sm text-[#62748E]">
                Money from leads sold to sellers and brokers. Only paid sales count as revenue (India time).
            </p>

            <div className="scrollbar-hide mt-4 mb-4 flex gap-1 overflow-x-auto border-b border-gray-200">
                {TABS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setTab(item.key)}
                        className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                            tab === item.key ? "border-[#E87722] text-[#E87722]" : "border-transparent text-[#62748E] hover:text-[#1A1F36]"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === "revenue" && <RevenueTab />}
            {tab === "sales" && <SalesTab canEdit={canEdit} paymentMethods={options?.payment_methods} />}
            {tab === "pricing" && (
                <PricingTab
                    options={options}
                    canEdit={canEdit}
                    onSaved={(prices) => prices && setOptions((prev) => ({ ...prev, prices }))}
                />
            )}
        </div>
    );
}
