"use client";

import React, { useMemo, useState } from "react";

// Single series -> one hue (brand orange); title names it, so no legend box
const BAR_COLOR = "#E87722";

export const formatINR = (value, compact = false) => {
    const number = Number(value) || 0;

    if (compact) {
        if (number >= 10000000) return `₹${(number / 10000000).toFixed(number % 10000000 ? 1 : 0)}Cr`;
        if (number >= 100000) return `₹${(number / 100000).toFixed(number % 100000 ? 1 : 0)}L`;
        if (number >= 1000) return `₹${(number / 1000).toFixed(number % 1000 ? 1 : 0)}K`;
    }

    return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

// 0 -> max rounded up to a "nice" number, 4 gridlines
const niceTicks = (max) => {
    if (max <= 0) return [0, 1, 2, 3, 4].map((step) => step * 250);

    const rough = max / 4;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((value) => value >= rough) || rough;

    return [0, 1, 2, 3, 4].map((index) => index * step);
};

/**
 * Column chart: revenue per day / month / year.
 * series = [{ key, label, amount, count }]
 */
export default function RevenueChart({ series = [], title, periodLabel = "day" }) {
    const [hovered, setHovered] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const ticks = useMemo(() => niceTicks(Math.max(0, ...series.map((item) => item.amount))), [series]);
    const top = ticks[ticks.length - 1] || 1;

    // Peak value gets the one direct label (never a number on every bar)
    const peakIndex = useMemo(() => {
        let best = -1;
        series.forEach((item, index) => {
            if (item.amount > 0 && (best < 0 || item.amount > series[best].amount)) best = index;
        });
        return best;
    }, [series]);

    // Thin out x labels so they never collide (about 10 visible)
    const labelEvery = Math.max(1, Math.ceil(series.length / 10));
    const hasData = series.some((item) => item.amount > 0);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="mb-0 text-sm font-semibold text-[#1A1F36]">{title}</p>
                <button
                    type="button"
                    onClick={() => setShowTable((value) => !value)}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-[#62748E] transition hover:border-[#E87722] hover:text-[#E87722]"
                >
                    {showTable ? "Show chart" : "Show table"}
                </button>
            </div>

            {showTable ? (
                <div className="max-h-[320px] overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 text-left text-xs text-[#62748E]">
                            <tr>
                                <th className="px-3 py-2 capitalize">{periodLabel}</th>
                                <th className="px-3 py-2 text-right">Leads sold</th>
                                <th className="px-3 py-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {series.map((item) => (
                                <tr key={item.key} className="border-t border-gray-100">
                                    <td className="px-3 py-1.5 text-[#1A1F36]">{item.label}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums text-[#62748E]">{item.count}</td>
                                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-[#1A1F36]">{formatINR(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex gap-2">
                    {/* Y axis */}
                    <div className="relative h-[240px] w-12 shrink-0 text-right text-[11px] tabular-nums text-[#94A3B8]">
                        {ticks.map((tick) => (
                            <span key={tick} className="absolute right-0" style={{ bottom: `${(tick / top) * 100}%`, transform: "translateY(50%)" }}>
                                {formatINR(tick, true)}
                            </span>
                        ))}
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Plot */}
                        <div className="relative h-[240px]" onMouseLeave={() => setHovered(null)}>
                            {/* Recessive gridlines */}
                            {ticks.map((tick) => (
                                <div
                                    key={tick}
                                    className={`absolute inset-x-0 border-t ${tick === 0 ? "border-gray-300" : "border-dashed border-gray-100"}`}
                                    style={{ bottom: `${(tick / top) * 100}%` }}
                                />
                            ))}

                            {!hasData && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#94A3B8]">
                                    No paid lead sales in this period
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-end">
                                {series.map((item, index) => {
                                    const height = (item.amount / top) * 100;
                                    const active = hovered === index;

                                    return (
                                        <div
                                            key={item.key}
                                            // Hit target = the whole column slot, bigger than the bar
                                            className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                                            onMouseEnter={() => setHovered(index)}
                                            onFocus={() => setHovered(index)}
                                            onBlur={() => setHovered(null)}
                                            tabIndex={0}
                                            aria-label={`${item.label}: ${formatINR(item.amount)}, ${item.count} leads sold`}
                                        >
                                            {active && <div className="absolute inset-y-0 inset-x-px rounded bg-orange-50/70" aria-hidden="true" />}

                                            {item.amount > 0 && (
                                                <div
                                                    className="relative w-[70%] max-w-[24px] rounded-t transition-opacity"
                                                    style={{ height: `${Math.max(height, 1)}%`, background: BAR_COLOR, opacity: hovered === null || active ? 1 : 0.55 }}
                                                />
                                            )}

                                            {/* Peak label */}
                                            {index === peakIndex && hovered === null && (
                                                <span
                                                    className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-[#1A1F36]"
                                                    style={{ bottom: `calc(${height}% + 4px)`, left: "50%" }}
                                                >
                                                    {formatINR(item.amount, true)}
                                                </span>
                                            )}

                                            {/* Tooltip */}
                                            {active && (
                                                <div
                                                    className={`pointer-events-none absolute z-10 w-max rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg ${
                                                        index > series.length * 0.7 ? "right-1/2" : index < series.length * 0.3 ? "left-1/2" : "left-1/2 -translate-x-1/2"
                                                    }`}
                                                    style={{ bottom: `calc(${Math.min(height, 70)}% + 12px)` }}
                                                >
                                                    <p className="mb-0.5 font-semibold text-[#1A1F36]">{item.label}</p>
                                                    <p className="mb-0 flex items-center gap-1.5 text-[#1A1F36]">
                                                        <span className="h-2 w-2 rounded-sm" style={{ background: BAR_COLOR }} />
                                                        Revenue: <span className="font-semibold tabular-nums">{formatINR(item.amount)}</span>
                                                    </p>
                                                    <p className="mb-0 text-[#62748E]">Leads sold: {item.count}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* X axis */}
                        <div className="mt-1.5 flex">
                            {series.map((item, index) => (
                                <span key={item.key} className="min-w-0 flex-1 truncate text-center text-[10px] text-[#94A3B8]">
                                    {index % labelEvery === 0 ? item.label : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Horizontal bars for a breakdown (lead type / payment method): label + value on every row,
 * so identity never depends on color.
 */
export function BreakdownBars({ title, rows = [], empty = "No data" }) {
    const max = Math.max(0, ...rows.map((row) => row.amount));
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-[#1A1F36]">{title}</p>

            {rows.length === 0 ? (
                <p className="mb-0 py-6 text-center text-sm text-[#94A3B8]">{empty}</p>
            ) : (
                <ul className="space-y-3">
                    {rows.map((row) => (
                        <li key={row.label}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-[#1A1F36]">{row.label}</span>
                                <span className="tabular-nums text-[#62748E]">
                                    <span className="font-semibold text-[#1A1F36]">{formatINR(row.amount)}</span>
                                    {" · "}{row.count} sold{total > 0 ? ` · ${Math.round((row.amount / total) * 100)}%` : ""}
                                </span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-gray-100">
                                <div className="h-full rounded-full" style={{ width: `${max ? Math.max((row.amount / max) * 100, 2) : 0}%`, background: BAR_COLOR }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
