"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { FiBriefcase, FiCrosshair, FiHome, FiMapPin, FiPlus, FiSearch, FiX } from "react-icons/fi";
import SearchableSelect from "../../Admin/PropertyManagement/SearchableSelect";
import { detectLocation, getNearMe, getSearchSuggest, getSimilarLocalities } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import { useRouter } from "next/router";
import useSearchFilters, {
    EMPTY_FILTERS,
    SEARCH_PATH,
    filtersToQuery,
    readSessionCache,
    resolveTab,
    useSearchOptions,
    writeSessionCache,
} from "../../../utils/useSearchFilters";
import useUserLocation from "../../../utils/useUserLocation";

const SUGGEST_DEBOUNCE = 250;

/**
 * Website search bar (same flow as app search screen)
 * Category tab (Residential / Commercial / Rental ...) -> City -> Locality chips (+ Similar Localities) -> Search
 * Locality / project / builder suggestions: GET /api/search/suggest
 *
 * mode="page" (search page): tab applies at once, Search updates the URL filters
 * mode="home" (home page):   everything is a draft, Search opens the search page
 */
export default function SearchBar({ mode = "page", footer = null }) {
    const router = useRouter();
    const isHome = mode === "home";
    const { filters, setFilters } = useSearchFilters();
    const options = useSearchOptions();
    const { location: userLocation } = useUserLocation();

    // Draft until "Search" (on search page tab applies at once)
    const [type, setType] = useState(isHome ? "" : filters.type);
    const [city, setCity] = useState(isHome ? "" : filters.city);
    const [localities, setLocalities] = useState(isHome ? [] : filters.localities);
    const [q, setQ] = useState(isHome ? "" : filters.q);
    const cityTouched = useRef(false);

    // Search page: URL changed (back button, chips removed in sidebar) -> follow it
    useEffect(() => {
        if (isHome) return;

        setType(filters.type);
        setCity(filters.city);
        setLocalities(filters.localities);
        setQ(filters.q);
    }, [isHome, filters.type, filters.city, filters.localities.join("|"), filters.q]);

    // Home: preselect visitor's city (IP location) when it is in the list
    useEffect(() => {
        if (!isHome || cityTouched.current || city || !userLocation?.city || !options?.cities) return;

        const match = options.cities.find(
            (c) => c.name.toLowerCase() === userLocation.city.toLowerCase()
        );

        if (match) setCity(match.name);
    }, [isHome, city, userLocation?.city, options?.cities]);

    const search = () => {
        if (isHome) {
            router.push({
                pathname: SEARCH_PATH,
                query: filtersToQuery({ ...EMPTY_FILTERS, type, city, localities, q }),
            });
        } else {
            setFilters({ city, localities, q });
        }
    };

    // "Current Location": GPS (asks permission on click) -> else IP location
    // -> nearest city + locality from property locations (GET /api/search/near-me)
    const [locating, setLocating] = useState(false);

    const applyCurrentLocation = async () => {
        setLocating(true);

        try {
            let point = await getBrowserPosition().catch(() => null);

            if (!point) {
                point = userLocation || (await detectLocation().catch(() => null));
            }

            if (!point?.latitude || !point?.longitude) {
                throw new Error("Unable to get your location. Please select a city.");
            }

            const data = await getNearMe({ latitude: point.latitude, longitude: point.longitude, type });

            cityTouched.current = true;
            setCity(data.city.name);
            setLocalities(data.locality ? [data.locality.name] : []);
            setQ("");

            showToast(
                `Nearest locality: ${data.locality.name}, ${data.city.name}` +
                    (data.locality.distance_km ? ` (${data.locality.distance_km} km away)` : "")
            );
        } catch (error) {
            showToast(error?.message || "Unable to find properties near you.", "error");
        } finally {
            setLocating(false);
        }
    };

    // "" / old key (buy, rent) -> real tab key
    const activeTab = resolveTab(options, type)?.key || "";

    const changeTab = (key) => {
        if (key === activeTab) return;

        if (isHome) {
            setType(key);
        } else {
            // budget ranges + property types (sub categories) differ per tab -> reset them
            setFilters({ type: key, city, localities, q, budget_min: "", budget_max: "", property_types: [] });
        }
    };

    const cityOptions = (options?.cities || []).map((c) => ({
        value: c.name,
        label: c.properties_count ? `${c.name} (${c.properties_count})` : c.name,
    }));

    // city from old link (?city=..) not in list -> still selectable
    if (city && !cityOptions.some((o) => o.value.toLowerCase() === city.toLowerCase())) {
        cityOptions.unshift({ value: city, label: city });
    }

    return (
        <div className="relative z-10 w-full rounded-2xl bg-[#0B1B3A] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            {/* Tabs = category groups (skeleton until options load) */}
            <div className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto sm:gap-3">
                {!options &&
                    [0, 1, 2].map((i) => (
                        <span key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-white/10" />
                    ))}

                {(options?.tabs || []).map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => changeTab(tab.key)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === tab.key ? "bg-white text-[#0B1B3A]" : "text-white/80 hover:text-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* City + Locality + Search */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="w-full shrink-0 lg:w-56">
                    <SearchableSelect
                        id="search-city"
                        name="city"
                        value={city}
                        options={cityOptions}
                        onChange={(value) => {
                            cityTouched.current = true;

                            if (value !== city) {
                                setCity(value);
                                setLocalities([]); // localities belong to old city
                                setQ("");
                            }
                        }}
                        placeholder="Select City"
                        searchPlaceholder="Search city..."
                        emptyText="No city found"
                        className=""
                        buttonClassName="h-[50px]"
                    />
                </div>

                <LocalityPicker
                    city={city}
                    type={type}
                    localities={localities}
                    q={q}
                    onLocalities={setLocalities}
                    onQ={setQ}
                    onEnter={search}
                    onUseLocation={applyCurrentLocation}
                    locating={locating}
                />

                <button
                    type="button"
                    onClick={search}
                    className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E87722] px-8 h-[50px] text-sm font-semibold text-white transition hover:bg-[#cf681b] lg:w-auto"
                >
                    <FiSearch className="h-4 w-4" />
                    Search
                </button>
            </div>

            <SimilarLocalities
                city={city}
                type={type}
                localities={localities}
                onAdd={(name) => setLocalities((previous) => [...previous, name])}
            />

            {/* e.g. home "Popular Searches" (inside the box, below Similar Localities) */}
            {footer}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Locality chips + suggestions (localities, projects, builders)
|--------------------------------------------------------------------------
*/

function LocalityPicker({ city, type, localities, q, onLocalities, onQ, onEnter, onUseLocation, locating }) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState({ localities: [], projects: [], builders: [] });
    const [activeIndex, setActiveIndex] = useState(-1);
    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const listId = useId();

    // Suggestions (debounced, old request cancelled)
    useEffect(() => {
        if (!city || !open) return;

        const controller = new AbortController();
        setLoading(true);

        const timer = setTimeout(() => {
            getSearchSuggest({ city, q: text.trim(), type, limit: 8 }, controller.signal)
                .then((data) => setResult(data))
                .catch(() => {})
                .finally(() => !controller.signal.aborted && setLoading(false));
        }, SUGGEST_DEBOUNCE);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [city, type, text, open]);

    useEffect(() => {
        if (!open) return;

        const close = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
        };

        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    useEffect(() => setActiveIndex(-1), [text, result]);

    const selectedLower = localities.map((l) => l.toLowerCase());

    // One list for keyboard: localities, projects, builders
    const items = [
        ...result.localities
            .filter((l) => !selectedLower.includes(l.name.toLowerCase()))
            .map((l) => ({ kind: "locality", name: l.name, meta: l.properties_count ? `${l.properties_count} ${l.properties_count === 1 ? "property" : "properties"}` : "" })),
        ...result.projects.map((p) => ({ kind: "project", name: p.name, meta: p.builder_name || p.location || "" })),
        ...result.builders.map((b) => ({ kind: "builder", name: b.name, meta: `${b.projects_count} project${b.projects_count === 1 ? "" : "s"}` })),
    ];

    const pick = (item) => {
        if (item.kind === "locality") {
            onLocalities([...localities, item.name]);
        } else {
            onQ(item.name); // project / builder -> text search
        }

        setText("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (event.key === "Enter") {
            event.preventDefault();

            if (open && activeIndex >= 0 && items[activeIndex]) {
                pick(items[activeIndex]);
            } else if (text.trim()) {
                // typed name not in list -> still search it
                onLocalities([...localities, text.trim()]);
                setText("");
            } else {
                setOpen(false);
                onEnter();
            }
        } else if (event.key === "Backspace" && !text && localities.length) {
            onLocalities(localities.slice(0, -1));
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    let index = -1;
    const group = (kind, title, Icon) => {
        const rows = items.filter((item) => item.kind === kind);
        if (!rows.length) return null;

        return (
            <>
                <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {title}
                </li>
                {rows.map((item) => {
                    index += 1;
                    const i = index;

                    return (
                        <li
                            key={`${kind}-${item.name}`}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(item)}
                            className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${
                                i === activeIndex ? "bg-orange-50 text-[#E87722]" : "text-[#1A1F36]"
                            }`}
                        >
                            <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="min-w-0 flex-1 truncate">{item.name}</span>
                            {item.meta && <span className="shrink-0 text-xs text-gray-400">{item.meta}</span>}
                        </li>
                    );
                })}
            </>
        );
    };

    return (
        <div ref={boxRef} className="relative min-w-0 flex-1">
            <div
                onClick={() => city && inputRef.current?.focus()}
                className={`flex min-h-[50px] flex-wrap items-center gap-1.5 rounded-lg bg-white pl-3 pr-1.5 py-1.5 ${city ? "cursor-text" : "cursor-not-allowed"}`}
            >
                <FiSearch className="mr-1 h-4 w-4 shrink-0 text-gray-400" />

                {localities.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 rounded-md bg-[#FFE4CF] px-2 py-1 text-xs font-medium text-[#1A1F36]">
                        {name}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onLocalities(localities.filter((l) => l !== name));
                            }}
                            aria-label={`Remove ${name}`}
                            className="rounded text-gray-500 hover:text-red-600"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    </span>
                ))}

                {q && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-[#283A86]">
                        {q}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onQ("");
                            }}
                            aria-label={`Remove ${q}`}
                            className="rounded text-gray-500 hover:text-red-600"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    </span>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    disabled={!city}
                    onChange={(event) => {
                        setText(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        !city
                            ? "Select a city first"
                            : localities.length || q
                                ? "Add more..."
                                : "Search locality, projects or builders"
                    }
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                    className="min-w-[140px] flex-1 bg-transparent py-1.5 text-sm text-gray-700 placeholder-gray-400 outline-none disabled:cursor-not-allowed"
                />

                {loading && open && (
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-[#E87722]" />
                )}

                {/* Current location -> nearest city + locality */}
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setOpen(false);
                        onUseLocation();
                    }}
                    disabled={locating}
                    title="Use my current location"
                    aria-label="Use my current location"
                    className="ml-auto flex h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-l border-gray-200 pl-3 pr-2 text-sm font-medium text-[#E87722] transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-70"
                >
                    {locating ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-[#E87722]" />
                    ) : (
                        <FiCrosshair className="h-4 w-4" />
                    )}
                    <span className="hidden whitespace-nowrap sm:inline">
                        {locating ? "Locating..." : "Current Location"}
                    </span>
                </button>
            </div>

            {open && city && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                    <ul id={listId} role="listbox" className="mb-0 max-h-80 overflow-y-auto pb-1 pl-0">
                        {group("locality", text.trim() ? `Localities in ${city}` : `Popular localities in ${city}`, FiMapPin)}
                        {group("project", "Projects", FiHome)}
                        {group("builder", "Builders", FiBriefcase)}

                        {!loading && items.length === 0 && (
                            <li role="presentation" className="px-3 py-4 text-center text-sm text-gray-400">
                                {text.trim()
                                    ? <>No match. Press <b>Enter</b> to search "{text.trim()}".</>
                                    : `No localities found in ${city}`}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Similar Localities (nearest to selected ones) - GET /api/search/similar-localities
|--------------------------------------------------------------------------
*/

// City selected -> all its localities as badges (most properties first).
// After a pick -> nearest to the picked ones first. Click adds it to the search box.
// Row is always there (hint / skeleton / badges) so the box never jumps on load.
const similarCache = new Map(); // "city|type|localities" -> list (this page load)
const SIMILAR_CACHE_KEY = "bm_similar_localities";

const readSimilar = (key) => similarCache.get(key) || readSessionCache(SIMILAR_CACHE_KEY)?.[key] || null;

const writeSimilar = (key, list) => {
    similarCache.set(key, list);
    // keep only a few in session
    const saved = Object.entries(readSessionCache(SIMILAR_CACHE_KEY) || {}).slice(-19);
    writeSessionCache(SIMILAR_CACHE_KEY, Object.fromEntries([...saved, [key, list]]));
};

function SimilarLocalities({ city, type, localities, onAdd }) {
    const [similar, setSimilar] = useState([]);
    const [loading, setLoading] = useState(false);
    const localitiesKey = localities.join("|");

    useEffect(() => {
        if (!city) {
            setSimilar([]);
            setLoading(false);
            return;
        }

        const key = `${city}|${type}|${localitiesKey}`;
        const cached = readSimilar(key);

        if (cached) setSimilar(cached);

        const controller = new AbortController();
        setLoading(!cached);

        // old badges stay until new ones arrive (no blink)
        getSimilarLocalities({ city, type, localities, limit: 30 }, controller.signal)
            .then((data) => {
                const list = data.localities || [];
                writeSimilar(key, list);
                setSimilar(list);
            })
            .catch(() => {})
            .finally(() => !controller.signal.aborted && setLoading(false));

        return () => controller.abort();
    }, [city, type, localitiesKey]);

    // already in search box -> hide at once (before new list arrives)
    const selectedLower = localities.map((l) => l.toLowerCase());
    const badges = similar.filter((l) => !selectedLower.includes(l.name.toLowerCase()));

    return (
        <div className="mt-4 flex min-h-[34px] flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-white/60">Similar Localities:</span>

            {!city ? (
                <span className="text-sm text-white/40">Select a city to see its localities</span>
            ) : loading && badges.length === 0 ? (
                [96, 140, 110].map((width) => (
                    <span
                        key={width}
                        aria-hidden="true"
                        className="h-[34px] animate-pulse rounded-full bg-white/10"
                        style={{ width }}
                    />
                ))
            ) : badges.length === 0 ? (
                <span className="text-sm text-white/40">
                    {localities.length ? "No more localities" : `No localities in ${city} yet`}
                </span>
            ) : (
                badges.map((l) => (
                    <button
                        key={l.name}
                        type="button"
                        onClick={() => onAdd(l.name)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-1.5 text-xs text-white/90 transition-colors hover:border-[#E87722] hover:bg-white/10 sm:text-sm"
                        title={
                            [
                                l.properties_count ? `${l.properties_count} ${l.properties_count === 1 ? "property" : "properties"}` : "",
                                l.distance_km != null ? `${l.distance_km} km away` : "",
                            ].filter(Boolean).join(" · ") || undefined
                        }
                    >
                        <FiPlus className="h-3.5 w-3.5" />
                        {l.name}
                        {l.properties_count > 0 && (
                            <span className="ml-0.5 rounded-full bg-white/15 px-1.5 text-[10px] text-white/80">
                                {l.properties_count}
                            </span>
                        )}
                    </button>
                ))
            )}
        </div>
    );
}

// Browser GPS (permission popup only when user clicks "Current Location")
function getBrowserPosition() {
    return new Promise((resolve, reject) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            reject(new Error("Location not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
        );
    });
}
