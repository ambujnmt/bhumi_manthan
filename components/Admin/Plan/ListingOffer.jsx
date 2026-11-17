"use client";

import React, { useEffect, useState } from "react";
import { FaBolt, FaInfoCircle } from "react-icons/fa";
import { getListingOffer, updateListingOffer } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";

// ISO (UTC) -> value for <input type="datetime-local"> in the admin's own time
const toLocalInput = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// datetime-local value (admin's own time) -> ISO with timezone
const toIso = (local) => (local ? new Date(local).toISOString() : null);

const formatWhen = (iso) =>
    iso
        ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "-";

const STATUS = {
    active: ["Live now", "bg-green-100 text-green-700"],
    scheduled: ["Scheduled", "bg-blue-50 text-blue-700"],
    ended: ["Ended", "bg-gray-100 text-gray-600"],
    off: ["Off", "bg-gray-100 text-gray-600"],
};

// Quick presets: start now, run for N days
const PRESETS = [
    ["1 day", 1],
    ["2 days", 2],
    ["3 days", 3],
    ["1 week", 7],
];

/**
 * Festival offer (e.g. Diwali): every seller / broker can post unlimited properties
 * between two times. After the end time everyone is back to their normal limit
 * (properties added during the offer stay live).
 */
export default function ListingOffer({ canEdit, className = "" }) {
    const [offer, setOffer] = useState(null);
    const [eligible, setEligible] = useState(0);
    const [title, setTitle] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const apply = (data) => {
        const next = data?.offer || null;

        setOffer(next);
        setEligible(data?.eligible_users || 0);
        setTitle(next?.title || "");
        setStartsAt(toLocalInput(next?.starts_at));
        setEndsAt(toLocalInput(next?.ends_at));
    };

    useEffect(() => {
        getListingOffer()
            .then((res) => apply(res?.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const usePreset = (days) => {
        const start = new Date();
        start.setSeconds(0, 0);
        const end = new Date(start.getTime() + days * 86400000);

        setStartsAt(toLocalInput(start.toISOString()));
        setEndsAt(toLocalInput(end.toISOString()));
        setError("");
    };

    const save = async (enabled) => {
        if (enabled) {
            if (!startsAt || !endsAt) {
                setError("Please choose the start and end time.");
                return;
            }

            if (new Date(endsAt) <= new Date(startsAt)) {
                setError("End time must be after the start time.");
                return;
            }
        }

        setSaving(true);
        setError("");

        try {
            const res = await updateListingOffer({
                enabled,
                title: title.trim() || null,
                starts_at: toIso(startsAt),
                ends_at: toIso(endsAt),
            });

            apply(res?.data);
            showToast(res?.message || (enabled ? "Offer saved." : "Offer switched off."));
        } catch (err) {
            setError(err?.message || "Failed to save the offer.");
        } finally {
            setSaving(false);
        }
    };

    const status = offer?.status || "off";
    const [statusLabel, statusClass] = STATUS[status] || STATUS.off;
    const running = status === "active" || status === "scheduled";

    return (
        <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
            <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#E87722] to-[#f5a35c]" />

            <div className="p-5 sm:p-6">
                {/* Title + status */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
                            <FaBolt size={18} />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="m-0 text-base font-bold text-[#1A1F36]">Festival Offer: Unlimited Listings</h3>
                                {!loading && (
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass}`}>
                                        {status === "active" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />}
                                        {statusLabel}
                                    </span>
                                )}
                            </div>
                            <p className="mb-0 mt-1 text-sm leading-relaxed text-[#62748E]">
                                For a festival like Diwali: all {eligible > 0 ? <b className="text-[#1A1F36]">{eligible}</b> : ""} sellers and brokers can post
                                unlimited properties between the start and end time, whatever their plan.
                            </p>
                            {running && (
                                <p className="mb-0 mt-2 text-sm text-[#1A1F36]">
                                    {offer?.title && <b>{offer.title}: </b>}
                                    {status === "active" ? "running till " : `starts ${formatWhen(offer.starts_at)}, ends `}
                                    <b>{formatWhen(offer.ends_at)}</b>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="offer_title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#62748E]">
                            Offer Name
                        </label>
                        <input
                            id="offer_title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={100}
                            disabled={loading || !canEdit}
                            placeholder="e.g. Diwali Dhamaka"
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="offer_starts_at" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#62748E]">
                            Start
                        </label>
                        <input
                            id="offer_starts_at"
                            type="datetime-local"
                            value={startsAt}
                            onChange={(event) => setStartsAt(event.target.value)}
                            disabled={loading || !canEdit}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="offer_ends_at" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#62748E]">
                            End
                        </label>
                        <input
                            id="offer_ends_at"
                            type="datetime-local"
                            value={endsAt}
                            min={startsAt || undefined}
                            onChange={(event) => setEndsAt(event.target.value)}
                            disabled={loading || !canEdit}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                        />
                    </div>
                </div>

                {canEdit && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#62748E]">Quick: start now for</span>
                        {PRESETS.map(([label, days]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => usePreset(days)}
                                disabled={loading}
                                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-[#283A86] transition hover:border-[#E87722] hover:text-[#E87722]"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <p role="alert" className="mb-0 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="mb-0 flex items-start gap-1.5 text-xs text-[#62748E]">
                        <FaInfoCircle size={11} className="mt-0.5 flex-shrink-0 text-[#283A86]" />
                        <span>
                            After the end time everyone goes back to their own limit by itself. Properties added during the offer stay live.
                            Times are in your local time.
                        </span>
                    </p>

                    {canEdit && (
                        <div className="flex flex-shrink-0 gap-2">
                            {running && (
                                <button
                                    type="button"
                                    onClick={() => save(false)}
                                    disabled={saving}
                                    className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                >
                                    {status === "active" ? "Stop Offer" : "Cancel Offer"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => save(true)}
                                disabled={loading || saving}
                                className="h-11 rounded-lg bg-[#E87722] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : running ? "Update Offer" : "Start Offer"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
