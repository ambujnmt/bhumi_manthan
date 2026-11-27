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
const AUTO_SLIDE_MS = 4000;

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

/* ---------- Animation styles (plain CSS, no extra library needed) ---------- */
const css = `
@property --ta-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

@keyframes ta-spin   { to { --ta-angle: 360deg; } }
@keyframes ta-rise   { from { opacity: 0; transform: translateY(48px) scale(.94); } to { opacity: 1; transform: none; } }
@keyframes ta-title  { from { opacity: 0; transform: translateY(18px); letter-spacing: .04em; } to { opacity: 1; transform: none; letter-spacing: 0; } }
@keyframes ta-float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.15); } }
@keyframes ta-float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-70px,-30px) scale(1.2); } }
@keyframes ta-fill   { from { width: 0; } to { width: 100%; } }
@keyframes ta-pulse  { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,.55); } 100% { box-shadow: 0 0 0 9px rgba(59,130,246,0); } }

.ta-section { background: linear-gradient(135deg, #151B33 0%, #1E2747 55%, #2A1F3D 100%); }

.ta-blob { position: absolute; border-radius: 9999px; filter: blur(70px); pointer-events: none; }
.ta-blob--1 { width: 340px; height: 340px; top: -90px; left: -60px; background: rgba(255,122,0,.35); animation: ta-float1 14s ease-in-out infinite; }
.ta-blob--2 { width: 380px; height: 380px; bottom: -120px; right: -80px; background: rgba(99,102,241,.35); animation: ta-float2 17s ease-in-out infinite; }

.ta-title { animation: ta-title .8s cubic-bezier(.2,.7,.2,1) both; }
.ta-sub   { animation: ta-title .8s .12s cubic-bezier(.2,.7,.2,1) both; }

/* entrance: cards rise one after another (runs once when section scrolls into view) */
.ta-slide { perspective: 900px; }
.ta-slide--in { animation: ta-rise .7s cubic-bezier(.2,.7,.2,1) both; }

/* Simple and premium card hover */
.ta-tilt {
    height: 100%;
    transition: transform .3s ease, opacity .5s ease;
}

.ta-tilt:hover {
    transform: translateY(-6px);
}

/* Card styling */
.ta-card {
    position: relative;
    isolation: isolate;
    border: 1px solid rgba(255,255,255,.08);
    box-shadow: 0 10px 30px rgba(0,0,0,.20);
    transition:
        box-shadow .3s ease,
        border-color .3s ease;
}

.ta-tilt:hover .ta-card {
    border-color: var(--primary-color, #F97316);
    box-shadow: 0 16px 35px rgba(0,0,0,.25);
}

/* Remove rotating border and cursor glare */
.ta-card::before,
.ta-glare {
    display: none !important;
}

/* Simple avatar hover */
.ta-ring {
    padding: 3px;
    border-radius: 9999px;
    flex-shrink: 0;
    background: linear-gradient(
        135deg,
        var(--primary-color, #F97316),
        #FFD27A
    );
    transition: transform .3s ease;
}

.ta-tilt:hover .ta-ring {
    transform: scale(1.06);
}

.ta-ring > span {
    display: block;
    border-radius: 9999px;
    background: #fff;
    padding: 2px;
}
.ta-verified { border-radius: 9999px; animation: ta-pulse 1.8s ease-out infinite; }

/* button fills from the left on hover */
.ta-cta {
    background: linear-gradient(90deg, var(--primary-color, #F97316), var(--primary-color, #F97316)) no-repeat left center / 0% 100%;
    transition: background-size .4s ease, color .3s ease;
}
.ta-tilt:hover .ta-cta { background-size: 100% 100%; color: #fff; }

.ta-arrow { backdrop-filter: blur(8px); transition: transform .25s ease, background-color .25s ease, box-shadow .25s ease; }
.ta-arrow:hover { transform: translateY(-50%) scale(1.12); box-shadow: 0 0 0 6px rgba(255,122,0,.25); }
.ta-arrow:active { transform: translateY(-50%) scale(.95); }

.ta-progress { animation: ta-fill ${AUTO_SLIDE_MS}ms linear forwards; }

@media (prefers-reduced-motion: reduce) {
    .ta-blob, .ta-title, .ta-sub, .ta-slide--in, .ta-ring, .ta-verified, .ta-card::before, .ta-progress { animation: none !important; }
    .ta-tilt { transition: none; transform: none !important; }
}
`;

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
    const [inView, setInView] = useState(false);
    const touchStart = useRef(null);
    const sectionRef = useRef(null);

    useEffect(() => {
        const update = () => {
            const width = window.innerWidth;
            setPerView(width < 640 ? 1 : width < 1024 ? 2 : width < 1280 ? 3 : 4);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Play the entrance animation once, when the section scrolls into view
    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return;

        if (typeof IntersectionObserver === "undefined") {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [loading, agents.length]);

    const slideCount = loading ? perView : agents.length;
    const maxIndex = Math.max(slideCount - perView, 0);

    // Fewer cards / bigger screen -> stay in range
    useEffect(() => {
        setIndex((current) => Math.min(current, maxIndex));
    }, [maxIndex]);

    const goTo = (value) => setIndex(value > maxIndex ? 0 : value < 0 ? maxIndex : value);

    // Auto slide every 4 sec (stops on hover / focus / open modal). Timer restarts on every slide change,
    // so the progress bar below always matches it.
    const autoPlaying = !loading && maxIndex > 0 && !paused && !selected;

    useEffect(() => {
        if (!autoPlaying) return;

        const timer = setTimeout(() => setIndex((current) => (current >= maxIndex ? 0 : current + 1)), AUTO_SLIDE_MS);
        return () => clearTimeout(timer);
    }, [autoPlaying, index, maxIndex]);

    const onTouchEnd = (event) => {
        if (touchStart.current === null) return;

        const moved = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;

        if (Math.abs(moved) > 40) goTo(index + (moved < 0 ? 1 : -1));
    };


    if (!loading && agents.length === 0) return null;

    const arrowClass =
        "ta-arrow absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-[var(--primary-color)] sm:flex";

    return (
        <section ref={sectionRef} className={`ta-section relative w-full overflow-hidden py-16 px-4 sm:px-8 ${className}`}>
            <style dangerouslySetInnerHTML={{ __html: css }} />

            {/* slow floating glows behind the slider */}
            <div className="ta-blob ta-blob--1" aria-hidden="true" />
            <div className="ta-blob ta-blob--2" aria-hidden="true" />

            <div className="container relative">
                <div className="mb-10 text-center">
                    <h2 className="ta-title text-[28px] font-bold text-white sm:text-[32px]">
                        {nearby ? `Top Rated Sellers & Brokers Near ${nearLabel || "You"}` : "Top Rated Sellers & Brokers"}
                    </h2>
                    <p className="ta-sub mb-0 text-[16px] text-slate-300">
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

                    {/* py so the card hover lift / tilt / focus ring is not cut off */}
                    <div
                        className="overflow-hidden py-6"
                        onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-700 ease-[cubic-bezier(.65,0,.35,1)]"
                            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
                        >
                            {loading
                                ? Array.from({ length: perView }).map((_, idx) => (
                                    <div key={idx} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
                                        <div className="h-[230px] animate-pulse rounded-2xl border border-white/10 bg-white/10" />
                                    </div>
                                ))
                                : agents.map((agent, idx) => {
                                    const distance = formatDistance(agent.distance_km);
                                    const visible = idx >= index && idx < index + perView;

                                    return (
                                        <div
                                            key={agent.key}
                                            className={`ta-slide shrink-0 px-2 ${inView ? "ta-slide--in" : "opacity-0"}`}
                                            style={{ width: `${100 / perView}%`, animationDelay: `${Math.min(idx, 6) * 90}ms` }}
                                        >
                                           <div className="ta-tilt" data-visible={visible}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(agent)}
                                                    className="ta-card group flex h-full w-full flex-col rounded-2xl bg-white p-4 text-left focus:outline-none"
                                                >

                                                    <div className="flex items-center gap-3">
                                                        <div className="ta-ring">
                                                            <span>
                                                                <AgentAvatar agent={agent} />
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="mb-0 flex items-center gap-1 text-[15px] font-bold text-[var(--text-color1)]">
                                                                <span className="truncate">{agent.name}</span>
                                                                {agent.verified && (
                                                                    <span className="ta-verified inline-flex shrink-0">
                                                                        <MdVerified className="text-[#3B82F6]" size={16} title="Verified" />
                                                                    </span>
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

                                                    <span className="ta-cta mt-4 block rounded-lg border border-[var(--primary-color)] py-2 text-center text-[13px] font-semibold text-[var(--primary-color)]">
                                                        View Details
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Dots + autoplay progress */}
                {maxIndex > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    aria-label={`Go to slide ${idx + 1}`}
                                    aria-current={idx === index}
                                    onClick={() => goTo(idx)}
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        idx === index ? "w-8 bg-[var(--primary-color)]" : "w-2 bg-white/30 hover:bg-white/60"
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="h-[3px] w-40 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                            <div
                                key={`${index}-${autoPlaying}`}
                                className="ta-progress h-full rounded-full bg-[var(--primary-color)]"
                                style={{ animationPlayState: autoPlaying ? "running" : "paused", width: autoPlaying ? undefined : 0 }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <AgentDetailModal agent={selected} onClose={() => setSelected(null)} onRated={handleRated} />
        </section>
    );
}
