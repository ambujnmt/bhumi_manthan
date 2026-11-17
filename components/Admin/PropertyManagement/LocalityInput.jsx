"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiGlobe, FiMapPin, FiPlus, FiX } from "react-icons/fi";
import { getAdminLocalities } from "@/utils/adminFetchApi";

// Online results cache for this browser tab: "cityId|query" -> [names]
const onlineCache = new Map();

const ONLINE_MIN_CHARS = 2;
const ONLINE_DEBOUNCE = 250;

// Bold the matched part of a name
function Highlight({ text, query }) {
    const q = query.trim();
    const index = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;

    if (index < 0) return text;

    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-transparent p-0 font-semibold text-[#E87722]">
                {text.slice(index, index + q.length)}
            </mark>
            {text.slice(index + q.length)}
        </>
    );
}

/**
 * Locality / Sector input with suggestions (property form)
 *
 * - Saved localities of city (localities table) load once and filter instantly.
 * - OpenStreetMap suggestions load in background and are added below.
 * - New name is saved to localities table by backend when property is saved.
 */
export default function LocalityInput({ city, value, onChange, inputClass }) {
    const [saved, setSaved] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [online, setOnline] = useState([]);
    const [onlineLoading, setOnlineLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const boxRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();

    const query = value.trim();
    const q = query.toLowerCase();

    // All saved localities of city (once per city) + warm city cache for online search
    useEffect(() => {
        setSaved([]);
        setOnline([]);

        if (!city) return;

        const controller = new AbortController();
        setSavedLoading(true);

        getAdminLocalities(city.id, "", "saved", controller.signal)
            .then((res) => setSaved((res?.data?.localities || []).map((l) => l.name)))
            .catch(() => {})
            .finally(() => !controller.signal.aborted && setSavedLoading(false));

        // finds city centre on server now -> first online search is fast
        getAdminLocalities(city.id, "", "online", controller.signal).catch(() => {});

        return () => controller.abort();
    }, [city?.id]);

    // Online suggestions (debounced, old request cancelled, cached)
    useEffect(() => {
        if (!city || query.length < ONLINE_MIN_CHARS) {
            setOnline([]);
            setOnlineLoading(false);
            return;
        }

        const key = `${city.id}|${q}`;

        if (onlineCache.has(key)) {
            setOnline(onlineCache.get(key));
            setOnlineLoading(false);
            return;
        }

        const controller = new AbortController();
        setOnlineLoading(true);

        const timer = setTimeout(() => {
            getAdminLocalities(city.id, query, "online", controller.signal)
                .then((res) => {
                    const names = (res?.data?.localities || []).map((l) => l.name);
                    onlineCache.set(key, names);
                    setOnline(names);
                })
                .catch(() => {})
                .finally(() => !controller.signal.aborted && setOnlineLoading(false));
        }, ONLINE_DEBOUNCE);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [city?.id, q]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;

        const handleClick = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Saved: filter in browser (instant). Starting with query first.
    const savedMatches = useMemo(() => {
        if (!q) return saved.slice(0, 50);

        const starts = saved.filter((n) => n.toLowerCase().startsWith(q));
        const contains = saved.filter((n) => !n.toLowerCase().startsWith(q) && n.toLowerCase().includes(q));

        return [...starts, ...contains].slice(0, 20);
    }, [saved, q]);

    // Online: hide ones already saved; while loading keep old ones that still match (no flicker)
    const onlineMatches = useMemo(() => {
        const savedSet = new Set(saved.map((n) => n.toLowerCase()));

        return online
            .filter((n) => !savedSet.has(n.toLowerCase()))
            .filter((n) => !onlineLoading || n.toLowerCase().includes(q))
            .slice(0, 15);
    }, [online, saved, q, onlineLoading]);

    const exactSaved = saved.some((n) => n.toLowerCase() === q);
    const exactAny = exactSaved || onlineMatches.some((n) => n.toLowerCase() === q);
    const showAddNew = query !== "" && !exactAny;

    // One list for keyboard navigation: [add new?, ...saved, ...online]
    const items = [
        ...(showAddNew ? [{ type: "new", name: query }] : []),
        ...savedMatches.map((name) => ({ type: "saved", name })),
        ...onlineMatches.map((name) => ({ type: "online", name })),
    ];

    useEffect(() => {
        setActiveIndex(-1);
    }, [q, open]);

    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const choose = (name) => {
        onChange(name);
        setOpen(false);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (event.key === "Enter" && open && activeIndex >= 0) {
            // don't submit form, pick highlighted item
            event.preventDefault();
            choose(items[activeIndex].name);
        } else if (event.key === "Escape" || event.key === "Tab") {
            setOpen(false);
        }
    };

    const showSkeleton = onlineLoading && onlineMatches.length === 0;
    const nothingYet =
        !savedLoading && !onlineLoading && savedMatches.length === 0 && onlineMatches.length === 0;

    let index = -1;
    const itemProps = (name) => {
        index += 1;
        const i = index;

        return {
            id: `${listId}-${i}`,
            "data-index": i,
            role: "option",
            "aria-selected": i === activeIndex,
            onMouseEnter: () => setActiveIndex(i),
            onMouseDown: (event) => event.preventDefault(), // keep input focus
            onClick: () => choose(name),
            className: `flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                i === activeIndex ? "bg-orange-50 text-[#E87722]" : "text-[#1A1F36]"
            }`,
        };
    };

    const sectionTitle = "flex items-center justify-between px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400";

    return (
        <div ref={boxRef} className="relative">
            {/* margin on wrapper (not input) -> icons stay exactly centred on input */}
            <div className="relative mt-1.5">
                <span
                    className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center ${
                        city ? "text-[#E87722]" : "text-gray-300"
                    }`}
                >
                    <FiMapPin className="h-4 w-4" />
                </span>
                <input
                    id="location"
                    name="location"
                    type="text"
                    autoComplete="off"
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    required
                    disabled={!city}
                    placeholder={city ? `Search locality in ${city.name}...` : "Select city first"}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                    // px-3 removed: Bootstrap's .px-3 has padding !important and
                    // would push placeholder under the icon. Padding set inline instead.
                    style={{ paddingLeft: "2.25rem", paddingRight: "4rem" }}
                    className={`${inputClass.replace(/(^|\s)(mt|px)-[\w.[\]]+/g, " ")} disabled:cursor-not-allowed disabled:bg-gray-50`}
                />
                <span className="absolute inset-y-0 right-3 z-10 flex items-center gap-1.5">
                    {(onlineLoading || savedLoading) && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#E87722]" />
                    )}
                    {value && city && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setOpen(true);
                                boxRef.current?.querySelector("input")?.focus();
                            }}
                            aria-label="Clear locality"
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <FiX className="h-4 w-4" />
                        </button>
                    )}
                </span>
            </div>

            {open && city && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                    <ul ref={listRef} id={listId} role="listbox" className="mb-0 max-h-72 overflow-y-auto pb-1 pl-0">
                        {/* Use typed text as new locality */}
                        {showAddNew && (
                            <li key="new" {...itemProps(query)}>
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#E87722]">
                                    <FiPlus className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate">
                                        Use "<span className="font-semibold">{query}</span>"
                                    </span>
                                    <span className="block text-[11px] text-gray-400">
                                        New locality — will be saved to {city.name}
                                    </span>
                                </span>
                            </li>
                        )}

                        {/* Saved */}
                        {savedMatches.length > 0 && (
                            <>
                                <li className={sectionTitle} role="presentation">
                                    <span>Saved in {city.name}</span>
                                    <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
                                        {savedMatches.length}
                                    </span>
                                </li>
                                {savedMatches.map((name) => (
                                    <li key={name} {...itemProps(name)}>
                                        <FiCheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                                        <span className="truncate">
                                            <Highlight text={name} query={query} />
                                        </span>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* Online (OpenStreetMap) */}
                        {(onlineMatches.length > 0 || showSkeleton) && (
                            <li className={sectionTitle} role="presentation">
                                <span>Suggestions</span>
                                <span className="flex items-center gap-1 normal-case tracking-normal">
                                    <FiGlobe className="h-3 w-3" /> OpenStreetMap
                                </span>
                            </li>
                        )}
                        {onlineMatches.map((name) => (
                            <li key={name} {...itemProps(name)}>
                                <FiMapPin className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate">
                                    <Highlight text={name} query={query} />
                                </span>
                            </li>
                        ))}
                        {showSkeleton &&
                            [70, 55, 80].map((width) => (
                                <li key={width} className="flex animate-pulse items-center gap-2.5 px-3 py-2" role="presentation">
                                    <span className="h-4 w-4 shrink-0 rounded-full bg-gray-200" />
                                    <span className="h-3 rounded bg-gray-200" style={{ width: `${width}%` }} />
                                </li>
                            ))}

                        {/* Empty states */}
                        {savedLoading && savedMatches.length === 0 && !showSkeleton && (
                            <li className="px-3 py-4 text-center text-sm text-gray-400" role="presentation">
                                Loading localities...
                            </li>
                        )}
                        {nothingYet && !showAddNew && (
                            <li className="px-3 py-5 text-center text-sm text-gray-400" role="presentation">
                                Type to search localities in {city.name}
                            </li>
                        )}
                        {nothingYet && showAddNew && query.length >= ONLINE_MIN_CHARS && (
                            <li className="px-3 pb-2 pt-1 text-xs text-gray-400" role="presentation">
                                No matching locality found.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
