"use client";

import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { getSearchCount } from "../../../utils/fetchApi";
import useSearchFilters, {
    budgetLabel,
    countActiveFilters,
    filtersToApi,
    useSearchOptions,
} from "../../../utils/useSearchFilters";

const COUNT_DEBOUNCE = 300;

const FILTER_KEYS = ["budget_min", "budget_max", "property_types", "bedrooms", "furnishing"];

const pickFilters = (filters) =>
    FILTER_KEYS.reduce((values, key) => ({ ...values, [key]: filters[key] }), {});

const chipClass = (active) =>
    `rounded-lg border px-3 py-2 text-xs font-medium transition ${
        active
            ? "border-[#E87722] bg-[#FFE4CF] text-[#1A1F36]"
            : "border-gray-300 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-600"
    }`;

const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400";

/**
 * Filter sidebar (app "detail search screen")
 * Budget -> Property Type -> BHK -> Furnishing -> "Show N Properties"
 * Count is live (GET /api/search/count), list changes on button click.
 */
export default function SearchPropertiesLeftCol() {
    const { filters, setFilters, resetFilters } = useSearchFilters();
    const options = useSearchOptions();

    const [draft, setDraft] = useState(() => pickFilters(filters));
    const [count, setCount] = useState(null);
    const [counting, setCounting] = useState(false);

    // URL changed (tab, chip removed, back button) -> follow it
    const urlKey = JSON.stringify(pickFilters(filters));
    useEffect(() => {
        setDraft(pickFilters(filters));
    }, [urlKey]);

    // Live count for city / localities / tab from URL + draft filters
    const countKey = JSON.stringify(filtersToApi({ ...filters, ...draft }));
    useEffect(() => {
        const controller = new AbortController();
        setCounting(true);

        const timer = setTimeout(() => {
            getSearchCount(JSON.parse(countKey), controller.signal)
                .then((data) => setCount(data.total))
                .catch(() => !controller.signal.aborted && setCount(null))
                .finally(() => !controller.signal.aborted && setCounting(false));
        }, COUNT_DEBOUNCE);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [countKey]);

    const toggle = (key, value) =>
        setDraft((previous) => ({
            ...previous,
            [key]: previous[key].includes(value)
                ? previous[key].filter((item) => item !== value)
                : [...previous[key], value],
        }));

    const budgets = options?.budgets?.[filters.type] || [];
    const changed = JSON.stringify(draft) !== urlKey;

    // Applied filters as removable tags
    const tags = [
        ...filters.localities.map((name) => ({ label: name, remove: { localities: filters.localities.filter((l) => l !== name) } })),
        ...(filters.q ? [{ label: filters.q, remove: { q: "" } }] : []),
        ...(filters.budget_min ? [{ label: `Min ${budgetLabel(options, filters.type, filters.budget_min)}`, remove: { budget_min: "" } }] : []),
        ...(filters.budget_max ? [{ label: `Max ${budgetLabel(options, filters.type, filters.budget_max)}`, remove: { budget_max: "" } }] : []),
        ...filters.property_types.map((key) => ({
            label: options?.property_types?.find((t) => t.key === key)?.label || key,
            remove: { property_types: filters.property_types.filter((t) => t !== key) },
        })),
        ...filters.bedrooms.map((key) => ({ label: `${key} BHK`, remove: { bedrooms: filters.bedrooms.filter((b) => b !== key) } })),
        ...filters.furnishing.map((key) => ({
            label: options?.furnishing?.find((f) => f.key === key)?.label || key,
            remove: { furnishing: filters.furnishing.filter((f) => f !== key) },
        })),
    ];

    const activeCount = countActiveFilters(filters);

    return (
        <aside className="w-full shrink-0 lg:w-72">
            <div className="rounded-xl border border-gray-200 bg-white p-3 lg:sticky lg:top-24">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="mb-0 text-base font-semibold text-gray-900">
                        Filters
                        {activeCount > 0 && (
                            <span className="ml-2 rounded-full bg-[#E87722] px-2 py-0.5 text-xs text-white">{activeCount}</span>
                        )}
                    </h2>
                    {(tags.length > 0 || filters.city) && (
                        <button
                            type="button"
                            onClick={() => resetFilters({ type: filters.type })}
                            className="text-sm font-medium text-orange-500 hover:text-orange-600"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Applied filter tags */}
                {(filters.city || tags.length > 0) && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {filters.city && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0B1B3A] px-3 py-2 text-xs font-medium text-white">
                                {filters.city}
                                <button
                                    type="button"
                                    onClick={() => setFilters({ city: "", localities: [], q: "" })}
                                    aria-label={`Remove ${filters.city}`}
                                >
                                    <FiX className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        )}
                        {tags.map((tag) => (
                            <span key={tag.label} className="inline-flex items-center gap-1.5 rounded-md bg-[#FFE4CF] px-3 py-2 text-xs font-medium text-[#1A1F36]">
                                {tag.label}
                                <button type="button" onClick={() => setFilters(tag.remove)} aria-label={`Remove ${tag.label}`}>
                                    <FiX className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Budget */}
                <div className="mb-6 border-t border-gray-100 pt-3">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Budget</h3>
                    <div className="flex gap-3">
                        <select
                            aria-label="Min budget"
                            value={draft.budget_min}
                            onChange={(event) => setDraft((d) => ({ ...d, budget_min: event.target.value }))}
                            className={selectClass}
                        >
                            <option value="">Min ₹</option>
                            {budgets
                                .filter((b) => !draft.budget_max || b.value <= Number(draft.budget_max))
                                .map((b) => (
                                    <option key={b.value} value={b.value}>₹{b.label}</option>
                                ))}
                        </select>
                        <select
                            aria-label="Max budget"
                            value={draft.budget_max}
                            onChange={(event) => setDraft((d) => ({ ...d, budget_max: event.target.value }))}
                            className={selectClass}
                        >
                            <option value="">Max ₹</option>
                            {budgets
                                .filter((b) => !draft.budget_min || b.value >= Number(draft.budget_min))
                                .map((b) => (
                                    <option key={b.value} value={b.value}>₹{b.label}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Property Type (Commercial tab is already commercial only) */}
                {filters.type !== "commercial" && (
                    <div className="mb-6 border-t border-gray-100 pt-3">
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Property Type</h3>
                        <div className="flex flex-wrap gap-2">
                            {(options?.property_types || [])
                                .filter((t) => t.key !== "commercial")
                                .map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        aria-pressed={draft.property_types.includes(t.key)}
                                        onClick={() => toggle("property_types", t.key)}
                                        className={chipClass(draft.property_types.includes(t.key))}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* Bedrooms */}
                <div className="mb-6 border-t border-gray-100 pt-3">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">No. of Bedrooms</h3>
                    <div className="grid grid-cols-5 gap-1.5">
                        {(options?.bedrooms || []).map((b) => (
                            <button
                                key={b.key}
                                type="button"
                                aria-pressed={draft.bedrooms.includes(b.key)}
                                onClick={() => toggle("bedrooms", b.key)}
                                className={`${chipClass(draft.bedrooms.includes(b.key))} !px-1`}
                            >
                                {b.key}
                                <span className="block text-[10px] opacity-70">BHK</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Furnishing */}
                <div className="mb-6 border-t border-gray-100 pt-3">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Furnishing Status</h3>
                    <div className="flex flex-wrap gap-2">
                        {(options?.furnishing || []).map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                aria-pressed={draft.furnishing.includes(f.key)}
                                onClick={() => toggle("furnishing", f.key)}
                                className={chipClass(draft.furnishing.includes(f.key))}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Show N Properties */}
                <button
                    type="button"
                    onClick={() => setFilters(draft)}
                    disabled={!changed && !counting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border bg-[var(--primary-color)] px-3 py-3.5 text-[15px] font-medium leading-[100%] text-white transition-all duration-300 hover:bg-[var(--secondary-color)] disabled:cursor-default disabled:opacity-70"
                >
                    {counting ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Counting...
                        </>
                    ) : count === null ? (
                        "Apply Filters"
                    ) : (
                        `Show ${count} ${count === 1 ? "Property" : "Properties"}`
                    )}
                </button>

                {changed && (
                    <button
                        type="button"
                        onClick={() => setDraft(pickFilters(filters))}
                        className="mt-2 w-full rounded-lg border border-[#283A86] py-2.5 text-sm font-medium text-[#283A86] hover:bg-gray-50"
                    >
                        Reset changes
                    </button>
                )}
            </div>
        </aside>
    );
}
