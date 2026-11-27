
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    FiHome,
    FiMapPin,
    FiNavigation,
    FiStar,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";

import useUserLocation from "../../../utils/useUserLocation";
import { getNearbyAgents } from "../../../utils/fetchApi";
import { formatDistance } from "../../../utils/formatPrice";
import AgentStars, { AgentAvatar } from "../../Home/Main/HomeSections/AgentStars";
import AgentDetailModal from "../../Home/Main/HomeSections/AgentDetailModal";

const MAX_REVIEWS = 50;

const agentKey = (name, phone) => {
    const digits = String(phone || "").replace(/\D/g, "");

    if (digits.length >= 10) return `p${digits.slice(-10)}`;

    const slug = String(name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug ? `n-${slug}` : null;
};

const agentsFromProperties = (properties = []) => {
    const groups = new Map();

    properties.forEach((property) => {
        const name = String(property?.agent_name || "").trim();
        const key = name && agentKey(name, property.agent_phone);

        if (!key) return;

        const agent = groups.get(key) || {
            key,
            name,
            type: property.agent_type
                ? property.agent_type.charAt(0).toUpperCase() +
                  property.agent_type.slice(1).toLowerCase()
                : "Agent",
            phone: property.agent_phone || null,
            experience: property.agent_experience || null,
            image: property.agent_image || null,
            verified: Boolean(property.agent_verified),
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

        if (
            property.city &&
            !agent.cities.includes(property.city) &&
            agent.cities.length < 3
        ) {
            agent.cities.push(property.city);
        }

        if (property.distance_km != null) {
            agent.distance_km =
                agent.distance_km == null
                    ? Number(property.distance_km)
                    : Math.min(
                          agent.distance_km,
                          Number(property.distance_km)
                      );
        }

        groups.set(key, agent);
    });

    return [...groups.values()]
        .map((agent) => ({
            ...agent,
            properties_count: agent.properties.length,
            fallback: true,
        }))
        .sort(
            (a, b) =>
                (b.rating_avg || 0) - (a.rating_avg || 0) ||
                (a.distance_km ?? Infinity) -
                    (b.distance_km ?? Infinity) ||
                b.properties_count - a.properties_count
        );
};

export default function ReviewList({
    properties = [],
    propertiesNearby = false,
    near = null,
    nearLabel = "",
}) {
    const visitor = useUserLocation();

    const nearLat = Number(near?.latitude);
    const nearLng = Number(near?.longitude);

    const hasNear =
        Boolean(near) &&
        Number.isFinite(nearLat) &&
        Number.isFinite(nearLng) &&
        (nearLat !== 0 || nearLng !== 0);

    const nearKey = hasNear ? `${nearLat},${nearLng}` : "";

    const location = useMemo(
        () =>
            hasNear
                ? {
                      latitude: nearLat,
                      longitude: nearLng,
                      city: near?.city || null,
                  }
                : visitor.location,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [nearKey, visitor.location]
    );

    const ready = near ? true : visitor.ready;

    const [apiAgents, setApiAgents] = useState([]);
    const [apiFailed, setApiFailed] = useState(false);
    const [apiNearby, setApiNearby] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("all");
    const [ratedFallback, setRatedFallback] = useState({});

    useEffect(() => {
        if (!ready) return;

        let active = true;

        setLoading(true);

        getNearbyAgents(location, MAX_REVIEWS)
            .then((res) => {
                if (!active) return;

                setApiAgents(
                    Array.isArray(res?.data?.agents)
                        ? res.data.agents
                        : []
                );

                setApiNearby(
                    Boolean(res?.status && res?.data?.nearby)
                );

                setApiFailed(!res?.status);
                setLoading(false);
            })
            .catch((err) => {
                if (!active) return;

                console.error("Review API error:", err);

                setApiAgents([]);
                setApiFailed(true);
                setApiNearby(false);
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [ready, location]);

    const fallbackAgents = useMemo(
        () => agentsFromProperties(properties),
        [properties]
    );

    const usingFallback = apiFailed;

    const agents = useMemo(() => {
        const list = usingFallback
            ? fallbackAgents.map((agent) => ({
                  ...agent,
                  ...ratedFallback[agent.key],
              }))
            : apiAgents;

        return [...list].sort(
            (a, b) =>
                (Number(b.rating_avg) || 0) -
                    (Number(a.rating_avg) || 0) ||
                (Number(b.rating_count) || 0) -
                    (Number(a.rating_count) || 0)
        );
    }, [usingFallback, fallbackAgents, ratedFallback, apiAgents]);

    const filteredAgents = useMemo(() => {
        if (filter === "all") return agents;

        return agents.filter(
            (agent) =>
                String(agent.type || "").toLowerCase() === filter
        );
    }, [agents, filter]);

    const nearby = usingFallback ? propertiesNearby : apiNearby;

    const handleRated = (key, summary) => {
        if (usingFallback) {
            setRatedFallback((previous) => ({
                ...previous,
                [key]: summary,
            }));
        } else {
            setApiAgents((previous) =>
                previous.map((agent) =>
                    agent.key === key
                        ? { ...agent, ...summary }
                        : agent
                )
            );
        }

        setSelected((previous) =>
            previous?.key === key
                ? { ...previous, ...summary }
                : previous
        );
    };

    const averageRating = useMemo(() => {
        const rated = agents.filter(
            (agent) => Number(agent.rating_count) > 0
        );

        if (!rated.length) return "0.0";

        const total = rated.reduce(
            (sum, agent) => sum + Number(agent.rating_avg || 0),
            0
        );

        return (total / rated.length).toFixed(1);
    }, [agents]);

    const totalRatings = agents.reduce(
        (sum, agent) => sum + Number(agent.rating_count || 0),
        0
    );

    return (
        <section className="w-full bg-[#F7F8FA] py-10 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">

                {/* Page Heading */}
                <div className="mb-7 flex flex-col items-center text-center">
                    <span className="mb-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
                        Customer Feedback
                    </span>

                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Seller & Broker Reviews
                    </h2>

                    <p className="mt-1.5 max-w-xl text-sm text-gray-500">
                        Explore trusted property experts and their
                        ratings from buyers on Bhumi Manthan.
                    </p>
                </div>
                
                {/* Premium Summary Cards */}
                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* Total Agents */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-5 text-white shadow-lg shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                        <div className="absolute -bottom-10 -right-2 h-28 w-28 rounded-full bg-white/5" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-100">
                                    Total Agents
                                </p>
                                <h3 className="mt-3 text-3xl font-extrabold tracking-tight">
                                    {agents.length}
                                </h3>
                                <p className="mt-1 text-xs text-blue-100">
                                    Registered property experts
                                </p>
                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="29"
                                    height="29"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="10" cy="7" r="4" />
                                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Average Rating */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] p-5 text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                        <div className="absolute -bottom-10 -right-2 h-28 w-28 rounded-full bg-white/5" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-100">
                                    Average Rating
                                </p>
                                <h3 className="mt-3 flex items-center gap-2 text-3xl font-extrabold tracking-tight">
                                    {averageRating}
                                    <span className="text-2xl text-yellow-200">★</span>
                                </h3>
                                <p className="mt-1 text-xs text-orange-100">
                                    Overall agent performance
                                </p>
                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="text-white"
                                >
                                    <path d="m12 2 2.9 6.1 6.7.9-4.8 4.7 1.1 6.7L12 17.2l-5.9 3.2 1.1-6.7-4.8-4.7 6.7-.9L12 2Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Ratings */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#059669] to-[#047857] p-5 text-white shadow-lg shadow-emerald-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                        <div className="absolute -bottom-10 -right-2 h-28 w-28 rounded-full bg-white/5" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-100">
                                    Total Ratings
                                </p>
                                <h3 className="mt-3 text-3xl font-extrabold tracking-tight">
                                    {totalRatings}
                                </h3>
                                <p className="mt-1 text-xs text-emerald-100">
                                    Ratings submitted by buyers
                                </p>
                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="29"
                                    height="29"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                    <path d="m12 7 1.2 2.4 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4L12 7Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>


                {/* Filters */}
                <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                    {[
                        { label: "All", value: "all" },
                        { label: "Brokers", value: "broker" },
                        { label: "Sellers", value: "seller" },
                    ].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setFilter(item.value)}
                            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
                                filter === item.value
                                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white shadow-sm"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Nearby Label */}
                {nearby && (
                    <p className="mb-4 text-center text-xs text-gray-500">
                        Showing property experts near{" "}
                        <span className="font-semibold text-gray-700">
                            {nearLabel || location?.city || "you"}
                        </span>
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div
                                key={item}
                                className="h-[205px] animate-pulse rounded-xl border border-gray-100 bg-white"
                            />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && filteredAgents.length === 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white py-14 text-center shadow-sm">
                        <div className="mb-2 text-4xl">⭐</div>

                        <h3 className="text-lg font-bold text-gray-800">
                            No Reviews Found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            No seller or broker ratings are available
                            right now.
                        </p>
                    </div>
                )}

                {/* Agent Cards */}
                {!loading && filteredAgents.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAgents.map((agent, index) => {
                            const rating = Number(agent.rating_avg || 0);
                            const ratingCount = Number(agent.rating_count || 0);
                            const distance = formatDistance(agent.distance_km);

                            return (
                                <div
                                    key={agent.key || index}
                                    className="group flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                                >
                                    {/* Profile */}
                                    <div className="flex items-center gap-3">
                                        <div className="shrink-0">
                                            <AgentAvatar agent={agent} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="flex items-center gap-1 truncate text-[15px] font-bold text-gray-900">
                                                <span className="truncate">
                                                    {agent.name || "Agent"}
                                                </span>

                                                {agent.verified && (
                                                    <MdVerified
                                                        className="shrink-0 text-blue-500"
                                                        size={17}
                                                        title="Verified"
                                                    />
                                                )}
                                            </h3>

                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
                                                    {agent.type || "Agent"}
                                                </span>

                                                {agent.experience && (
                                                    <span className="text-[11px] text-gray-500">
                                                        {agent.experience}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="mt-3 flex items-center gap-2 border-y border-gray-100 py-2">
                                        <AgentStars rating={rating} />

                                        <span className="text-sm font-bold text-gray-800">
                                            {ratingCount > 0
                                                ? rating.toFixed(1)
                                                : "New"}
                                        </span>

                                        <span className="text-xs text-gray-400">
                                            ({ratingCount}{" "}
                                            {ratingCount === 1 ? "rating" : "ratings"})
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                                        {agent.cities?.length > 0 && (
                                            <p className="flex items-center gap-2">
                                                <FiMapPin
                                                    className="shrink-0 text-orange-500"
                                                    size={14}
                                                />
                                                <span className="truncate">
                                                    {agent.cities.join(", ")}
                                                </span>
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="flex items-center gap-1.5">
                                                <FiHome
                                                    className="text-orange-500"
                                                    size={14}
                                                />
                                                {agent.properties_count || 0} Properties
                                            </span>

                                            {distance && (
                                                <span className="flex items-center gap-1.5">
                                                    <FiNavigation
                                                        className="text-orange-500"
                                                        size={13}
                                                    />
                                                    {distance}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        type="button"
                                        onClick={() => setSelected(agent)}
                                        className="mt-4 w-full rounded-lg border border-[var(--primary-color)] py-2 text-sm font-semibold text-[var(--primary-color)] transition-all hover:bg-[var(--primary-color)] hover:text-white"
                                    >
                                        View Details & Reviews
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AgentDetailModal
                agent={selected}
                onClose={() => setSelected(null)}
                onRated={handleRated}
            />
        </section>
    );
}
