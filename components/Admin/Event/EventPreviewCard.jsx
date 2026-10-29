import React from "react";
import { FaBuilding, FaMapMarkerAlt, FaTag, FaUsers, FaUtensils } from "react-icons/fa";
import { dateBadge, eventCityState, formatEventTime, isUpcomingEvent } from "../../Innerpages/Events/eventUtils";

const NAVY = "#12305F";
const GOLD = "#D4961C";

// Live preview of the event card while filling the Post Event form.
// event = form values + labels (event_type_label, expected_footfall_label, highlight_labels)
export default function EventPreviewCard({ event, image, action = null }) {
    const badge = dateBadge(event);
    const hasDate = Boolean(event.event_date);
    const cityState = eventCityState(event);

    const rows = [
        {
            icon: FaMapMarkerAlt,
            title: event.location,
            text: cityState || event.address,
        },
        {
            icon: FaUsers,
            title: "Expected Footfall",
            text: event.expected_footfall_label,
        },
        {
            icon: FaBuilding,
            title: "Builders Attending",
            text: event.builders_attending,
        },
        event.highlights?.includes("food_beverages") && {
            icon: FaUtensils,
            title: "Food & Beverages",
            text: "Complimentary for Visitors",
        },
        {
            icon: FaTag,
            title: "Event Highlights",
            text: event.highlight_labels?.filter((label) => label !== "Food & Beverages").join(" | "),
        },
    ].filter((row) => row && (row.title || row.text) && row.text);

    return (
        <div>
            <div className="relative h-44 overflow-hidden rounded-lg bg-gradient-to-br from-[#E8F1FA] to-[#C9DCEF]">
                {image ? (
                    <img src={image} alt={event.title || "Event banner"} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#62748E]">
                        Event banner preview
                    </div>
                )}

                {isUpcomingEvent(event) && (
                    <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
                        Upcoming Event
                    </span>
                )}

                {hasDate && (
                    <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-3 py-2 text-center shadow">
                        <p className="mb-0 text-[17px] font-extrabold leading-none" style={{ color: GOLD }}>
                            {badge.days}
                        </p>
                        <p className="mb-0 mt-0.5 text-[12px] font-bold" style={{ color: GOLD }}>{badge.month}</p>
                        {event.start_time && (
                            <p className="mb-0 mt-1 text-[11px] leading-tight text-[#1F2A44]">
                                {formatEventTime(event.start_time)}
                                {event.end_time && <><br />to {formatEventTime(event.end_time)}</>}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <h3 className="mb-0 mt-3 text-[19px] font-extrabold leading-tight" style={{ color: NAVY }}>
                {event.title || "Your Event Title"}
            </h3>
            <p className="mb-0 mt-0.5 text-[14px] text-[#3B4A63]">
                By {event.organizer_name || "Organizer Name"}
                {event.event_type_label && (
                    <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-[#E87722]">
                        {event.event_type_label}
                    </span>
                )}
            </p>

            <ul className="mt-3 space-y-2.5">
                {rows.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex items-start gap-3">
                        <Icon className="mt-0.5 shrink-0 text-[18px]" style={{ color: GOLD }} />
                        <div className="min-w-0 text-[13px] leading-snug text-[#1F2A44]">
                            {title && <p className="mb-0 font-medium">{title}</p>}
                            <p className="mb-0 break-words text-[#3B4A63]">{text}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {action}
        </div>
    );
}
