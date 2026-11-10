"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { Spinner, Tooltip } from "@heroui/react";
import { FaMapMarkerAlt, FaPen, FaRegCalendarAlt, FaRegEye } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import PageTitle from "../../Breadcrumb/PageTitle";
import { actionButtonClass } from "../actionButtonClass";
import AddedBy from "../AddedBy";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { getAdminEvents, deleteAdminEvent } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import Tmodal from "../../Tmodal/Tmodal";
import {
    eventCityState,
    formatEventDateRange,
    formatEventTime,
    isEventLive,
    isUpcomingEvent,
} from "../../Innerpages/Events/eventUtils";
import LiveBadge from "../../Common/LiveBadge";
import useNow from "../../../utils/useNow";

const EVENT_FALLBACK_IMAGE = "/assets/img/blog-img1.png";

// All events in one call; filter + search happen here (same as Contact Messages)
const PER_PAGE = 200;

const FILTERS = {
    all: () => true,
    upcoming: (event) => event.is_active && isUpcomingEvent(event),
    past: (event) => !isUpcomingEvent(event),
    inactive: (event) => !event.is_active,
};

// Status badge: Inactive / Live / Completed / Upcoming
const statusOf = (event, now) => {
    if (!event.is_active) return ["Inactive", "bg-gray-100 text-gray-600"];
    // Happening right now (date + time, India time) -> LIVE badge
    if (now && isEventLive(event, now)) return ["Live", null];
    if (!isUpcomingEvent(event)) return ["Completed", "bg-blue-50 text-blue-700"];

    return ["Upcoming", "bg-green-100 text-green-700"];
};

// Last loaded events: cards show right away (no loader), fresh data loads in background
const EVENTS_CACHE_KEY = "admin_events";
let eventsCache = null;

const readEventsCache = () => {
    if (eventsCache) return eventsCache;

    try {
        const saved = JSON.parse(sessionStorage.getItem(EVENTS_CACHE_KEY));
        if (Array.isArray(saved)) eventsCache = saved;
    } catch (e) { }

    return eventsCache;
};

const saveEventsCache = (events) => {
    eventsCache = events;

    try {
        sessionStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    } catch (e) { }
};

