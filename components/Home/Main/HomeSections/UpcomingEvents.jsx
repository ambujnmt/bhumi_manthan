import NextLink from "next/link";
import React, { useEffect, useMemo, useState } from 'react'
import { FaArrowRight } from "react-icons/fa";
import { getEvents } from "../../../../utils/fetchApi";
import useUserLocation from "../../../../utils/useUserLocation";
import useNow from "../../../../utils/useNow";
import EventCard from "../../../Innerpages/Events/EventCard";
import { isEventLive, splitEvents } from "../../../Innerpages/Events/eventUtils";

const MAX_ON_HOME = 3;

/**
 * Home "Upcoming Property Events": same as properties, events near the visitor
 * (IP location) first, otherwise all upcoming events. LIVE events come first.
 */
export default function UpcomingEvents() {
    const { ready, location } = useUserLocation();
    const now = useNow(30000);

    const [events, setEvents] = useState([]);
    const [nearby, setNearby] = useState(false);

    useEffect(() => {
        if (!ready) return;

        let active = true;

        const upcomingOf = (res) =>
            res?.status && Array.isArray(res?.data?.events) ? splitEvents(res.data.events).upcoming : [];

        const fetchEvents = async () => {
            try {
                // Near user first (old API ignores location and has no data.location -> not "near you")
                const nearRes = location ? await getEvents(20, location).catch(() => null) : null;
                const near = nearRes?.data?.location ? upcomingOf(nearRes) : [];

                if (near.length > 0) {
                    if (active) {
                        setEvents(near);
                        setNearby(true);
                    }
                    return;
                }

                const all = upcomingOf(await getEvents(20));

                if (active) {
                    setEvents(all);
                    setNearby(false);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };

        fetchEvents();

        return () => {
            active = false;
        };
    }, [ready, location]);

    // LIVE first, then soonest (already sorted by date)
    const shown = useMemo(() => {
        if (!now) return events.slice(0, MAX_ON_HOME);

        const live = events.filter((event) => isEventLive(event, now));

        return [...live, ...events.filter((event) => !live.includes(event))].slice(0, MAX_ON_HOME);
    }, [events, now]);

    // Hide section when no upcoming event
    if (shown.length === 0) {
        return null;
    }

    return (
        <section className="container mt-[60px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {nearby ? "Upcoming Property Events Near You" : "Upcoming Property Events"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Meet builders, explore new launches and get expert advice in person
                    </p>
                </div>
                <NextLink href="/web/events" className="shrink-0 no-underline">
                    <h6 className="text-[var(--text-color3)] text-[15px] font-semibold flex items-center hover:text-[var(--primary-color)] whitespace-nowrap">
                        View All Events &nbsp; <FaArrowRight />
                    </h6>
                </NextLink>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-[30px]">
                {shown.map((event) => (
                    <div key={event.id} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                        <EventCard event={event} />
                    </div>
                ))}
            </div>
        </section>
    )
}
