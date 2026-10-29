"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { Spinner, Tooltip } from "@heroui/react";
import { FaPen, FaRegEye } from "react-icons/fa";
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
    isUpcomingEvent,
} from "../../Innerpages/Events/eventUtils";

const EVENT_FALLBACK_IMAGE = "/assets/img/blog-img1.png";

// All events in one call; filter + search happen here (same as Contact Messages)
const PER_PAGE = 200;

const FILTERS = {
    all: () => true,
    upcoming: (event) => event.is_active && isUpcomingEvent(event),
    past: (event) => !isUpcomingEvent(event),
    inactive: (event) => !event.is_active,
};

// Status badge: Inactive / Completed / Upcoming
const statusOf = (event) => {
    if (!event.is_active) return ["Inactive", "bg-gray-100 text-gray-600"];
    if (!isUpcomingEvent(event)) return ["Completed", "bg-blue-50 text-blue-700"];

    return ["Upcoming", "bg-green-100 text-green-700"];
};

export default function Listing() {
    const can = useAdminPermission();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // Delete Modal
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);

        try {
            const res = await getAdminEvents(1, PER_PAGE);
            const list = res?.data?.data;

            setEvents(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            showToast(error?.message || "Failed to load events.", "error");
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

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

    const colCount = 6;
    const thClass = "px-4 py-3 text-left whitespace-nowrap";

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

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {/* w-full: this column takes the extra width */}
                            <th className={`${thClass} w-full`}>Event</th>
                            <th className={thClass}>Date & Time</th>
                            <th className={thClass}>Venue</th>
                            <th className={thClass}>Added By</th>
                            <th className={thClass}>Status</th>
                            <th className={thClass}>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={colCount}>
                                    <div className="flex justify-center items-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : visibleEvents.length > 0 ? (
                            visibleEvents.map((event) => {
                                const [statusLabel, statusClass] = statusOf(event);

                                return (
                                    <tr key={event.id} className="border-t align-middle">
                                        <td className="px-4 py-2.5">
                                            <div className="min-w-0 leading-tight">
                                                {/* Banner above the name */}
                                                <img
                                                    src={event.image || EVENT_FALLBACK_IMAGE}
                                                    alt={event.title}
                                                    className="mb-2 h-16 w-28 rounded-md border border-gray-200 object-cover"
                                                />

                                                <p className="max-w-[280px] truncate font-semibold text-[#1A1F36]" title={event.title}>
                                                    {event.title || "-"}
                                                </p>
                                                <p className="mt-0.5 max-w-[280px] truncate text-xs text-[#62748E]">
                                                    {[event.event_type_label, event.organizer_name && `By ${event.organizer_name}`]
                                                        .filter(Boolean)
                                                        .join(" · ") || "-"}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-[#1A1F36]">{formatEventDateRange(event) || "-"}</p>
                                            <p className="mt-0.5 text-xs text-[#62748E]">
                                                {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="max-w-[200px] truncate text-[#1A1F36]" title={event.location || ""}>
                                                {event.location || "-"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#62748E]">{eventCityState(event) || "-"}</p>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <AddedBy creator={event.creator} />
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
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
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={colCount} className="text-center py-6 text-gray-500">
                                    No events found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
