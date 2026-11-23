"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { FiBriefcase, FiClock, FiCrosshair, FiHash, FiHome, FiMap, FiMapPin, FiPlus, FiSearch, FiX } from "react-icons/fi";
import SearchableSelect from "../../Admin/PropertyManagement/SearchableSelect";
import { detectLocation, getNearMe, getSearchAutocomplete, getSearchSuggest, getSimilarLocalities, lookupPropertyById } from "../../../utils/fetchApi";
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

    // Search (or a "Recent Searches" item) -> search page / filters; saved as a recent search
    const runSearch = (next) => {
        saveRecentSearch(next);

        if (isHome) {
            router.push({
                pathname: SEARCH_PATH,
                query: filtersToQuery({ ...EMPTY_FILTERS, ...next }),
            });
        } else {
            setFilters({ city: next.city, localities: next.localities, q: next.q });
        }
    };

    const search = () => runSearch({ type, city, localities, q });

    // City picked (dropdown or a suggestion): localities belong to the old city -> cleared
    const changeCity = (value) => {
        cityTouched.current = true;

        if (value !== city) {
            setCity(value);
            setLocalities([]);
            setQ("");
        }
    };

    // "Recent Searches" item -> same search again
    const applyRecent = (entry) => {
        cityTouched.current = true;
        setCity(entry.city || "");
        setLocalities(entry.localities || []);
        setQ(entry.q || "");
        runSearch({ type, city: entry.city || "", localities: entry.localities || [], q: entry.q || "" });
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

    // Home: extra "Property ID" tab (find one property by its ID, any city)
    const [idMode, setIdMode] = useState(false);

    const changeTab = (key) => {
        // Any category tab leaves the Property ID tab (same tab again: just switch back)
        setIdMode(false);

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
        <div className="relative z-10 w-full rounded-2xl bg-[#0B1B3A] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            {/* Tabs = category groups (skeleton until options load) */}
            <div className="scrollbar-hide mb-4 flex items-center gap-1 overflow-x-auto rounded-xl bg-white/10 p-1 sm:gap-3 sm:rounded-none sm:bg-transparent sm:p-0">
                {!options &&
                    [0, 1, 2].map((i) => (
                        <span key={i} className="h-9 flex-1 shrink-0 animate-pulse rounded-lg bg-white/10 sm:w-24 sm:flex-none" />
                    ))}

                {(options?.tabs || []).map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => changeTab(tab.key)}
                        className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm ${
                            activeTab === tab.key && !idMode ? "bg-white text-[#0B1B3A]" : "text-white/80 hover:text-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}

                {isHome && options && (
                    <button
                        type="button"
                        onClick={() => setIdMode(true)}
                        className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm ${
                            idMode ? "bg-white text-[#0B1B3A]" : "text-white/80 hover:text-white"
                        }`}
                    >
                        <FiHash className="h-3.5 w-3.5" aria-hidden="true" />
                        Property ID
                    </button>
                )}
            </div>

            {idMode ? (
                <PropertyIdSearch />
            ) : (
            <>

            {/* City + Locality + Search */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="w-full shrink-0 lg:w-56">
                    <SearchableSelect
                        id="search-city"
                        name="city"
                        value={city}
                        options={cityOptions}
                        onChange={changeCity}
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
                    cities={options?.cities || []}
                    onCity={changeCity}
                    onLocalities={setLocalities}
                    onQ={setQ}
                    onEnter={search}
                    onRecent={applyRecent}
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
            </>
            )}

            {/* e.g. home "Popular Searches" (inside the box, below Similar Localities) */}
            {footer}
        </div>
    );
}
/*
|--------------------------------------------------------------------------
| Search box with suggestions as you type (like 99acres)
| Text typed -> GET /api/search/autocomplete: cities, localities (+ city), projects, builders
| Empty box  -> city selected: popular localities (GET /api/search/suggest)
|              no city: recent searches + popular cities
|--------------------------------------------------------------------------
*/

const RECENT_KEY = "bm_recent_searches";
const RECENT_MAX = 5;

const readRecent = () => {
    try {
        const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

const recentLabel = (entry) =>
    [entry.q, ...(entry.localities || []), entry.city].filter(Boolean).join(", ");

// Saved on every Search (newest first, no duplicates)
const saveRecentSearch = (entry) => {
    const label = recentLabel(entry);
    if (!label) return;

    try {
        const list = [{ ...entry, label }, ...readRecent().filter((item) => item.label !== label)].slice(0, RECENT_MAX);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
        // storage blocked -> no recent searches
    }
};

// Typed text in bold inside a suggestion (case-insensitive)
function Highlight({ text, query }) {
    const needle = query.trim().toLowerCase();
    const index = needle ? text.toLowerCase().indexOf(needle) : -1;

    if (index < 0) return text;

    return (
        <>
            {text.slice(0, index)}
            <b className="font-semibold text-[#1A1F36]">{text.slice(index, index + needle.length)}</b>
            {text.slice(index + needle.length)}
        </>
    );
}

const propertiesText = (count) => (count ? `${count} ${count === 1 ? "property" : "properties"}` : "");
const projectsText = (count) => `${count} project${count === 1 ? "" : "s"}`;

const EMPTY_RESULT = { cities: [], localities: [], projects: [], builders: [] };

const ICONS = { recent: FiClock, city: FiMap, locality: FiMapPin, project: FiHome, builder: FiBriefcase };

// Right side of a typed suggestion (like 99acres)
const KIND_LABELS = { city: "City", locality: "Locality", project: "Project", builder: "Builder" };

function LocalityPicker({ city, type, localities, q, cities = [], onCity, onLocalities, onQ, onEnter, onRecent, onUseLocation, locating }) {
    const router = useRouter();
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(EMPTY_RESULT);
    const [recent, setRecent] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const listId = useId();
    const typed = text.trim();

    // Recent searches (this browser) each time the box opens
    useEffect(() => {
        if (open) setRecent(readRecent());
    }, [open]);

    // Suggestions (debounced, old request cancelled)
    useEffect(() => {
        if (!open) return;

        // Empty box, no city: recent + popular cities (no request)
        if (!typed && !city) {
            setResult(EMPTY_RESULT);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);

        const timer = setTimeout(() => {
            const request = typed
                ? getSearchAutocomplete({ q: typed, city, type, limit: 6 }, controller.signal)
                : getSearchSuggest({ city, q: "", type, limit: 8 }, controller.signal).then((data) => ({
                      localities: (data.localities || []).map((l) => ({ ...l, city })),
                  }));

            request
                .then((data) => setResult({ ...EMPTY_RESULT, ...data }))
                .catch(() => {})
                .finally(() => !controller.signal.aborted && setLoading(false));
        }, SUGGEST_DEBOUNCE);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [city, type, typed, open]);

    useEffect(() => {
        if (!open) return;

        const close = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
        };

        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    useEffect(() => setActiveIndex(-1), [typed, result]);

    const selectedLower = localities.map((l) => l.toLowerCase());
    const showStart = !typed && !city; // empty box, no city yet

    // One list for keyboard, in the order shown
    const items = showStart
        ? [
              ...recent.map((entry) => ({ kind: "recent", name: entry.label, entry })),
              ...cities
                  .filter((c) => c.properties_count > 0)
                  .slice(0, 6)
                  .map((c) => ({ kind: "city", name: c.name, meta: propertiesText(c.properties_count) })),
          ]
        : [
              ...result.cities.map((c) => ({ kind: "city", name: c.name, sub: c.state, meta: propertiesText(c.properties_count), label: [c.name, c.state].filter(Boolean).join(", ") })),
              ...result.localities
                  .filter((l) => !((l.city || "").toLowerCase() === city.toLowerCase() && selectedLower.includes(l.name.toLowerCase())))
                  .map((l) => ({ kind: "locality", name: l.name, city: l.city, sub: l.city, meta: propertiesText(l.properties_count), label: [l.name, l.city].filter(Boolean).join(", ") })),
              ...result.projects.map((p) => ({
                  kind: "project",
                  name: p.name,
                  slug: p.slug,
                  sub: [p.builder_name, p.location, p.city].filter(Boolean).join(" · "),
                  label: [p.name, p.location, p.city].filter(Boolean).join(", "),
              })),
              ...result.builders.map((b) => ({ kind: "builder", name: b.name, meta: projectsText(b.projects_count), label: b.name })),
          ];

    // Typed: one mixed list like 99acres - names starting with the text first, then the rest
    // (sort is stable: same rank keeps city -> locality -> project -> builder order)
    if (typed) {
        const needle = typed.toLowerCase();
        items.sort(
            (a, b) =>
                (a.name.toLowerCase().startsWith(needle) ? 0 : 1) - (b.name.toLowerCase().startsWith(needle) ? 0 : 1)
        );
    }

    const pick = (item) => {
        setText("");

        switch (item.kind) {
            case "recent":
                setOpen(false);
                onRecent(item.entry);
                return;

            case "city":
                onCity(item.name);
                break;

            case "locality":
                // Locality of another city -> switch city first (localities belong to one city)
                if (item.city && item.city.toLowerCase() !== city.toLowerCase()) {
                    onCity(item.city);
                    onLocalities([item.name]);
                } else {
                    onLocalities([...localities, item.name]);
                }
                break;

            case "project":
                // Straight to the project page (like 99acres)
                setOpen(false);
                router.push(`/web/project/projectDetail/${item.slug}`);
                return;

            default:
                onQ(item.name); // builder -> text search
        }

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
            } else if (typed) {
                // typed name not in list -> locality of the city, or a text search without city
                if (city) onLocalities([...localities, typed]);
                else onQ(typed);
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
    const group = (kind, title, action = null) => {
        const rows = items.filter((item) => item.kind === kind);
        if (!rows.length) return null;

        const Icon = ICONS[kind];

        return (
            <>
                <li role="presentation" className="flex items-center justify-between px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {title}
                    {action}
                </li>
                {rows.map((item) => {
                    index += 1;
                    const i = index;

                    return (
                        <li
                            key={`${kind}-${item.name}-${item.city || ""}`}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(item)}
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${i === activeIndex ? "bg-orange-50" : ""}`}
                        >
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                    i === activeIndex ? "bg-[#E87722] text-white" : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-gray-600">
                                    <Highlight text={item.name} query={typed} />
                                </span>
                                {item.sub && <span className="block truncate text-xs text-gray-400">{item.sub}</span>}
                            </span>

                            {item.meta && <span className="shrink-0 text-xs text-gray-400">{item.meta}</span>}
                        </li>
                    );
                })}
            </>
        );
    };

    const clearRecent = (
        <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
                try {
                    localStorage.removeItem(RECENT_KEY);
                } catch {
                    // ignore
                }
                setRecent([]);
            }}
            className="normal-case tracking-normal text-[#E87722] hover:underline"
        >
            Clear
        </button>
    );

    const showList = open && Boolean(typed || city || items.length > 0);

    return (
        <div ref={boxRef} className="relative min-w-0 flex-1">
            <div
                onClick={() => inputRef.current?.focus()}
                className="flex min-h-[50px] cursor-text flex-wrap items-center gap-1.5 rounded-lg bg-white py-1.5 pl-3 pr-1.5"
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
                    onChange={(event) => {
                        setText(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        localities.length || q
                            ? "Add more..."
                            : city
                                ? `Search locality, project or builder in ${city}`
                                : "Search city, locality, project or builder"
                    }
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                    className="min-w-[140px] flex-1 bg-transparent py-1.5 text-sm text-gray-700 placeholder-gray-400 outline-none"
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

            {showList && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                    <ul id={listId} role="listbox" className="mb-0 max-h-[420px] overflow-y-auto pl-0">
                        {typed ? (
                            // Typed: one flat list like 99acres -> "Name, Locality, City" ... type on the right
                            items.map((item, i) => (
                                <li
                                    key={`${item.kind}-${item.name}-${item.city || ""}`}
                                    id={`${listId}-${i}`}
                                    role="option"
                                    aria-selected={i === activeIndex}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => pick(item)}
                                    className={`flex cursor-pointer items-center gap-4 border-b border-gray-100 px-4 py-3 text-[15px] last:border-b-0 sm:px-5 ${
                                        i === activeIndex ? "bg-orange-50" : "bg-white"
                                    }`}
                                >
                                    <span className="min-w-0 flex-1 truncate text-[#1A1F36]">
                                        {item.label}
                                    </span>
                                    <span className="shrink-0 text-sm text-gray-400">{KIND_LABELS[item.kind]}</span>
                                </li>
                            ))
                        ) : (
                            <>
                                {group("recent", "Recent Searches", clearRecent)}
                                {group("city", showStart ? "Popular Cities" : "Cities")}
                                {group("locality", `Popular localities in ${city}`)}
                            </>
                        )}

                        {!loading && items.length === 0 && (
                            <li role="presentation" className="px-3 py-4 text-center text-sm text-gray-400">
                                {typed
                                    ? <>No match. Press <b>Enter</b> to search &quot;{typed}&quot;.</>
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
        <div className="mt-4 sm:flex sm:min-h-[34px] sm:flex-wrap sm:items-center sm:gap-2">
            <span className="mb-2 block text-sm text-white/60 sm:mb-0 sm:mr-1">Similar Localities:</span>

            <div className="flex min-h-[34px] flex-wrap items-center gap-2 sm:contents">

            {!city ? (
                <span className="shrink-0 whitespace-nowrap text-sm text-white/40">Select a city to see its localities</span>
            ) : loading && badges.length === 0 ? (
                [96, 140, 110].map((width) => (
                    <span
                        key={width}
                        aria-hidden="true"
                        className="h-[34px] shrink-0 animate-pulse rounded-full bg-white/10"
                        style={{ width }}
                    />
                ))
            ) : badges.length === 0 ? (
                <span className="shrink-0 whitespace-nowrap text-sm text-white/40">
                    {localities.length ? "No more localities" : `No localities in ${city} yet`}
                </span>
            ) : (
                badges.map((l) => (
                    <button
                        key={l.name}
                        type="button"
                        onClick={() => onAdd(l.name)}
                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 text-xs text-white/90 transition-colors hover:border-[#E87722] hover:bg-white/10 sm:text-sm"
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

/*
|--------------------------------------------------------------------------
| Home "Property ID" tab: type an ID (e.g. PROP-NRMH0CNB) -> matching
| properties from any city; pick one (or press Search) -> its detail page.
| GET /api/properties/lookup?q=
|--------------------------------------------------------------------------
*/
function PropertyIdSearch() {
    const router = useRouter();
    const listId = useId();
    const boxRef = useRef(null);
    const [value, setValue] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [message, setMessage] = useState("");

    const text = value.trim();

    // Matches while typing (3+ characters)
    useEffect(() => {
        setMessage("");

        if (text.length < 3) {
            setResults([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);

        const timer = setTimeout(() => {
            lookupPropertyById(text, controller.signal)
                .then((list) => {
                    setResults(list);
                    setHighlight(0);
                    setOpen(true);
                })
                .catch((error) => {
                    if (error?.name !== "AbortError") setResults([]);
                })
                .finally(() => setLoading(false));
        }, SUGGEST_DEBOUNCE);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [text]);

    // Close the list on outside click
    useEffect(() => {
        const onDown = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);

        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const openProperty = (property) => {
        setOpen(false);
        router.push(`/web/propertyDetail/${property.slug || property.id}`);
    };

    // Search button / Enter: exact ID -> open it; else highlighted / only match; else message
    const search = async () => {
        if (text.length < 3) {
            setMessage("Enter at least 3 characters of the Property ID.");
            return;
        }

        let list = results;

        if (!list.length) {
            setLoading(true);
            try {
                list = await lookupPropertyById(text);
                setResults(list);
            } catch (error) {
                setMessage(error?.message || "Something went wrong. Please try again.");
                return;
            } finally {
                setLoading(false);
            }
        }

        const exact = list.find((item) => item.property_id?.toUpperCase() === text.toUpperCase());
        const pick = exact || (open && list[highlight]) || (list.length === 1 ? list[0] : null);

        if (pick) {
            openProperty(pick);
        } else if (list.length) {
            setOpen(true);
            setMessage("Choose the property from the list.");
        } else {
            setMessage(`No property found with ID "${text}".`);
        }
    };

    const onKeyDown = (event) => {
        if (event.key === "ArrowDown" && results.length) {
            event.preventDefault();
            setOpen(true);
            setHighlight((index) => (index + 1) % results.length);
        } else if (event.key === "ArrowUp" && results.length) {
            event.preventDefault();
            setHighlight((index) => (index - 1 + results.length) % results.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            search();
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const showList = open && text.length >= 3 && !loading;

    return (
        <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div ref={boxRef} className="relative min-w-0 flex-1">
                    <div className="flex h-[50px] items-center gap-2 rounded-lg bg-white px-3">
                        <FiHash className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        <input
                            type="text"
                            value={value}
                            onChange={(event) => setValue(event.target.value.toUpperCase())}
                            onFocus={() => results.length && setOpen(true)}
                            onKeyDown={onKeyDown}
                            placeholder="Enter Property ID, e.g. PROP-NRMH0CNB"
                            maxLength={50}
                            autoComplete="off"
                            spellCheck={false}
                            role="combobox"
                            aria-expanded={showList}
                            aria-controls={listId}
                            aria-label="Property ID"
                            className="min-w-0 flex-1 bg-transparent text-sm font-medium uppercase tracking-wide text-gray-700 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder-gray-400 outline-none"
                        />
                        {loading && (
                            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-[#E87722]" aria-hidden="true" />
                        )}
                        {value && !loading && (
                            <button
                                type="button"
                                onClick={() => {
                                    setValue("");
                                    setResults([]);
                                    setMessage("");
                                }}
                                aria-label="Clear"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {showList && (
                        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                            <ul id={listId} role="listbox" className="mb-0 max-h-80 overflow-y-auto py-1 pl-0">
                                {results.length === 0 ? (
                                    <li role="presentation" className="px-3 py-4 text-center text-sm text-gray-400">
                                        No property found with this ID
                                    </li>
                                ) : (
                                    results.map((property, index) => (
                                        <li
                                            key={property.id}
                                            role="option"
                                            aria-selected={index === highlight}
                                            onMouseEnter={() => setHighlight(index)}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                openProperty(property);
                                            }}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${index === highlight ? "bg-orange-50" : ""}`}
                                        >
                                            <img
                                                src={property.main_image || "/assets/img/prop-1.png"}
                                                alt=""
                                                className="h-10 w-14 shrink-0 rounded-md bg-gray-100 object-cover"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-[#1A1F36]">{property.title}</span>
                                                <span className="block truncate text-xs text-gray-500">
                                                    {[property.location, property.city].filter(Boolean).join(", ")}
                                                </span>
                                            </span>
                                            <span className="shrink-0 rounded-md bg-[#FFE4CF] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#c25e12]">
                                                {property.property_id}
                                            </span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={search}
                    className="flex h-[50px] w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E87722] px-8 text-sm font-semibold text-white transition hover:bg-[#cf681b] lg:w-auto"
                >
                    <FiSearch className="h-4 w-4" />
                    Search
                </button>
            </div>

            <p className={`mb-0 mt-3 text-sm ${message ? "text-[#FFB27A]" : "text-white/60"}`} role={message ? "alert" : undefined}>
                {message || "Find any property directly by its ID, from any city. The ID is shown on every property page."}
            </p>
        </div>
    );
}
