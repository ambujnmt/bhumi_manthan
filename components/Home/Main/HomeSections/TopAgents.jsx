"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiHome, FiMapPin, FiNavigation } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import useUserLocation from "../../../../utils/useUserLocation";
import { getNearbyAgents } from "../../../../utils/fetchApi";
import { formatDistance } from "../../../../utils/formatPrice";
import AgentStars, { AgentAvatar } from "./AgentStars";
import AgentDetailModal from "./AgentDetailModal";

// Slider shows up to this many sellers / brokers
const MAX_ON_HOME = 12;

// Same agent key as backend (AgentController): "p" + last 10 phone digits, else "n-" + name slug
const agentKey = (name, phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length >= 10) return `p${digits.slice(-10)}`;

    const slug = String(name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug ? `n-${slug}` : null;
};

/**
 * Agents API not available -> agents from the home page properties, empty rating.
 */
const agentsFromProperties = (properties) => {
    const groups = new Map();

    properties.forEach((property) => {
        const name = String(property?.agent_name || "").trim();
        const key = name && agentKey(name, property.agent_phone);
        if (!key) return;

        const agent = groups.get(key) || {
            key,
            name,
            type: property.agent_type ? property.agent_type.charAt(0).toUpperCase() + property.agent_type.slice(1).toLowerCase() : "Agent",
            phone: property.agent_phone || null,
            experience: property.agent_experience || null,
            image: null,
            verified: false,
            cities: [],
            properties: [],
            distance_km: null,
            rating_avg: 0,
            rating_count: 0,
        };

        if (agent.properties.some((item) => item.id === property.id)) return;

        agent.properties.push(property);
        agent.image = agent.image || property.agent_image || null;
        agent.verified = agent.verified || Boolean(property.agent_verified);
        if (property.city && !agent.cities.includes(property.city) && agent.cities.length < 3) agent.cities.push(property.city);
        if (property.distance_km != null) {
            agent.distance_km = agent.distance_km == null ? Number(property.distance_km) : Math.min(agent.distance_km, Number(property.distance_km));
        }

        groups.set(key, agent);
    });

    return [...groups.values()]
        .map((agent) => ({ ...agent, properties_count: agent.properties.length, fallback: true }))
        // Nearest first, then most properties
        .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity) || b.properties_count - a.properties_count)
        .slice(0, MAX_ON_HOME);
};

/**
 * "Top Rated Sellers & Brokers" slider (home page + property detail page).
 * Same as home properties: sellers / brokers near a place (within 50 km) first ("Near You"),
 * nobody nearby / no location -> normal list, so the section never goes blank. Top rated first.
 * Card click -> detail modal.
 *
 * near        = { latitude, longitude, city } to search around (property detail: the property);
 *               not given -> visitor's IP location (home page)
 * nearLabel   = place name for the "near ..." heading (default: "You")
 * properties + propertiesNearby = listings on the page, used only when the agents API is not available
 */
