import NextLink from "next/link";
import React from "react";
import { FaArrowRight, FaClock, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { FiNavigation } from "react-icons/fi";
import { dateBadge, eventVenue, formatEventTime, isEventLive, isUpcomingEvent } from "./eventUtils";
import { formatDistance } from "../../../utils/formatPrice";
import useNow from "../../../utils/useNow";
import LiveBadge from "../../Common/LiveBadge";

// Event card: image with date badge + type, organizer, time, venue, highlights
// Started and not ended -> red blinking LIVE badge (checked every 30 sec)
export default function EventCard({ event }) {
    const now = useNow(30000);
    const live = Boolean(now) && isEventLive(event, now);
    const distance = formatDistance(event.distance_km);
    const upcoming = isUpcomingEvent(event);
    const href = `/web/events/${event.slug || event.id}`;
    const badge = dateBadge(event);
    const venue = eventVenue(event);
    const highlights = (event.highlight_labels || []).slice(0, 2);

    return (
        <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_6px_24px_rgba(18,48,95,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(18,48,95,0.16)] ${live ? "border-red-300 ring-2 ring-red-500/20" : "border-gray-100"}`}>
            <NextLink href={href} className="relative block overflow-hidden no-underline">
                <img
                    src={event.image || "/assets/img/blog-img1.png"}
                    alt={event.title}
                    className={`h-48 w-full object-cover transition duration-500 group-hover:scale-105 ${upcoming ? "" : "grayscale-[50%]"}`}
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

                {live && <LiveBadge className="absolute right-3 top-3" />}

                {distance && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                        <FiNavigation size={10} /> {distance}
                    </span>
                )}

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

            <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
                <h3 className="mb-0 text-[17px] font-bold leading-snug text-[var(--text-color1)] line-clamp-2">
                    <NextLink href={href} className="text-[var(--text-color1)] no-underline transition-colors hover:text-[var(--primary-color)]">
                        {event.title}
                    </NextLink>
                </h3>

                {event.organizer_name && (
                    <p className="mb-0 mt-0.5 text-[13px] text-[var(--text-color2)] line-clamp-1">
                        By <span className="font-semibold text-[var(--text-color3)]">{event.organizer_name}</span>
                    </p>
                )}

                <div className="mt-3 space-y-1.5 text-[13px] text-[var(--text-color2)]">
                    <p className="mb-0 flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-50 text-[var(--primary-color)]">
                            <FaClock size={11} />
                        </span>
                        {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                    </p>
                    {venue && (
                        <p className="mb-0 flex items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-50 text-[var(--primary-color)]">
                                <FaMapMarkerAlt size={11} />
                            </span>
                            <span className="line-clamp-1">{venue}</span>
                        </p>
                    )}
                </div>

                {highlights.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {highlights.map((label) => (
                            <span key={label} className="rounded-full bg-[#EEF4FB] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-color3)]">
                                {label}
                            </span>
                        ))}
                    </div>
                )}

                {/* pushes footer to bottom (cards in a row stay equal), min 14px gap */}
                <div className="min-h-[14px] flex-1" />

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    {event.expected_footfall_label ? (
                        <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-color2)]">
                            <FaUsers className="text-[var(--primary-color)]" /> {event.expected_footfall_label}
                        </span>
                    ) : (
                        <span />
                    )}

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
