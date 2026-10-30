import NextLink from "next/link";
import React, { useEffect, useState } from 'react'
import { FaArrowRight } from "react-icons/fa";
import { getEvents } from "../../../../utils/fetchApi";
import EventCard from "../../../Innerpages/Events/EventCard";
import { splitEvents } from "../../../Innerpages/Events/eventUtils";

export default function UpcomingEvents() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await getEvents(20);

                if (res?.status && Array.isArray(res?.data?.events)) {
                    setEvents(splitEvents(res.data.events).upcoming.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };

        fetchEvents();
    }, []);

    // Hide section when no upcoming event
    if (events.length === 0) {
        return null;
    }

    return (
        <section className="container mt-[60px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Upcoming Property Events
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
                {events.map((event) => (
                    <div key={event.id} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                        <EventCard event={event} />
                    </div>
                ))}
            </div>
        </section>
    )
}