export default function TopAgents({ properties = [], propertiesNearby = false, near = null, nearLabel = "", className = "mt-[60px]" }) {
    const visitor = useUserLocation();

    // Fixed place (property) -> no IP detection wait. Key keeps the effect from re-running on new objects.
    const nearLat = Number(near?.latitude);
    const nearLng = Number(near?.longitude);
    const hasNear = Boolean(near) && Number.isFinite(nearLat) && Number.isFinite(nearLng) && (nearLat !== 0 || nearLng !== 0);
    const nearKey = hasNear ? `${nearLat},${nearLng}` : "";

    const location = useMemo(
        () => (hasNear ? { latitude: nearLat, longitude: nearLng, city: near?.city || null } : visitor.location),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [nearKey, visitor.location]
    );
    const ready = near ? true : visitor.ready;

    const [apiAgents, setApiAgents] = useState([]);
    const [apiNearby, setApiNearby] = useState(false);
    const [apiFailed, setApiFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!ready) return;

        let active = true;

        // Location -> nearby first (API itself falls back to all with nearby=false); no location -> all
        getNearbyAgents(location, MAX_ON_HOME).then((res) => {
            if (!active) return;

            setApiAgents(Array.isArray(res?.data?.agents) ? res.data.agents : []);
            setApiNearby(Boolean(res?.status && res?.data?.nearby));
            setApiFailed(!res?.status);
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [ready, location]);

    // Agents API not available -> sellers / brokers of the properties shown on home, ratings empty
    const fallbackAgents = useMemo(() => agentsFromProperties(properties), [properties]);
    const [ratedFallback, setRatedFallback] = useState({});

    const usingFallback = apiFailed;
    const agents = usingFallback
        ? fallbackAgents.map((agent) => ({ ...agent, ...ratedFallback[agent.key] }))
        : apiAgents;
    const nearby = usingFallback ? propertiesNearby : apiNearby;

    // New rating from the modal -> update the card too
    const handleRated = (key, summary) => {
        if (usingFallback) {
            setRatedFallback((previous) => ({ ...previous, [key]: summary }));
        } else {
            setApiAgents((list) => list.map((agent) => (agent.key === key ? { ...agent, ...summary } : agent)));
        }
        setSelected((agent) => (agent?.key === key ? { ...agent, ...summary } : agent));
    };

    /* ---------- Slider ---------- */
    const [perView, setPerView] = useState(4);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef(null);

    useEffect(() => {
        const update = () => {
            const width = window.innerWidth;
            setPerView(width < 640 ? 1 : width < 1024 ? 2 : width < 1280 ? 3 : 4);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const slideCount = loading ? perView : agents.length;
    const maxIndex = Math.max(slideCount - perView, 0);

    // Fewer cards / bigger screen -> stay in range
    useEffect(() => {
        setIndex((current) => Math.min(current, maxIndex));
    }, [maxIndex]);

    const goTo = (value) => setIndex(value > maxIndex ? 0 : value < 0 ? maxIndex : value);

    // Auto slide every 4 sec (stops on hover / focus / open modal)
    useEffect(() => {
        if (loading || maxIndex === 0 || paused || selected) return;

        const timer = setInterval(() => setIndex((current) => (current >= maxIndex ? 0 : current + 1)), 4000);
        return () => clearInterval(timer);
    }, [loading, maxIndex, paused, selected]);

    const onTouchEnd = (event) => {
        if (touchStart.current === null) return;

        const moved = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;

        if (Math.abs(moved) > 40) goTo(index + (moved < 0 ? 1 : -1));
    };

    if (!loading && agents.length === 0) return null;

    const arrowClass =
        "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-[var(--primary-color)] shadow-md transition hover:bg-[var(--primary-color)] hover:text-white sm:flex";

    return (
        <section className={`w-full bg-[#F5F7FA] py-14 px-4 sm:px-8 ${className}`}>
            <div className="container">
                <div className="mb-8 text-center">
                    <h2 className="text-[28px] font-bold text-[var(--text-color1)]">
                        {nearby ? `Top Rated Sellers & Brokers Near ${nearLabel || "You"}` : "Top Rated Sellers & Brokers"}
                    </h2>
                    <p className="text-[16px] text-[var(--text-color2)] mb-0">
                        {nearby && location?.city
                            ? `Verified property experts around ${location.city}, rated by buyers on bhumimanthan.com`
                            : "Verified property experts rated by buyers on bhumimanthan.com"}
                    </p>
                </div>

                <div
                    className="relative"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    {maxIndex > 0 && (
                        <>
                            <button type="button" aria-label="Previous" onClick={() => goTo(index - 1)} className={`${arrowClass} -left-5`}>
                                <FiChevronLeft size={20} />
                            </button>
                            <button type="button" aria-label="Next" onClick={() => goTo(index + 1)} className={`${arrowClass} -right-5`}>
                                <FiChevronRight size={20} />
                            </button>
                        </>
                    )}

                    {/* py so the card hover lift / focus ring is not cut off */}
                    <div
                        className="overflow-hidden py-2"
                        onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
                        onTouchEnd={onTouchEnd}
                    >
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
                    >
                    {loading
                        ? Array.from({ length: perView }).map((_, idx) => (
                            <div key={idx} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
                                <div className="h-[230px] animate-pulse rounded-2xl border border-gray-200 bg-white" />
                            </div>
                        ))
                        : agents.map((agent) => {
                            const distance = formatDistance(agent.distance_km);

                            return (
                                <div key={agent.key} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(agent)}
                                    className="group flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <AgentAvatar agent={agent} />
                                        <div className="min-w-0">
                                            <p className="mb-0 flex items-center gap-1 text-[15px] font-bold text-[var(--text-color1)]">
                                                <span className="truncate">{agent.name}</span>
                                                {agent.verified && (
                                                    <MdVerified className="shrink-0 text-[#3B82F6]" size={16} title="Verified" />
                                                )}
                                            </p>
                                            <span className="mt-1 inline-block rounded-full bg-[#FFECD3] px-2 py-[2px] text-[11px] font-semibold text-[var(--primary-color)]">
                                                {agent.type}
                                                {agent.experience ? ` · ${agent.experience}` : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <AgentStars rating={agent.rating_avg} />
                                        <span className="text-[13px] font-semibold text-[var(--text-color1)]">
                                            {agent.rating_count > 0 ? Number(agent.rating_avg).toFixed(1) : ""}
                                        </span>
                                        <span className="text-[12px] text-[var(--text-color2)]">
                                            {agent.rating_count > 0
                                                ? `(${agent.rating_count} ${agent.rating_count === 1 ? "rating" : "ratings"})`
                                                : "No ratings yet"}
                                        </span>
                                    </div>

                                    <div className="mt-auto space-y-1 pt-4 text-[12px] text-[var(--text-color2)]">
                                        {agent.cities?.length > 0 && (
                                            <p className="mb-0 flex items-center gap-1">
                                                <FiMapPin className="shrink-0" />
                                                <span className="truncate">{agent.cities.join(", ")}</span>
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="mb-0 flex items-center gap-1">
                                                <FiHome className="shrink-0" />
                                                {agent.properties_count} {agent.properties_count === 1 ? "property" : "properties"}
                                            </p>
                                            {distance && (
                                                <p className="mb-0 flex items-center gap-1">
                                                    <FiNavigation className="shrink-0" size={11} /> {distance}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span className="mt-4 block rounded-lg border border-[var(--primary-color)] py-2 text-center text-[13px] font-semibold text-[var(--primary-color)] transition group-hover:bg-[var(--primary-color)] group-hover:text-white">
                                        View Details
                                    </span>
                                </button>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                </div>

                {/* Dots */}
                {maxIndex > 0 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                aria-label={`Go to slide ${idx + 1}`}
                                aria-current={idx === index}
                                onClick={() => goTo(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    idx === index ? "w-6 bg-[var(--primary-color)]" : "w-2 bg-gray-300 hover:bg-gray-400"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AgentDetailModal agent={selected} onClose={() => setSelected(null)} onRated={handleRated} />
        </section>
    );
}
