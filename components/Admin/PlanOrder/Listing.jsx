"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FiCheck, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { FaRupeeSign, FaClock, FaCalendarAlt, FaCrown } from "react-icons/fa";
import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import { actionButtonClass, dangerActionButtonClass } from "../actionButtonClass";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";
import {
    cancelAdminPlanOrder,
    getAdminPlanOrders,
    getPlanOrderOptions,
    markPlanOrderPaid,
    recordPlanPayment,
} from "../../../utils/adminFetchApi";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-[#283A86]";

const STATUS_STYLES = {
    pending: "bg-orange-100 text-[#c25e12]",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-600",
    expired: "bg-red-100 text-red-700",
};

const PERIOD_LABELS = { month: "Monthly", year: "Yearly", free: "Free", one_time: "One Time" };

const inr = (value) =>
    Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const formatDate = (value, withTime = false) =>
    value
        ? new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        })
        : "-";

const today = () => new Date().toISOString().slice(0, 10);

const emptyPayment = { payment_method: "cash", payment_reference: "", paid_at: "", admin_note: "" };

function StatCard({ icon: Icon, label, value, sub, tone = "orange" }) {
    const tones = {
        orange: "bg-orange-50 text-[#E87722]",
        green: "bg-green-50 text-green-600",
        navy: "bg-[#EEF2FB] text-[#283A86]",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                <Icon size={18} />
            </span>
            <div className="min-w-0">
                <p className="mb-0 text-xs text-[#62748E]">{label}</p>
                <p className="mb-0 truncate text-[20px] font-extrabold leading-tight text-[#1A1F36]">{value}</p>
                {sub && <p className="mb-0 text-[11px] text-[#62748E]">{sub}</p>}
            </div>
        </div>
    );
}

