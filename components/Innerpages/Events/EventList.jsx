import NextLink from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import {
    FaArrowRight,
    FaBuilding,
    FaCalendarAlt,
    FaCalendarPlus,
    FaClock,
    FaGem,
    FaHandshake,
    FaHome,
    FaMapMarkerAlt,
    FaMicrophone,
    FaPercent,
    FaSearch,
    FaUsers,
    FaChevronRight, // <-- add
} from "react-icons/fa";
import { getEvents } from "../../../utils/fetchApi";
import useUserLocation from "../../../utils/useUserLocation";
import useNow from "../../../utils/useNow";
import LiveBadge from "../../Common/LiveBadge";
import EventCard from "./EventCard";
import PageBannerImage from "../../Common/PageBannerImage";
import {
    eventCityState,
    formatEventDateRange,
    formatEventTime,
    googleCalendarUrl,
    isEventLive,
    parseEventDate,
    splitEvents,
} from "./eventUtils";
import SideAds from "../../Common/Ads/SideAds";

const NAVY = "#12305F";


// Card icons: API se event.icon na aaye to index ke hisaab se ye use honge
const EVENT_ICONS = [FaCalendarAlt, FaBuilding, FaHome, FaMicrophone, FaGem];

const WHY_ATTEND = [
    { icon: FaBuilding, title: "Meet Top Builders", text: "Talk directly to developers and see projects up close" },
    { icon: FaPercent, title: "Exclusive Offers", text: "Event-only prices, spot booking discounts and freebies" },
    { icon: FaHome, title: "New Launches", text: "Be first to explore pre-launch and newly launched projects" },
    { icon: FaHandshake, title: "Expert Guidance", text: "Home loan desks, legal help and investment advice" },
];

// Event icon: API icon URL ho to wo, warna react-icons fallback
function EventIcon({ event, index = 0, className = "" }) {
    const Icon = EVENT_ICONS[index % EVENT_ICONS.length];

    return (
        <span
            className={`flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-md ${className}`}
            style={{ border: "2px solid var(--primary-color)" }}
        >
            {event?.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={event.icon}
                    alt={event.title || "Event icon"}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                />
            ) : (
                <Icon className="text-[22px] text-[var(--primary-color)]" />
            )}
        </span>
    );
}

// Days / hours / minutes / seconds until the event starts (client only, avoids hydration mismatch)
function Countdown({ event }) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(timer);
    }, []);

    const start = parseEventDate(event.event_date);

    if (!now || !start) return null;

    const [hours, minutes] = String(event.start_time || "00:00").split(":").map(Number);
    start.setHours(hours || 0, minutes || 0, 0, 0);

    const diff = start.getTime() - now;

    if (isEventLive(event, now)) {
        return (
            <span className="inline-flex items-center gap-3">
                <LiveBadge size="lg" />
                <span className="text-[14px] font-semibold text-white/90">Happening now · till {formatEventTime(event.end_time) || "end of day"}</span>
            </span>
        );
    }

    if (diff <= 0) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white/80">
                Today&apos;s session is over · next from {formatEventTime(event.start_time) || "tomorrow"}
            </span>
        );
    }

    const parts = [
        ["Days", Math.floor(diff / 86400000)],
        ["Hours", Math.floor((diff % 86400000) / 3600000)],
        ["Mins", Math.floor((diff % 3600000) / 60000)],
        ["Secs", Math.floor((diff % 60000) / 1000)],
    ];

    return (
        <div className="flex gap-2.5">
            {parts.map(([label, value]) => (
                <div key={label} className="min-w-[64px] rounded-xl bg-white/10 px-3 py-2 text-center backdrop-blur">
                    <p className="mb-0 text-[24px] font-extrabold leading-none text-white">{String(value).padStart(2, "0")}</p>
                    <p className="mb-0 mt-1 text-[11px] uppercase tracking-wide text-white/60">{label}</p>
                </div>
            ))}
        </div>
    );
}

