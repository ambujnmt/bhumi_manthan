import NextLink from "next/link";
import React from "react";
import { FaArrowRight, FaClock, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { dateBadge, eventVenue, formatEventTime, isUpcomingEvent } from "./eventUtils";

// Event card: image with date badge + type, organizer, time, venue, highlights
export default function EventCard({ event }) {
    const upcoming = isUpcomingEvent(event);
    const href = `/web/events/${event.slug || event.id}`;
    const badge = dateBadge(event);
    const venue = eventVenue(event);
    const highlights = (event.highlight_labels || []).slice(0, 2);

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_6px_24px_rgba(18,48,95,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(18,48,95,0.16)]">
            <NextLink href={href} className="relative block overflow-hidden no-underline">
                <img
                    src={event.image || "/assets/img/blog-img1.png"}
                    alt={event.title}
                    className={`h-52 w-full object-cover transition duration-500 group-hover:scale-105 ${upcoming ? "" : "grayscale-[50%]"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

                {/* Date badge */}
                <div className="absolute left-3 top-3 min-w-[62px] overflow-hidden rounded-xl bg-white text-center shadow-md">
                    <p className="mb-0 bg-[var(--primary-color)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {badge.month}
                    </p>
                    <p className="mb-0 px-2 py-1 text-[17px] font-extrabold leading-tight text-[var(--secondary-color)]">
                        {badge.days}
                    </p>
                </div>

                {upcoming ? (
                    event.event_type_label && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[var(--secondary-color)] shadow">
                            {event.event_type_label}
                        </span>
                    )
                ) : (
                    <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white">
                        Completed
                    </span>
                )}
            </NextLink>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-0 text-[18px] font-bold leading-snug text-[var(--text-color1)] line-clamp-2">
                    <NextLink href={href} className="no-underline transition-colors hover:text-[var(--primary-color)]">
                        {event.title}
                    </NextLink>
                </h3>

                {event.organizer_name && (
                    <p className="mb-0 mt-1 text-[13px] text-[var(--text-color2)] line-clamp-1">
                        By <span className="font-semibold text-[var(--text-color3)]">{event.organizer_name}</span>
                    </p>
                )}

                <div className="mt-4 space-y-2 text-[13px] text-[var(--text-color2)]">
                    <p className="mb-0 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[var(--primary-color)]">
                            <FaClock size={12} />
                        </span>
                        {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                    </p>
                    {venue && (
                        <p className="mb-0 flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[var(--primary-color)]">
                                <FaMapMarkerAlt size={12} />
                            </span>
                            <span className="line-clamp-1">{venue}</span>
                        </p>
                    )}
                </div>

                {highlights.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {highlights.map((label) => (
                            <span key={label} className="rounded-full bg-[#EEF4FB] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-color3)]">
                                {label}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex-1" />

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-color2)]">
                        {event.expected_footfall_label && (
                            <>
                                <FaUsers className="text-[var(--primary-color)]" /> {event.expected_footfall_label}
                            </>
                        )}
                    </span>

                    <NextLink
                        href={href}
                        className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--primary-color)] no-underline transition-all hover:gap-2.5"
                    >
                        View Details <FaArrowRight size={11} />
                    </NextLink>
                </div>
            </div>
        </div>
    );
}