// Last 6 months collection (simple bars, value on hover + below)
function MonthlyChart({ months }) {
    const max = Math.max(...months.map((item) => item.total), 1);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#283A86]">Collection · Last 6 Months</h3>
            <div className="flex h-40 items-end gap-3">
                {months.map((item) => (
                    <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="text-[10px] font-semibold text-[#1A1F36]">{item.total > 0 ? inr(item.total) : ""}</span>
                        <div
                            title={`${item.month}: ${inr(item.total)}`}
                            className="w-full max-w-[44px] rounded-t-md bg-[#E87722] transition-all"
                            style={{ height: `${Math.max((item.total / max) * 100, item.total > 0 ? 4 : 1)}%`, opacity: item.total > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-[11px] text-[#62748E]">{item.month.split(" ")[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MethodBreakdown({ items, total }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#283A86]">By Payment Method</h3>
            {items.length === 0 ? (
                <p className="mb-0 py-8 text-center text-sm text-[#62748E]">No payment received yet.</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => {
                        const share = total > 0 ? Math.round((item.total / total) * 100) : 0;

                        return (
                            <li key={item.method}>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-[#1A1F36]">{item.label}</span>
                                    <span className="text-[#62748E]">
                                        <b className="text-[#1A1F36]">{inr(item.total)}</b> · {item.orders} {item.orders === 1 ? "order" : "orders"}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-[#283A86]" style={{ width: `${share}%` }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function Listing() {
    const can = useAdminPermission();
    const canEdit = can("plans.edit");

    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(null);
    const [methods, setMethods] = useState({});
    const [loading, setLoading] = useState(true);

    // Filters
    const [status, setStatus] = useState("");
    const [method, setMethod] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [search, setSearch] = useState("");

    // Mark paid / cancel
    const [payOrder, setPayOrder] = useState(null);
    const [payment, setPayment] = useState(emptyPayment);
    const [cancelOrder, setCancelOrder] = useState(null);
    const [cancelNote, setCancelNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");

    // Record payment (office cash)
    const [recordOpen, setRecordOpen] = useState(false);
    const [options, setOptions] = useState({ users: [], plans: [] });
    const [record, setRecord] = useState({ user_id: "", plan_id: "", amount: "", ...emptyPayment });
    const [userSearch, setUserSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const res = await getAdminPlanOrders({ status, method, from, to });
            setOrders(res.data.orders || []);
            setSummary(res.data.summary || null);
            setMethods(res.data.payment_methods || {});
        } catch (error) {
            showToast(error?.message || "Failed to load plan orders.", "error");
        } finally {
            setLoading(false);
        }
    }, [status, method, from, to]);

    useEffect(() => {
        load();
    }, [load]);

    const term = search.trim().toLowerCase();
    const visibleOrders = useMemo(
        () =>
            orders.filter(
                (order) =>
                    !term ||
                    [order.order_no, order.plan_name, order.user?.name, order.user?.email, order.user?.phone, order.payment_reference]
                        .some((value) => String(value || "").toLowerCase().includes(term))
            ),
        [orders, term]
    );

    const filteredTotal = visibleOrders
        .filter((order) => ["paid", "expired"].includes(order.status))
        .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const methodLabel = (value) => methods[value] || (value === "free" ? "Free" : value || "-");

    /* ---------- Mark paid ---------- */
    const openPay = (order) => {
        setPayOrder(order);
        setPayment({ ...emptyPayment, payment_method: methods[order.payment_method] ? order.payment_method : "cash", payment_reference: order.payment_reference || "", paid_at: today() });
        setModalError("");
    };

    const handleMarkPaid = async () => {
        setSaving(true);
        setModalError("");

        try {
            const res = await markPlanOrderPaid(payOrder.id, payment);
            showToast(res.message);
            setPayOrder(null);
            load();
        } catch (error) {
            setModalError(error?.message || "Failed to mark as paid.");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Cancel ---------- */
    const handleCancel = async () => {
        setSaving(true);
        setModalError("");

        try {
            const res = await cancelAdminPlanOrder(cancelOrder.id, { admin_note: cancelNote });
            showToast(res.message);
            setCancelOrder(null);
            load();
        } catch (error) {
            setModalError(error?.message || "Failed to cancel the order.");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Record payment ---------- */
    const openRecord = async () => {
        setRecord({ user_id: "", plan_id: "", amount: "", ...emptyPayment, paid_at: today() });
        setUserSearch("");
        setModalError("");
        setRecordOpen(true);

        try {
            const res = await getPlanOrderOptions();
            setOptions({ users: res.data.users || [], plans: res.data.plans || [] });
        } catch (error) {
            setModalError(error?.message || "Failed to load sellers and plans.");
        }
    };

    const selectedPlan = options.plans.find((plan) => String(plan.id) === record.plan_id);

    const handleRecord = async () => {
        if (!record.user_id || !record.plan_id) {
            setModalError("Please select a seller / broker and a plan.");
            return;
        }

        setSaving(true);
        setModalError("");

        try {
            const res = await recordPlanPayment({
                ...record,
                user_id: Number(record.user_id),
                plan_id: Number(record.plan_id),
                amount: record.amount === "" ? undefined : Number(record.amount),
            });
            showToast(res.message);
            setRecordOpen(false);
            load();
        } catch (error) {
            setModalError(error?.message || "Failed to record the payment.");
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = options.users.filter((user) => {
        const q = userSearch.trim().toLowerCase();
        return !q || [user.name, user.email, user.phone].some((value) => String(value || "").toLowerCase().includes(q));
    });

    const paymentFields = (value, onChange, idPrefix) => (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor={`${idPrefix}_method`} className={labelClass}>
                        Payment Method<span className="ml-1 text-red-500">*</span>
                    </label>
                    <select
                        id={`${idPrefix}_method`}
                        value={value.payment_method}
                        onChange={(e) => onChange({ ...value, payment_method: e.target.value })}
                        className={inputClass}
                    >
                        {Object.entries(methods).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor={`${idPrefix}_paid_at`} className={labelClass}>Payment Date</label>
                    <input
                        id={`${idPrefix}_paid_at`}
                        type="date"
                        max={today()}
                        value={value.paid_at}
                        onChange={(e) => onChange({ ...value, paid_at: e.target.value })}
                        className={inputClass}
                    />
                </div>
            </div>
            <div>
                <label htmlFor={`${idPrefix}_reference`} className={labelClass}>Receipt / UPI / Cheque No.</label>
                <input
                    id={`${idPrefix}_reference`}
                    value={value.payment_reference}
                    onChange={(e) => onChange({ ...value, payment_reference: e.target.value })}
                    maxLength={255}
                    placeholder="e.g. RCPT-1023"
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}_note`} className={labelClass}>Admin Note</label>
                <textarea
                    id={`${idPrefix}_note`}
                    rows={2}
                    value={value.admin_note}
                    onChange={(e) => onChange({ ...value, admin_note: e.target.value })}
                    maxLength={1000}
                    className={`${inputClass} resize-none`}
                />
            </div>
        </>
    );

    const modalFooter = (onCancel, onConfirm, confirmText, danger = false) => (
        <div className="flex gap-3">
            <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                Close
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white disabled:opacity-70 ${danger ? "bg-red-600" : "bg-[rgb(232,119,34)]"}`}
            >
                {saving && <Spinner size="sm" color="white" />}
                {confirmText}
            </button>
        </div>
    );

    const errorBox = modalError && (
        <p role="alert" className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{modalError}</p>
    );

    return (
        <div className="pb-5">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Plan Orders", active: true },
                ]}
                title="Plan Orders & Cash Flow"
            />

            {/* Cash flow cards */}
            {summary && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={FaRupeeSign} tone="green" label="Total Collected" value={inr(summary.total_collected)} sub={`${summary.paid_count} paid orders`} />
                    <StatCard icon={FaCalendarAlt} tone="orange" label="This Month" value={inr(summary.this_month)} sub={`Last month ${inr(summary.last_month)}`} />
                    <StatCard icon={FaClock} tone="amber" label="Pending Payments" value={inr(summary.pending_amount)} sub={`${summary.pending_count} ${summary.pending_count === 1 ? "request" : "requests"} waiting`} />
                    <StatCard icon={FaCrown} tone="navy" label="Active Plans" value={summary.active_plans} sub="Sellers / brokers on a plan" />
                </div>
            )}

            {summary && (
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <MonthlyChart months={summary.months || []} />
                    <MethodBreakdown items={summary.by_method || []} total={summary.total_collected} />
                </div>
            )}

            {/* Filters */}
            <div className="mt-6 mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
                        {[["", "All"], ["pending", "Pending"], ["paid", "Paid"], ["expired", "Expired"], ["cancelled", "Cancelled"]].map(([value, label]) => (
                            <button
                                key={value || "all"}
                                type="button"
                                onClick={() => setStatus(value)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${status === value ? "bg-[#E87722] text-white" : "text-[#62748E] hover:text-[#E87722]"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <select
                        aria-label="Payment method"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E87722]"
                    >
                        <option value="">All methods</option>
                        {Object.entries(methods).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                        <option value="free">Free</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-[#62748E]">
                        From
                        <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-[#E87722]" />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[#62748E]">
                        To
                        <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm outline-none focus:border-[#E87722]" />
                    </label>
                    {(from || to || method) && (
                        <button
                            type="button"
                            onClick={() => { setFrom(""); setTo(""); setMethod(""); }}
                            className="h-10 rounded-lg px-3 text-xs font-semibold text-[#E87722]"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search order, name, phone..."
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#E87722] sm:w-64"
                        />
                    </div>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={openRecord}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                        >
                            <FiPlus size={16} /> Record Payment
                        </button>
                    )}
                </div>
            </div>

            {/* Orders (6 columns, long text wraps / truncates so the table fits) */}
            <div className="w-full overflow-x-auto rounded-xl bg-white shadow">
                <table className="w-full min-w-[760px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[24%]" />
                        <col className="w-[17%]" />
                        <col className="w-[20%]" />
                        <col className="w-[13%]" />
                        {canEdit && <col className="w-[11%]" />}
                    </colgroup>
                    <thead className="bg-gray-100 text-xs uppercase tracking-wide text-[#62748E]">
                        <tr>
                            <th className="px-3 py-3 text-left font-semibold">Order</th>
                            <th className="px-3 py-3 text-left font-semibold">Seller / Broker</th>
                            <th className="px-3 py-3 text-left font-semibold">Plan &amp; Amount</th>
                            <th className="px-3 py-3 text-left font-semibold">Payment &amp; Validity</th>
                            <th className="px-3 py-3 text-left font-semibold">Status</th>
                            {canEdit && <th className="px-3 py-3 text-left font-semibold">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5}>
                                    <div className="flex items-center justify-center py-16"><Spinner size="md" /></div>
                                </td>
                            </tr>
                        ) : visibleOrders.length === 0 ? (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5} className="py-10 text-center text-gray-500">
                                    No plan orders found.
                                </td>
                            </tr>
                        ) : (
                            visibleOrders.map((order) => (
                                <tr key={order.id} className={`border-t align-top ${order.status === "pending" ? "bg-orange-50/40" : ""}`}>
                                    {/* Order */}
                                    <td className="px-3 py-3">
                                        <p className="mb-0 truncate font-semibold text-[#1A1F36]" title={order.order_no}>{order.order_no}</p>
                                        <p className="mb-0 mt-0.5 text-xs text-[#62748E]">{formatDate(order.created_at, true)}</p>
                                    </td>

                                    {/* Seller / broker */}
                                    <td className="px-3 py-3">
                                        <p className="mb-0 flex min-w-0 items-center gap-1.5 font-medium text-[#1A1F36]">
                                            <span className="truncate" title={order.user?.name}>{order.user?.name || "-"}</span>
                                            {order.user?.role && (
                                                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[#62748E]">{order.user.role}</span>
                                            )}
                                        </p>
                                        {order.user?.phone && <p className="mb-0 mt-0.5 truncate text-xs text-[#62748E]">{order.user.phone}</p>}
                                        {order.user?.email && <p className="mb-0 truncate text-xs text-[#62748E]" title={order.user.email}>{order.user.email}</p>}
                                        {order.note && (
                                            <p className="mb-0 mt-1 line-clamp-2 break-words text-xs italic text-[#62748E]" title={order.note}>&ldquo;{order.note}&rdquo;</p>
                                        )}
                                    </td>

                                    {/* Plan + amount */}
                                    <td className="px-3 py-3">
                                        <p className="mb-0 truncate font-medium text-[#1A1F36]" title={order.plan_name}>{order.plan_name}</p>
                                        <p className="mb-0 mt-0.5 text-xs text-[#62748E]">{PERIOD_LABELS[order.billing_period] || order.billing_period}</p>
                                        <p className="mb-0 mt-1 text-[15px] font-extrabold text-[#1A1F36]">{inr(order.amount)}</p>
                                    </td>

                                    {/* Payment + validity */}
                                    <td className="px-3 py-3 text-xs text-[#62748E]">
                                        <p className="mb-0 text-sm font-medium text-[#1A1F36]">{methodLabel(order.payment_method)}</p>
                                        {order.payment_reference && (
                                            <p className="mb-0 mt-0.5 truncate" title={order.payment_reference}>Ref: {order.payment_reference}</p>
                                        )}
                                        {order.paid_at && <p className="mb-0 mt-0.5">Paid {formatDate(order.paid_at)}</p>}
                                        {["paid", "expired"].includes(order.status) && (
                                            <p className={`mb-0 mt-0.5 ${order.status === "expired" ? "font-semibold text-red-600" : ""}`}>
                                                {order.expires_at
                                                    ? `${order.status === "expired" ? "Expired" : "Valid"} ${formatDate(order.starts_at)} – ${formatDate(order.expires_at)}`
                                                    : "No expiry"}
                                            </p>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 py-3">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] || ""}`}>
                                            {order.status}
                                        </span>
                                        {order.processed_by && (
                                            <p className="mb-0 mt-1 truncate text-[11px] text-[#62748E]" title={order.processed_by}>by {order.processed_by}</p>
                                        )}
                                    </td>

                                    {/* Action */}
                                    {canEdit && (
                                        <td className="px-3 py-3">
                                            {order.status === "pending" ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Tooltip content="Mark as Paid (activates the plan)">
                                                        <button type="button" onClick={() => openPay(order)} className={actionButtonClass} aria-label={`Mark ${order.order_no} as paid`}>
                                                            <FiCheck size={16} />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content="Cancel Request">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCancelOrder(order); setCancelNote(""); setModalError(""); }}
                                                            className={dangerActionButtonClass}
                                                            aria-label={`Cancel ${order.order_no}`}
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {!loading && visibleOrders.some((order) => ["paid", "expired"].includes(order.status)) && (
                        <tfoot>
                            <tr className="border-t-2 bg-gray-50">
                                <td colSpan={2} className="px-3 py-3 text-right text-xs font-semibold uppercase text-[#62748E]">Paid total (this list)</td>
                                <td className="px-3 py-3 text-[15px] font-extrabold text-green-700">{inr(filteredTotal)}</td>
                                <td colSpan={canEdit ? 3 : 2} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Mark Paid Modal */}
            <Tmodal
                isOpen={Boolean(payOrder)}
                onClose={() => !saving && setPayOrder(null)}
                size="lg"
                title="Confirm Payment"
                footer={modalFooter(() => setPayOrder(null), handleMarkPaid, "Mark as Paid")}
            >
                {payOrder && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                            <p className="mb-0"><b>{payOrder.order_no}</b> · {payOrder.user?.name}</p>
                            <p className="mb-0 mt-0.5 text-[#62748E]">
                                {payOrder.plan_name} ({PERIOD_LABELS[payOrder.billing_period] || payOrder.billing_period}) · <b className="text-[#1A1F36]">{inr(payOrder.amount)}</b>
                            </p>
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">The plan becomes active for this user as soon as you confirm.</p>
                        </div>
                        {paymentFields(payment, setPayment, "pay")}
                        {errorBox}
                    </div>
                )}
            </Tmodal>

            {/* Cancel Modal */}
            <Tmodal
                isOpen={Boolean(cancelOrder)}
                onClose={() => !saving && setCancelOrder(null)}
                title="Cancel Plan Request"
                footer={modalFooter(() => setCancelOrder(null), handleCancel, "Cancel Request", true)}
            >
                {cancelOrder && (
                    <div className="space-y-4">
                        <p className="mb-0 text-gray-600">
                            Cancel <b className="text-gray-900">{cancelOrder.order_no}</b> ({cancelOrder.plan_name}, {inr(cancelOrder.amount)}) of{" "}
                            <b className="text-gray-900">{cancelOrder.user?.name}</b>? No plan will be given.
                        </p>
                        <div>
                            <label htmlFor="cancel_note" className={labelClass}>Reason (optional)</label>
                            <textarea id="cancel_note" rows={2} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} maxLength={1000} className={`${inputClass} resize-none`} />
                        </div>
                        {errorBox}
                    </div>
                )}
            </Tmodal>

            {/* Record Payment Modal */}
            <Tmodal
                isOpen={recordOpen}
                onClose={() => !saving && setRecordOpen(false)}
                size="2xl"
                title="Record Plan Payment"
                footer={modalFooter(() => setRecordOpen(false), handleRecord, "Save & Activate Plan")}
            >
                <div className="space-y-4">
                    <p className="mb-0 text-xs text-[#62748E]">
                        Use this when a seller / broker pays at the office. The plan is activated at once.
                    </p>

                    {/* Seller / broker */}
                    <div>
                        <label htmlFor="record_user_search" className={labelClass}>
                            Seller / Broker<span className="ml-1 text-red-500">*</span>
                        </label>
                        <div className="relative mt-1.5">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                            <input
                                id="record_user_search"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search name, email or phone..."
                                autoComplete="off"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                        <div role="listbox" aria-label="Select seller or broker" className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-1">
                            {filteredUsers.length === 0 ? (
                                <p className="mb-0 px-3 py-5 text-center text-sm text-[#62748E]">No seller / broker found.</p>
                            ) : (
                                filteredUsers.map((user) => {
                                    const selected = String(user.id) === record.user_id;

                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => setRecord((prev) => ({ ...prev, user_id: String(user.id) }))}
                                            className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${selected ? "bg-orange-50 ring-1 ring-[#E87722]" : "hover:bg-gray-50"}`}
                                        >
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${selected ? "bg-[#E87722] text-white" : "bg-orange-100 text-[#E87722]"}`}>
                                                {(user.name || user.email || "?").trim().charAt(0)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-[#1A1F36]">
                                                    {user.name} <span className="ml-1 text-[10px] font-semibold capitalize text-[#62748E]">{user.role}</span>
                                                </span>
                                                <span className="block truncate text-xs text-[#62748E]">{[user.phone, user.email].filter(Boolean).join(" · ")}</span>
                                            </span>
                                            {selected && <FiCheck className="shrink-0 text-[#E87722]" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Plan */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="record_plan" className={labelClass}>
                                Plan<span className="ml-1 text-red-500">*</span>
                            </label>
                            <select
                                id="record_plan"
                                value={record.plan_id}
                                onChange={(e) => {
                                    const plan = options.plans.find((item) => String(item.id) === e.target.value);
                                    setRecord((prev) => ({ ...prev, plan_id: e.target.value, amount: plan ? String(Number(plan.price)) : "" }));
                                }}
                                className={inputClass}
                            >
                                <option value="">Select plan</option>
                                {options.plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} · {Number(plan.price) > 0 ? inr(plan.price) : "Free"} ({PERIOD_LABELS[plan.billing_period] || plan.billing_period})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="record_amount" className={labelClass}>Amount Received (₹)</label>
                            <input
                                id="record_amount"
                                type="number"
                                min="0"
                                step="1"
                                value={record.amount}
                                onChange={(e) => setRecord((prev) => ({ ...prev, amount: e.target.value }))}
                                disabled={!selectedPlan || Number(selectedPlan.price) <= 0}
                                className={inputClass}
                            />
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">Plan price by default; change it for a discount.</p>
                        </div>
                    </div>

                    {paymentFields(record, (next) => setRecord((prev) => ({ ...prev, ...next })), "record")}
                    {errorBox}
                </div>
            </Tmodal>
        </div>
    );
}
