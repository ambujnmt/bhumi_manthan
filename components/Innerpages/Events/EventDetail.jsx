import NextLink from "next/link";
import React, { useState } from "react";
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
import EventCard from "./EventCard";
import {
    eventCityState,
    formatEventDateRange,
    formatEventTime,
    googleCalendarUrl,
    isUpcomingEvent,
    mapUrl,
} from "./eventUtils";

export default function EventDetail({ event, moreEvents = [] }) {
    const upcoming = isUpcomingEvent(event);
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
        <section className="container py-10">
            <NextLink
                href="/web/events"
                className="inline-flex items-center gap-2 no-underline text-[14px] font-semibold text-[var(--text-color2)] hover:text-[var(--primary-color)] transition-colors"
            >
                <FaArrowLeft size={12} /> All Events
            </NextLink>

            <div className="mt-5 grid grid-cols-12 gap-6">
                {/* Main content */}
                <div className="col-span-12 lg:col-span-8">
                    {images.length > 0 && (
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
                <aside className="col-span-12 lg:col-span-4">
                    <div className="lg:sticky lg:top-28 rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
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