export default function Listing() {
    const can = useAdminPermission();
    // Refreshes every 30 sec so an event turns LIVE (or back) without reload
    const now = useNow(30000);

    const [events, setEvents] = useState(() => readEventsCache() || []);
    // Placeholder cards only on the very first load (nothing cached yet)
    const [loading, setLoading] = useState(() => !readEventsCache());
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // Delete Modal
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchEvents = async () => {
        try {
            const res = await getAdminEvents(1, PER_PAGE);
            const list = res?.data?.data;

            setEvents(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            showToast(error?.message || "Failed to load events.", "error");

            // Keep showing cached cards if the refresh fails
            if (!readEventsCache()) setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Save loaded / deleted list for the next visit
    useEffect(() => {
        if (!loading) saveEventsCache(events);
    }, [events, loading]);

    const handleDeleteConfirm = async () => {
        if (!selectedEvent?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteAdminEvent(selectedEvent.id);

            setEvents((previous) => previous.filter((event) => event.id !== selectedEvent.id));
            setSelectedEvent(null);
            showToast(res?.message || "Event deleted successfully.");
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const count = (key) => events.filter(FILTERS[key]).length;

    const term = search.trim().toLowerCase();
    const visibleEvents = events.filter((event) => {
        if (!FILTERS[filter](event)) return false;
        if (!term) return true;

        return [
            event.title,
            event.organizer_name,
            event.brand_name,
            event.event_type_label,
            event.location,
            event.city,
            event.state,
            event.creator?.name,
        ].some((value) => String(value || "").toLowerCase().includes(term));
    });

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Events", active: true },
                ]}
                title="Events"
            />

            <div className="mt-6 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        ["all", `All (${events.length})`],
                        ["upcoming", `Upcoming (${count("upcoming")})`],
                        ["past", `Completed (${count("past")})`],
                        ["inactive", `Inactive (${count("inactive")})`],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                filter === key
                                    ? "bg-[#E87722] text-white"
                                    : "bg-white text-[#62748E] border border-gray-200 hover:text-[#E87722]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, organizer, city..."
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E87722] sm:w-72"
                    />

                    {can("events.create") && (
                        <NextLink
                            href="/admin/event/add"
                            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white transition hover:bg-[#d96818]"
                        >
                            <span className="text-lg leading-none">+</span> Post Event
                        </NextLink>
                    )}
                </div>
            </div>

            {/* Events cards */}
            {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map((key) => (
                        <div key={key} className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            <div className="h-36 bg-gray-200" />
                            <div className="space-y-2.5 p-3">
                                <div className="h-3 w-1/4 rounded-full bg-gray-200" />
                                <div className="h-4 w-4/5 rounded bg-gray-200" />
                                <div className="h-3 w-1/2 rounded bg-gray-100" />
                                <div className="h-3 w-2/3 rounded bg-gray-100" />
                                <div className="h-3 w-3/5 rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : visibleEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleEvents.map((event) => {
                        const [statusLabel, statusClass] = statusOf(event, now);

                        return (
                            <div
                                key={event.id}
                                className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                {/* Image + status / multiple images badges */}
                                <div className="relative h-36 w-full shrink-0 bg-gray-100">
                                    <img
                                        src={event.image || EVENT_FALLBACK_IMAGE}
                                        alt={event.title}
                                        className="h-full w-full object-cover"
                                    />

                                    {statusLabel === "Live" ? (
                                        <LiveBadge size="sm" label="Live" className="absolute left-2 top-2 shadow-sm" />
                                    ) : (
                                        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ${statusClass}`}>
                                            {statusLabel}
                                        </span>
                                    )}

                                    {event.images?.length > 1 && (
                                        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                                            +{event.images.length - 1} photos
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col px-3 py-3">
                                    {event.event_type_label && (
                                        <span className="mb-1.5 inline-block max-w-full self-start truncate rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-[#E87722]">
                                            {event.event_type_label}
                                        </span>
                                    )}

                                    <h3
                                        className="break-words text-[14px] font-semibold leading-snug text-[#1A1F36]"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                        title={event.title}
                                    >
                                        {event.title || "-"}
                                    </h3>

                                    {event.organizer_name && (
                                        <p className="mt-1 truncate text-xs text-[#62748E]" title={event.organizer_name}>
                                            By {event.organizer_name}
                                        </p>
                                    )}

                                    {/* Date & time */}
                                    <div className="mt-2 flex items-start gap-2 text-xs">
                                        <FaRegCalendarAlt className="mt-0.5 shrink-0 text-[#E87722]" />
                                        <div className="min-w-0">
                                            <p className="text-[#1A1F36]">{formatEventDateRange(event) || "-"}</p>
                                            <p className="mt-0.5 text-[#62748E]">
                                                {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Venue */}
                                    <div className="mt-1.5 flex items-start gap-2 text-xs">
                                        <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[#E87722]" />
                                        <div className="min-w-0">
                                            <p className="truncate text-[#1A1F36]" title={event.location || ""}>
                                                {event.location || "-"}
                                            </p>
                                            <p className="mt-0.5 text-[#62748E]">{eventCityState(event) || "-"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: added by + actions */}
                                <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                                    <div className="min-w-0">
                                        <AddedBy creator={event.creator} />
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {can("events.view") && (
                                            <Tooltip content="View Event">
                                                <NextLink href={`/admin/event/detail/${event.id}`} className={actionButtonClass}>
                                                    <FaRegEye size={18} />
                                                </NextLink>
                                            </Tooltip>
                                        )}

                                        {can("events.edit") && (
                                            <Tooltip content="Update Event">
                                                <NextLink href={`/admin/event/update/${event.id}`} className={actionButtonClass}>
                                                    <FaPen size={13} />
                                                </NextLink>
                                            </Tooltip>
                                        )}

                                        {can("events.delete") && (
                                            <Tooltip content="Delete Event">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedEvent(event)}
                                                    className={actionButtonClass}
                                                >
                                                    <FaRegTrashCan size={14} />
                                                </button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl bg-white py-10 text-center text-gray-500 shadow">
                    No events found.
                </div>
            )}

            {/* Delete Modal */}
            <Tmodal
                isOpen={!!selectedEvent}
                onClose={() => {
                    if (!deleteLoading) setSelectedEvent(null);
                }}
                title="Delete Event"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedEvent(null)}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
                        >
                            {deleteLoading ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </button>
                    </div>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete the event{" "}
                    <span className="font-semibold text-gray-900">{selectedEvent?.title}</span>? Its images and
                    brochure will also be removed.
                </p>
            </Tmodal>
        </div>
    );
}
