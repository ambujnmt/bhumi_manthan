"use client";

import React, { useEffect, useState } from "react";
import { FaGift, FaInfoCircle } from "react-icons/fa";
import { getListingRules, updateListingRules } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";

/**
 * Paid / free listing control (admin):
 * how many properties a seller / broker without a plan can list for free.
 * Per user (plan for free, unlimited free listings) is set in User Management -> Update.
 */
export default function ListingRules({ canEdit, className = "" }) {
    const [value, setValue] = useState("");
    const [saved, setSaved] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getListingRules()
            .then((res) => {
                const free = res?.data?.rules?.free_listings_without_plan;
                const current = free === null || free === undefined ? null : Number(free);

                setSaved(current);
                setValue(current === null ? "" : String(current));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const res = await updateListingRules({
                free_listings_without_plan: value === "" ? null : Number(value),
            });
            const free = res?.data?.rules?.free_listings_without_plan;

            setSaved(free === null || free === undefined ? null : Number(free));
            showToast(res?.message || "Listing rules updated successfully.");
        } catch (err) {
            showToast(err?.message || "Failed to update listing rules.", "error");
        } finally {
            setSaving(false);
        }
    };

    const unchanged = value === (saved === null ? "" : String(saved));

    return (
        <form
            onSubmit={handleSave}
            className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}
        >
            {/* Top accent (same as plan cards) */}
            <div className="h-1.5 bg-gradient-to-r from-[#E87722] to-[#f5a35c]" />

            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Title */}
                <div className="flex min-w-0 items-start gap-3 lg:max-w-[55%]">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#E87722]">
                        <FaGift size={18} />
                    </span>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="m-0 text-base font-bold text-[#1A1F36]">Free Listing Rules</h3>

                            {!loading && (
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#E87722]">
                                    {saved === null ? "No limit" : `${saved} free listing${saved === 1 ? "" : "s"}`}
                                </span>
                            )}
                        </div>

                        <p className="mb-0 mt-1 text-sm leading-relaxed text-[#62748E]">
                            Free listings for a seller / broker who has no plan.
                        </p>

                        <p className="mb-0 mt-2 flex items-start gap-1.5 text-xs text-[#62748E]">
                            <FaInfoCircle size={11} className="mt-0.5 flex-shrink-0 text-[#283A86]" />
                            <span>
                                Plan for free or unlimited free listings for one user: User Management → Update user.
                            </span>
                        </p>
                    </div>
                </div>

                {/* Field + save */}
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
                    <div className="w-full sm:w-56">
                        <label
                            htmlFor="free_listings_without_plan"
                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#62748E]"
                        >
                            Free listings (without plan)
                        </label>

                        <div className="flex h-11 items-center overflow-hidden rounded-lg border border-gray-300 bg-white transition focus-within:border-[#E87722] focus-within:ring-2 focus-within:ring-orange-100">
                            <input
                                id="free_listings_without_plan"
                                type="number"
                                min="0"
                                value={value}
                                onChange={(event) => setValue(event.target.value)}
                                disabled={loading || !canEdit}
                                placeholder="No limit"
                                className="h-full w-full min-w-0 border-0 bg-transparent px-3 text-sm text-[#1A1F36] outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
                            />
                            <span className="flex h-full items-center border-l border-gray-200 bg-gray-50 px-3 text-xs font-medium text-[#62748E]">
                                listings
                            </span>
                        </div>
                    </div>

                    {canEdit && (
                        <button
                            type="submit"
                            disabled={loading || saving || unchanged}
                            className="h-11 w-full flex-shrink-0 rounded-lg bg-[#E87722] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