function FeaturedEvent({ event, index = 0 }) {
    const href = `/web/events/${event.slug || event.id}`;
    const cityState = eventCityState(event);
    const now = useNow(30000);
    const live = Boolean(now) && isEventLive(event, now);

    return (
        <div
            className="grid grid-cols-12 overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(18,48,95,0.25)]"
            style={{ background: `linear-gradient(120deg, ${NAVY} 0%, #1B4380 100%)` }}
        >
            <NextLink href={href} className="relative col-span-12 block h-64 overflow-hidden sm:h-80 lg:col-span-6 lg:h-auto lg:min-h-[420px]">
                <img
                    src={event.image || "/assets/img/blog-img1.png"}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-105"
                />
                {live ? (
                    <LiveBadge size="lg" label="Live Now" className="absolute left-4 top-4" />
                ) : (
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--primary-color)] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white shadow">
                        Next Big Event
                    </span>
                )}
                {/* Card icon */}
                <EventIcon event={event} index={index} className="absolute bottom-4 right-4" />
            </NextLink>

            <div className="col-span-12 flex flex-col justify-center p-6 lg:col-span-6 lg:p-10">
                <div className="flex flex-wrap gap-2">
                    {event.event_type_label && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90">
                            {event.event_type_label}
                        </span>
                    )}
                    {event.expected_footfall_label && (
                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90">
                            <FaUsers size={11} /> {event.expected_footfall_label}
                        </span>
                    )}
                </div>

                <h2 className="mb-0 mt-4 text-[26px] font-extrabold leading-tight text-white lg:text-[34px]">
                    <NextLink href={href} className="text-white no-underline hover:text-[#F2B544]">{event.title}</NextLink>
                </h2>

                {event.organizer_name && (
                    <p className="mb-0 mt-1.5 text-[15px] text-white/70">
                        By <span className="font-semibold text-white">{event.organizer_name}</span>
                    </p>
                )}

                <div className="mt-6 grid gap-3 text-[14px] text-white/90 sm:grid-cols-2">
                    <p className="mb-0 flex items-center gap-2.5">
                        <FaCalendarAlt className="shrink-0 text-[#F2B544]" />
                        {formatEventDateRange(event, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="mb-0 flex items-center gap-2.5">
                        <FaClock className="shrink-0 text-[#F2B544]" />
                        {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                    </p>
                    {(event.location || cityState) && (
                        <p className="mb-0 flex items-start gap-2.5 sm:col-span-2">
                            <FaMapMarkerAlt className="mt-1 shrink-0 text-[#F2B544]" />
                            <span>
                                {event.location}
                                {cityState && <span className="text-white/60">{event.location ? ", " : ""}{cityState}</span>}
                            </span>
                        </p>
                    )}
                </div>

                <div className="mt-6">
                    <Countdown event={event} />
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                    <NextLink
                        href={href}
                        className="flex items-center gap-2 rounded-xl bg-[var(--primary-color)] px-6 py-3 text-[15px] font-semibold text-white no-underline transition hover:bg-[#d96818]"
                    >
                        View Event <FaArrowRight size={12} />
                    </NextLink>
                    <a
                        href={googleCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-[15px] font-semibold text-white no-underline transition hover:bg-white/10"
                    >
                        <FaCalendarPlus /> Add to Calendar
                    </a>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, text, onReset }) {
    return (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary-color)]">
                <FaCalendarAlt size={26} />
            </span>
            <h3 className="mb-0 mt-4 text-[20px] font-bold text-[var(--text-color1)]">{title}</h3>
            <p className="mx-auto mb-0 mt-1.5 max-w-md text-[15px] text-[var(--text-color2)]">{text}</p>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-5 rounded-xl border border-[var(--primary-color)] px-5 py-2.5 text-[14px] font-semibold text-[var(--primary-color)] transition hover:bg-[var(--primary-color)] hover:text-white"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}

// initialEvents: loaded on server (pages/web/events), null = load in browser
export default function EventList({ initialEvents = null, initialBanner }) {
    const [events, setEvents] = useState(initialEvents ?? []);
    const [loading, setLoading] = useState(initialEvents === null);

    const [tab, setTab] = useState("upcoming");
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [type, setType] = useState("");

    useEffect(() => {
        if (initialEvents !== null) return;

        const fetchEvents = async () => {
            try {
                const res = await getEvents(50);
                setEvents(res?.data?.events ?? []);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [initialEvents]);

    // Visitor location (IP) -> distance of nearby events (same as properties)
    const { ready, location } = useUserLocation();
    const [distances, setDistances] = useState({});

    useEffect(() => {
        if (!ready || !location) return;

        let active = true;

        getEvents(50, location)
            .then((res) => {
                if (!active) return;

                const map = {};
                (res?.data?.events || []).forEach((event) => {
                    // Old API has no distance -> ignored
                    if (event.distance_km != null) map[event.id] = event.distance_km;
                });
                setDistances(map);
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [ready, location]);

    const now = useNow(30000);

    // Filter options from the events themselves
    const cities = useMemo(
        () => [...new Set(events.map((event) => event.city).filter(Boolean))].sort(),
        [events]
    );

    const types = useMemo(() => {
        const map = new Map();

        events.forEach((event) => {
            if (event.event_type && event.event_type_label) map.set(event.event_type, event.event_type_label);
        });

        return [...map.entries()];
    }, [events]);

    // Upcoming order (location known): nearby LIVE, nearby (nearest first), other LIVE, rest by date.
    // Location not known -> LIVE first, then by date (as before).
    const all = useMemo(() => {
        const withDistance = events.map((event) =>
            distances[event.id] != null ? { ...event, distance_km: distances[event.id] } : event
        );
        const split = splitEvents(withDistance);

        const rank = (event) => {
            const live = Boolean(now && isEventLive(event, now));
            if (event.distance_km != null) return live ? 0 : 1;
            return live ? 2 : 3;
        };

        // Array sort is stable -> same rank keeps date order; nearby ones nearest first
        split.upcoming = [...split.upcoming].sort(
            (a, b) => rank(a) - rank(b) || (rank(a) <= 1 ? a.distance_km - b.distance_km : 0)
        );

        return split;
    }, [events, distances, now]);

    const term = search.trim().toLowerCase();
    const filtering = Boolean(term || city || type);

    const matches = (event) =>
        (!city || event.city === city) &&
        (!type || event.event_type === type) &&
        (!term ||
            [event.title, event.organizer_name, event.brand_name, event.location, event.city, event.builders_attending]
                .some((value) => String(value || "").toLowerCase().includes(term)));

    // Events within 50 km of the visitor (location from IP), nearest first
    const nearbyEvents = all.upcoming.filter((event) => event.distance_km != null);

    // Upcoming tab: events near visitor -> only those (far cities hidden).
    // Search / city / type filter -> all matching events, so other cities can still be found.
    // None nearby / location unknown -> all events (as before).
    const upcoming = (filtering || nearbyEvents.length === 0 ? all.upcoming : nearbyEvents).filter(matches);
    const past = all.past.filter(matches);

    // Big cards - only while not filtering:
    // events near visitor -> nearby LIVE events (or the nearest event if none is live);
    // none nearby / location unknown -> all LIVE events (or the next event if none is live)
    const liveEvents = now ? all.upcoming.filter((event) => isEventLive(event, now)) : [];
    const nearbyLive = nearbyEvents.filter((event) => liveEvents.includes(event));

    const featuredSource = nearbyEvents.length > 0
        ? (nearbyLive.length > 0 ? nearbyLive : nearbyEvents.slice(0, 1))
        : (liveEvents.length > 0 ? liveEvents : all.upcoming.slice(0, 1));

    const featuredList = !filtering && tab === "upcoming" ? featuredSource : [];

    const list = (tab === "upcoming" ? upcoming : past).filter((event) => !featuredList.includes(event));

    const resetFilters = () => {
        setSearch("");
        setCity("");
        setType("");
    };

    const stats = [
        [all.upcoming.length, "Upcoming Events"],
        [cities.length, cities.length === 1 ? "City" : "Cities"],
        [all.past.length, "Events Hosted"],
    ];

    return (
        <>
            {/* Hero with banner image (centered) */}
            <section className="relative overflow-hidden pb-24 pt-12 lg:pb-28 lg:pt-16">
                {/* Image: Admin -> Banner (type: Events Page) */}
                <PageBannerImage
                    type="events"
                    initialBanner={initialBanner}
                    alt="Property events banner"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(120deg, rgba(18,48,95,0.88) 0%, rgba(27,67,128,0.75) 60%, rgba(46,94,158,0.60) 100%)",
                    }}
                />

                <div className="container relative text-center">
                    {/* Breadcrumb */}
                    {/* <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-center gap-2 text-[14px] text-white/80">
                        <NextLink href="/" className="text-white/80 no-underline hover:text-[#F2B544]">
                            Home
                        </NextLink>
                        <FaChevronRight size={10} className="text-white/60" />
                        <span className="font-semibold text-[#F2B544]">Events</span>
                    </nav> */}

                    <div className="mx-auto max-w-3xl">
                        {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#F2B544]">
                            <FaCalendarAlt /> Property Events & Expos
                        </span> */}
                        <h1 className="mb-0 mt-4 text-[32px] font-extrabold leading-tight text-white lg:text-[48px]">
                            Discover Real Estate <span className="text-[#F2B544]">Events Near You</span>
                        </h1>
                        <p className="mx-auto mb-0 mt-3 max-w-2xl text-[16px] leading-7 text-white/80 lg:text-[18px]">
                            Property expos, project launches and investor meets — meet builders, grab event-only offers
                            and get expert advice in person.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-8 lg:gap-14">
                        {stats.map(([value, label]) => (
                            <div key={label}>
                                <p className="mb-0 text-[30px] font-extrabold leading-none text-white">{value}</p>
                                <p className="mb-0 mt-1 text-[13px] text-white/70">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container relative -mt-14 pb-14">
                {/* Search bar */}
                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-3 shadow-[0_14px_40px_rgba(18,48,95,0.15)] md:grid-cols-[1fr_200px_200px_auto]">
                    <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-4">
                        <FaSearch className="shrink-0 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search event, builder or venue..."
                            className="h-12 w-full bg-transparent text-[15px] outline-none"
                        />
                    </label>

                    <select
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        aria-label="Filter by city"
                        className="h-12 rounded-xl bg-gray-50 px-4 text-[15px] text-[var(--text-color1)] outline-none"
                    >
                        <option value="">All Cities</option>
                        {cities.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>

                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        aria-label="Filter by event type"
                        className="h-12 rounded-xl bg-gray-50 px-4 text-[15px] text-[var(--text-color1)] outline-none"
                    >
                        <option value="">All Event Types</option>
                        {types.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="h-12 rounded-xl bg-[var(--primary-color)] px-6 text-[15px] font-semibold text-white transition hover:bg-[#d96818]"
                    >
                        {filtering ? "Clear" : "Search"}
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="mt-10">
                        <EmptyState title="No events announced yet" text="Exciting property events are on their way. Check back soon!" />
                    </div>
                ) : (
                    <>
                        {/* Upcoming / Past + type chips */}
                        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="inline-flex w-fit rounded-xl bg-gray-100 p-1">
                                {[
                                    ["upcoming", "Upcoming", upcoming.length],
                                    ["past", "Past Events", past.length],
                                ].map(([key, label, count]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTab(key)}
                                        className={`rounded-lg px-5 py-2 text-[14px] font-semibold transition ${tab === key
                                            ? "bg-white text-[var(--secondary-color)] shadow"
                                            : "text-[var(--text-color2)] hover:text-[var(--text-color1)]"
                                            }`}
                                    >
                                        {label}
                                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${tab === key ? "bg-[var(--primary-color)] text-white" : "bg-gray-200"}`}>
                                            {count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {types.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {[["", "All"], ...types].map(([value, label]) => (
                                        <button
                                            key={value || "all"}
                                            type="button"
                                            onClick={() => setType(value)}
                                            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${type === value
                                                ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                                                : "border-gray-200 bg-white text-[var(--text-color2)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Featured: all LIVE events (or next event if none live).
                            Ads (Admin -> Ads, "Events") sit left / right of this big card */}
                        {featuredList.length > 0 && (
                            <SideAds page="events" sticky={false} railClass="lg:mt-6" wrapClass="" mobileGap="mt-6">
                                <div className="mt-6 space-y-6">
                                    {featuredList.map((event, index) => (
                                        <FeaturedEvent key={event.id} event={event} index={index} />
                                    ))}
                                </div>
                            </SideAds>
                        )}

                        {list.length > 0 ? (
                            <>
                                {featuredList.length > 0 && (
                                    <h2 className="mb-0 mt-12 text-[22px] font-bold text-[var(--text-color1)]">More Upcoming Events</h2>
                                )}
                                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {list.map((event, index) => (
                                        <div key={event.id} className="relative">
                                            <EventCard event={event} />
                                            {/* Card icon (top-right corner) */}
                                            <EventIcon
                                                event={event}
                                                index={index + 1}
                                                className="absolute -top-3 right-4 z-10"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : featuredList.length === 0 ? (
                            <div className="mt-6">
                                {filtering ? (
                                    <EmptyState
                                        title="No events match your search"
                                        text="Try a different city, event type or keyword."
                                        onReset={resetFilters}
                                    />
                                ) : (
                                    <EmptyState
                                        title={tab === "upcoming" ? "No upcoming events right now" : "No past events yet"}
                                        text={tab === "upcoming" ? "New events are added regularly. Check back soon!" : "Completed events will show up here."}
                                    />
                                )}
                            </div>
                        ) : null}
                    </>
                )}


                {/* Why attend */}
                <div className="mt-16">
                    <h2 className="mb-0 text-center text-[24px] font-extrabold text-[var(--text-color1)] lg:text-[28px]">
                        Why Attend Property Events?
                    </h2>
                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {WHY_ATTEND.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary-color)]">
                                    <Icon size={22} />
                                </span>
                                <h3 className="mb-0 mt-4 text-[17px] font-bold text-[var(--text-color1)]">{title}</h3>
                                <p className="mb-0 mt-1.5 text-[14px] leading-6 text-[var(--text-color2)]">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Post your event CTA */}
                <div
                    className="mt-16 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl px-7 py-9 lg:flex-row lg:items-center lg:px-12"
                    style={{ background: "linear-gradient(110deg, #E87722 0%, #F2A33A 100%)" }}
                >
                    <div>
                        <h2 className="mb-0 text-[24px] font-extrabold text-white lg:text-[30px]">Organising a property event?</h2>
                        <p className="mb-0 mt-1.5 max-w-xl text-[15px] text-white/90">
                            Post it on bhumimanthan and reach genuine buyers, investors and channel partners across India.
                        </p>
                    </div>
                    <NextLink
                        href="/admin/event/add"
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-[var(--primary-color)] no-underline shadow transition hover:bg-[var(--secondary-color)] hover:text-white"
                    >
                        Post Your Event <FaArrowRight size={12} />
                    </NextLink>
                </div>
            </section>
        </>
    );
}
