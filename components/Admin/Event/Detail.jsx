
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
} from "react-icons/fa";

import PageTitle from "../../../components/Breadcrumb/PageTitle";
import { getAdminEventById } from "../../../utils/fetchApi";

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "-";

    const [hours, minutes] = value.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

export default function Detail() {
    const router = useRouter();
    const { id } = router.query;

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchEvent = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError("");

        try {
            const response = await getAdminEventById(id);
            setEvent(response?.data ?? null);

            if (!response?.data) {
                setError("Event details not found.");
            }
        } catch (err) {
            console.error("Failed to fetch event:", err);
            setError(err?.message || "Unable to load event details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (router.isReady && id) {
            fetchEvent();
        }
    }, [router.isReady, id, fetchEvent]);

    return (
        <div className="pb-5">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Events", path: "/admin/event/listing" },
                    { label: "Event Details", active: true },
                ]}
                title="Event Details"
            />


            {loading ? (
                <div className="flex min-h-60 items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white">
                    <Spinner size="md" color="warning" />
                    <span className="text-sm text-gray-500">
                        Loading event...
                    </span>
                </div>
            ) : error || !event ? (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-red-600">
                        {error || "Event details not found."}
                    </p>

                    <button
                        type="button"
                        onClick={fetchEvent}
                        className="mt-3 rounded-md bg-[#E87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d96818]"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {/* Event image */}
                    {event.image && (
                        <div className="h-56 bg-gray-100 sm:h-72">
                            <img
                                src={event.image}
                                alt={event.title || "Event image"}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-4 sm:p-5">
                        {/* Title and status */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <h2 className="text-xl font-semibold text-[#1A1F36] sm:text-2xl">
                                {event.title}
                            </h2>

                            <span
                                className={`rounded px-2.5 py-1 text-xs font-medium ${
                                    event.is_active
                                        ? "bg-green-50 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                {event.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>

                        {/* Event details */}
                        <div className="mt-4 grid grid-cols-1 gap-3 border-b border-gray-100 pb-4 sm:grid-cols-3">
                            <div className="flex items-start gap-2.5">
                                <FaCalendarAlt className="mt-1 text-[#E87722]" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Event Date
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                        {formatDate(event.event_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <FaClock className="mt-1 text-[#E87722]" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Event Time
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                        {formatTime(event.start_time)} -{" "}
                                        {formatTime(event.end_time)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <FaMapMarkerAlt className="mt-1 text-[#E87722]" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Location
                                    </p>
                                    <p className="mt-1 break-words text-sm font-medium text-gray-800">
                                        {event.location || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-4">
                            <h3 className="mb-2 text-sm font-semibold text-[#283A86]">
                                Description
                            </h3>

                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                {event.description || "No description available."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
