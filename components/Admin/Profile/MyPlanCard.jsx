"use client";

import React, { useState } from "react";
import { FiAward, FiClock, FiExternalLink, FiGift } from "react-icons/fi";

const PERIOD_LABELS = { month: "Monthly", year: "Yearly", free: "Free", one_time: "One Time" };

const ORDER_STATUS = {
    pending: "bg-orange-100 text-[#c25e12]",
    paid: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
};

const inr = (value) =>
    Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

// Whole days left till the end of the expiry date (0 = last day)
const daysLeft = (date) => {
    if (!date) return null;
    const end = new Date(`${date}T23:59:59`);
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000) - 1);
};

function Info({ label, children }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mb-0 mt-0.5 truncate text-sm font-semibold text-[#1A1F36]">{children}</dd>
        </div>
    );
}

/**
 * Profile: plan of a seller / broker (current plan, validity, listings used, plan orders).
 * Staff: plans don't apply (no listing limit).
 */
// data / error come from the profile page (loaded together with the profile, one loader)
export default function MyPlanCard({ cardClass, CardHeader, data = null, error = "" }) {
    const quota = data?.listing_quota;
    const orders = data?.orders || [];
    const pending = orders.find((order) => order.status === "pending");
    const latestPaid = orders.find((order) => ["paid", "expired"].includes(order.status) && order.plan_id === quota?.plan_id);

    const state = !quota
        ? null
        : quota.source === "not_applicable"
            ? "na"
            : quota.source === "promotional"
                ? "promo"
                : quota.source === "offer"
                    ? "offer"
                : quota.source === "plan"
                    ? "active"
                    : quota.plan_expired
                        ? "expired"
                        : "none";


    const [showAll, setShowAll] = useState(false);

    // The user's own plan (shown in "Your Plan" even while an offer runs)
    const planState = !quota?.plan_id ? "none" : quota.plan_expired ? "expired" : "active";
    const planBadge = {
        active: ["Active", "border-green-200 bg-green-50 text-green-700", "bg-green-500"],
        expired: ["Expired", "border-red-200 bg-red-50 text-red-700", "bg-red-500"],
        none: ["No Plan", "border-gray-200 bg-white text-gray-600", "bg-gray-400"],
    }[planState];

    const left = planState === "active" ? daysLeft(quota?.plan_expires_at) : null;
    // Limit 0 with properties listed (e.g. plan expired) = full bar
    const usedPercent = !quota || quota.unlimited
        ? 0
        : quota.limit > 0
            ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
            : quota.used > 0 ? 100 : 0;

    return (
        <div className={cardClass}>
            <CardHeader
                icon={FiAward}
                title="My Plan"
                subtitle="Your listing plan, validity and plan payments"
                action={
                    data?.can_buy && (
                        <a
                            href="/web/plans"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#E87722] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#d96818]"
                        >
                            {planState === "active" ? "Renew / Upgrade" : "Buy Plan"} <FiExternalLink size={12} />
                        </a>
                    )
                }
            />

            <div className="p-5 sm:p-6">
                {error || !quota ? (
                    <p className="mb-0 text-sm text-red-600">{error || "Plan details could not be loaded."}</p>
                ) : state === "na" ? (
                    <p className="mb-0 text-sm text-[#62748E]">
                        Plans are for sellers and brokers. Your account has no listing limit.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {/* Festival offer / admin unlimited: one slim strip on top */}
                        {state === "offer" && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm text-purple-900">
                                <FiGift className="mt-0.5 shrink-0 text-purple-600" size={16} aria-hidden="true" />
                                <p className="mb-0">
                                    <b>{quota.offer?.title || "Festival offer"}:</b> post unlimited properties till{" "}
                                    <b>{formatDateTime(quota.offer?.ends_at)}</b>.
                                </p>
                            </div>
                        )}
                        {state === "promo" && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
                                <FiGift className="mt-0.5 shrink-0 text-blue-600" size={16} aria-hidden="true" />
                                <p className="mb-0">
                                    <b>Unlimited listings</b> given by admin{quota.promo_expires_at ? <> till <b>{formatDate(quota.promo_expires_at)}</b></> : ""}.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* Your plan */}
                            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="mb-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Your Plan</p>
                                        <p className="mb-0 mt-1 truncate text-lg font-bold text-[#001737]" title={quota.plan_name || ""}>
                                            {quota.plan_name || "No plan"}
                                        </p>
                                        {planState === "active" && left !== null && quota.plan_expires_at && (
                                            <p className={`mb-0 mt-0.5 text-xs font-semibold ${left <= 5 ? "text-red-600" : "text-green-700"}`}>
                                                {left === 0 ? "Last day today" : `${left} ${left === 1 ? "day" : "days"} left`}
                                            </p>
                                        )}
                                        {planState === "none" && (
                                            <p className="mb-0 mt-0.5 text-xs text-[#62748E]">Using free listings</p>
                                        )}
                                    </div>
                                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${planBadge[1]}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${planBadge[2]}`} />
                                        {planBadge[0]}
                                    </span>
                                </div>

                                <dl className="mb-0 mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-200/70 pt-3">
                                    <Info label="Type">
                                        {latestPaid ? PERIOD_LABELS[latestPaid.billing_period] || latestPaid.billing_period : "-"}
                                    </Info>
                                    <Info label="Amount">{latestPaid ? (Number(latestPaid.amount) > 0 ? inr(latestPaid.amount) : "Free") : "-"}</Info>
                                    <Info label="Started">{formatDate(latestPaid?.starts_at)}</Info>
                                    <Info label={quota.plan_expired ? "Expired On" : "Valid Till"}>
                                        <span className={quota.plan_expired ? "text-red-600" : ""}>
                                            {quota.plan_id ? (quota.plan_expires_at ? formatDate(quota.plan_expires_at) : "No expiry") : "-"}
                                        </span>
                                    </Info>
                                </dl>
                            </div>

                            {/* Property listings */}
                            <div className="rounded-xl border border-gray-100 bg-white p-4">
                                <p className="mb-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Property Listings</p>

                                <div className="mt-1 flex items-baseline gap-1.5">
                                    <span className="text-2xl font-extrabold text-[#001737]">{quota.used}</span>
                                    <span className="text-sm font-semibold text-[#62748E]">
                                        {quota.unlimited ? "listed · no limit" : `/ ${quota.limit} used`}
                                    </span>
                                    {!quota.unlimited && (
                                        <span className={`ml-auto text-xs font-semibold ${quota.remaining <= 0 ? "text-red-600" : "text-green-700"}`}>
                                            {quota.used > quota.limit
                                                ? `${quota.used - quota.limit} over limit`
                                                : quota.remaining <= 0
                                                    ? "Limit reached"
                                                    : `${quota.remaining} left`}
                                        </span>
                                    )}
                                </div>

                                {quota.unlimited ? (
                                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-purple-200 via-orange-200 to-orange-300" aria-hidden="true" />
                                ) : (
                                    <div
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={Math.max(quota.limit, quota.used)}
                                        aria-valuenow={quota.used}
                                        aria-label="Property listings used"
                                        className="relative mt-3 h-6 overflow-hidden rounded-full bg-gray-100"
                                    >
                                        <div
                                            className={`h-full rounded-full transition-all ${usedPercent >= 100 ? "bg-red-500" : "bg-[#E87722]"}`}
                                            style={{ width: `${usedPercent}%` }}
                                        />
                                        <span
                                            className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${
                                                usedPercent >= 55 ? "text-white" : "text-[#1A1F36]"
                                            }`}
                                        >
                                            {quota.used} / {quota.limit} · {usedPercent}%
                                        </span>
                                    </div>
                                )}

                                <p className="mb-0 mt-2.5 text-xs text-[#62748E]">
                                    {quota.unlimited
                                        ? "You can add as many properties as you like right now."
                                        : quota.plan_listings != null
                                            ? quota.free_listings > 0
                                                ? `${quota.plan_listings} from plan + ${quota.free_listings} free = ${quota.limit}`
                                                : `${quota.limit} from your plan`
                                            : `${quota.limit} free ${quota.limit === 1 ? "listing" : "listings"} without a plan`}
                                    {!quota.unlimited && quota.used > quota.limit && (
                                        <> · Your listed properties stay live; {planState === "expired" ? "renew" : "buy"} a plan to add more.</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Pending request */}
                        {pending && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#5B4A1A]">
                                <FiClock className="mt-0.5 shrink-0 text-[#E87722]" size={16} aria-hidden="true" />
                                <p className="mb-0">
                                    <b>Request pending · {pending.order_no}</b> — {pending.plan_name}, {inr(pending.amount)} by{" "}
                                    {pending.payment_method_label || pending.payment_method}. Active once the admin confirms your payment.
                                </p>
                            </div>
                        )}

                        {/* Plan payments: compact list */}
                        {orders.length > 0 && (
                            <div className="rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                                    <p className="mb-0 text-sm font-semibold text-[#1A1F36]">
                                        Plan Payments <span className="ml-1 text-xs font-normal text-[#62748E]">({orders.length})</span>
                                    </p>
                                    {orders.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAll((value) => !value)}
                                            className="text-xs font-semibold text-[#E87722] hover:text-[#cf681b]"
                                        >
                                            {showAll ? "Show less" : "Show all"}
                                        </button>
                                    )}
                                </div>

                                <ul className="mb-0 divide-y divide-gray-100 pl-0">
                                    {(showAll ? orders : orders.slice(0, 3)).map((order) => (
                                        <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                                            <div className="min-w-0 flex-1">
                                                <p className="mb-0 truncate font-medium text-[#1A1F36]">{order.plan_name}</p>
                                                <p className="mb-0 text-xs text-[#62748E]">
                                                    {order.order_no} · {formatDate(order.created_at)}
                                                    {["paid", "expired"].includes(order.status) &&
                                                        (order.expires_at
                                                            ? ` · valid ${formatDate(order.starts_at)} – ${formatDate(order.expires_at)}`
                                                            : " · no expiry")}
                                                </p>
                                            </div>
                                            <span className="shrink-0 font-semibold text-[#1A1F36]">
                                                {Number(order.amount) > 0 ? inr(order.amount) : "Free"}
                                            </span>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ORDER_STATUS[order.status] || ""}`}>
                                                {order.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
