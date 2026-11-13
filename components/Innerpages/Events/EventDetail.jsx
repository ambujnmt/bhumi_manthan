import NextLink from "next/link";
import React, { useEffect, useState } from "react";
import {
    FaArrowLeft,
    FaBuilding,
    FaCalendarAlt,
    FaCalendarPlus,
    FaClock,
    FaDirections,
    FaFilePdf,
    FaMapMarkerAlt,
    FaUsers,
} from "react-icons/fa";
import { FaChevronRight, FaHome } from "react-icons/fa";
import EventCard from "./EventCard";
import EventRegistrationForm from "./EventRegistrationForm";
import {
    eventCityState,
    formatEventDateRange,
    formatEventTime,
    googleCalendarUrl,
    isUpcomingEvent,
    mapUrl,
} from "./eventUtils";
import SideAds from "../../Common/Ads/SideAds";
import useUserLocation from "../../../utils/useUserLocation";
import { getEvents } from "../../../utils/fetchApi";

export default function EventDetail({ event, moreEvents: serverMoreEvents = [] }) {
    const upcoming = isUpcomingEvent(event);

    // More Events: visitor location (IP) known and events within 50 km -> only those, nearest first
    // (same as the events page). None nearby / location unknown -> list from the server (as before).
    const { ready, location } = useUserLocation();
    const [nearbyEvents, setNearbyEvents] = useState(null);

    useEffect(() => {
        if (!ready || !location) return;

        let active = true;

        getEvents(50, location)
            .then((res) => {
                if (!active) return;

                const nearby = (res?.data?.events || []).filter((item) => item.distance_km != null);

                // Nothing near the visitor -> keep the server list
                if (nearby.length === 0) return;

                // Events near the visitor -> only those (other than this one); far cities hidden
                setNearbyEvents(nearby.filter((item) => item.id !== event.id).slice(0, 3));
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [ready, location, event.id]);

    // null = not checked / nothing nearby -> server list; [] = only this event is nearby -> section hidden
    const moreEvents = nearbyEvents ?? serverMoreEvents;
    const images = event.images?.length ? event.images : event.image ? [{ url: event.image }] : [];
    const [activeImage, setActiveImage] = useState(0);

    const infoItems = [
        {
            icon: FaCalendarAlt,
            label: "Date",
            value: formatEventDateRange(event, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
        },
        {
            icon: FaClock,
            label: "Time",
            value: `${formatEventTime(event.start_time)} - ${formatEventTime(event.end_time)}`,
        },
        {
            icon: FaMapMarkerAlt,
            label: "Venue",
            value: event.location,
            sub: [event.address, eventCityState(event)].filter(Boolean).join(" · "),
        },
        {
            icon: FaUsers,
            label: "Expected Footfall",
            value: event.expected_footfall_label,
        },
    ].filter((item) => item.value);

    return (
        <section className="container pb-10">
            {/* Breadcrumb (same look as property / project detail) */}
            <div className="flex flex-col gap-3 py-[40px] sm:flex-row sm:items-center sm:justify-between">
                <nav aria-label="Breadcrumb" className="min-w-0">
                    <ol className="mb-0 flex flex-wrap items-center gap-1.5 pl-0 text-[13px]">
                        {/* Home */}
                        <li>
                            <NextLink
                                href="/"
                                className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                            >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                    <FaHome className="text-[10px]" />
                                </span>
                                Home
                            </NextLink>
                        </li>

                        <li aria-hidden="true">
                            <FaChevronRight className="text-[9px] text-gray-400" />
                        </li>

                        {/* Events */}
                        <li>
                            <NextLink
                                href="/web/events"
                                className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                            >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                    <FaCalendarAlt className="text-[10px]" />
                                </span>
                                Events
                            </NextLink>
                        </li>

                        <li aria-hidden="true">
                            <FaChevronRight className="text-[9px] text-gray-400" />
                        </li>

                        {/* Current Page */}
                        <li aria-current="page" className="min-w-0">
                            <span className="flex items-center gap-2 rounded-full bg-[var(--secondary-color)] px-3.5 py-1.5 font-semibold text-white shadow-md">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-white">
                                    <FaUsers className="text-[11px]" />
                                </span>
                                <span className="truncate">{event.title}</span>
                            </span>
                        </li>
                    </ol>
                </nav>

                {/* Back Button */}
                <NextLink
                    href="/web/events"
                    className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--primary-color)] px-4 py-1.5 text-[13px] font-semibold text-[var(--primary-color)] no-underline transition hover:bg-[var(--primary-color)] hover:text-white"
                >
                    <FaArrowLeft className="text-[11px]" />
                    Back to Events
                </NextLink>
            </div>

            {/* Accent line */}
            <div className="-mt-6 mb-6 h-[3px] w-full rounded-full bg-gradient-to-r from-[var(--primary-color)] via-[var(--primary-color)]/30 to-transparent" />

            <div className="grid grid-cols-12 gap-6">
                {/* Main content */}
                <div className="col-span-12 lg:col-span-8">
                    {/* Event image. Ads (Admin -> Ads, "Event Detail") sit left / right of it */}
                    {images.length > 0 && (
                        <SideAds page="event_detail" sticky={false} railClass="lg:mt-0" wrapClass="">
                            <div>
                                <img
                                    src={images[activeImage]?.url}
                                    alt={event.title}
                                    className="w-full h-[260px] sm:h-[420px] rounded-2xl object-cover shadow-md"
                                />

                                {images.length > 1 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {images.map((image, index) => (
                                            <button
                                                key={image.url}
                                                type="button"
                                                onClick={() => setActiveImage(index)}
                                                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${index === activeImage ? "border-[var(--primary-color)]" : "border-transparent"}`}
                                            >
                                                <img src={image.url} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SideAds>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${upcoming
                                ? "bg-orange-50 text-[var(--primary-color)]"
                                : "bg-gray-100 text-gray-600"
                                }`}
                        >
                            {upcoming ? "Upcoming Event" : "Event Completed"}
                        </span>
                        {event.event_type_label && (
                            <span className="rounded-full bg-[#EEF4FB] px-3 py-1 text-[12px] font-semibold text-[var(--text-color3)]">
                                {event.event_type_label}
                            </span>
                        )}
                    </div>

                    <h1 className="mt-3 text-[26px] lg:text-[34px] font-bold leading-tight text-[var(--text-color1)]">
                        {event.title}
                    </h1>

                    {event.organizer_name && (
                        <p className="mt-1 text-[15px] text-[var(--text-color2)]">
                            By <span className="font-semibold text-[var(--text-color1)]">{event.organizer_name}</span>
                            {event.brand_name && <> · {event.brand_name}</>}
                        </p>
                    )}

                    {event.highlight_labels?.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {event.highlight_labels.map((label) => (
                                <span
                                    key={label}
                                    className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[13px] font-medium text-[var(--primary-color)]"
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-6">
                        <h2 className="text-[18px] font-bold text-[var(--text-color3)]">About this event</h2>
                        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-[var(--text-color2)]">
                            {event.description || "More details will be shared soon."}
                        </p>
                    </div>

                    {event.builders_attending && (
                        <div className="mt-6 rounded-2xl bg-[#F6F9FC] p-5">
                            <h2 className="flex items-center gap-2 text-[18px] font-bold text-[var(--text-color3)]">
                                <FaBuilding className="text-[var(--primary-color)]" /> Builders / Developers Attending
                            </h2>
                            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-color2)]">
                                {event.builders_attending}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="col-span-12 space-y-6 lg:col-span-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
                        <h2 className="text-[16px] font-bold text-[var(--text-color1)]">Event Details</h2>

                        <ul className="mt-4 space-y-4">
                            {infoItems.map(({ icon: Icon, label, value, sub }) => (
                                <li key={label} className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[var(--primary-color)]">
                                        <Icon size={16} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="mb-0 text-[12px] text-[var(--text-color2)]">{label}</p>
                                        <p className="mb-0 mt-0.5 text-[14px] font-semibold text-[var(--text-color1)] break-words">{value}</p>
                                        {sub && <p className="mb-0 mt-0.5 text-[12px] text-[var(--text-color2)] break-words">{sub}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 space-y-2.5">
                            {upcoming && (
                                <a
                                    href={googleCalendarUrl(event)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg no-underline bg-[var(--primary-color)] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#d96818]"
                                >
                                    <FaCalendarPlus /> Add to Calendar
                                </a>
                            )}

                            {(event.location || event.map_url) && (
                                <a
                                    href={mapUrl(event)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg no-underline border border-gray-300 px-4 py-2.5 text-[14px] font-semibold text-[var(--text-color1)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                >
                                    <FaDirections /> Get Directions
                                </a>
                            )}

                            {event.brochure && (
                                <a
                                    href={event.brochure}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg no-underline border border-gray-300 px-4 py-2.5 text-[14px] font-semibold text-[var(--text-color1)] transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                >
                                    <FaFilePdf className="text-red-600" /> Download Brochure
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Registration form (only while the event is upcoming) */}
                    {upcoming && (
                        <div className="lg:sticky lg:top-28">
                            <EventRegistrationForm fixedEvent={event} idPrefix="event_reg" />
                        </div>
                    )}
                </aside>
            </div>

            {moreEvents.length > 0 && (
                <div className="mt-14">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">More Events</h2>

                    <div className="mt-6 grid grid-cols-12 gap-4">
                        {moreEvents.map((item) => (
                            <div key={item.id} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                                <EventCard event={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
