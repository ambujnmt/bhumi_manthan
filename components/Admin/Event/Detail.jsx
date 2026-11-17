"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import {
    FaBuilding,
    FaCalendarAlt,
    FaClock,
    FaExternalLinkAlt,
    FaFilePdf,
    FaMapMarkerAlt,
    FaPen,
    FaTag,
    FaUsers,
} from "react-icons/fa";

import PageTitle from "../../../components/Breadcrumb/PageTitle";
import AddedBy from "../AddedBy";
import { getAdminEventById } from "../../../utils/fetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";
import {
    eventCityState,
    formatEventDateRange,
    formatEventTime,
    mapUrl,
} from "../../Innerpages/Events/eventUtils";

const InfoItem = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-2.5">
        <Icon className="mt-1 shrink-0 text-[#E87722]" />
        <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            <div className="mt-1 break-words text-sm font-medium text-gray-800">{children}</div>
        </div>
    </div>
);

const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

// Registrations / enquiries sent from this event's page on the website
const Registrations = ({ items }) => {
    const totalAttendees = items.reduce((sum, item) => sum + (Number(item.attendees) || 1), 0);

    return (
        <div className="col-span-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#283A86]">
                    Registrations / Enquiries
                    <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#E87722]">
                        {items.length}
                    </span>
                </h3>
                {items.length > 0 && (
                    <p className="text-xs text-gray-500">
                        Total attendees: <span className="font-semibold text-gray-800">{totalAttendees}</span>
                    </p>
                )}
            </div>

            {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    No registrations yet. They will show here when people fill the form on the event page.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">Name</th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">Phone</th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">Email</th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">Attendees</th>
                                <th className="w-full px-4 py-2.5 text-left font-semibold">Message</th>
                                <th className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100 align-top">
                                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[#1A1F36]">{item.name}</td>
                                    <td className="whitespace-nowrap px-4 py-2.5">
                                        <a href={`tel:${item.phone}`} className="text-[#283A86] no-underline hover:text-[#E87722]">
                                            {item.phone}
                                        </a>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2.5">
                                        <a href={`mailto:${item.email}`} className="text-[#283A86] no-underline hover:text-[#E87722]">
                                            {item.email}
                                        </a>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2.5">{item.attendees || 1}</td>
                                    <td className="min-w-[220px] whitespace-pre-line break-words px-4 py-2.5 text-gray-600">
                                        {item.message || "-"}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">{formatDateTime(item.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default function Detail() {
    const router = useRouter();
    const { id } = router.query;
    const can = useAdminPermission();

    const [event, setEvent] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchEvent = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError("");

        try {
            const response = await getAdminEventById(id);
            setEvent(response?.data ?? null);
            setActiveImage(0);

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

    const images = event?.images?.length ? event.images : event?.image ? [{ url: event.image }] : [];

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
                <div className="mt-5 flex min-h-60 items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white">
                    <Spinner size="md" color="warning" />
                    <span className="text-sm text-gray-500">Loading event...</span>
                </div>
            ) : error || !event ? (
                <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-red-600">{error || "Event details not found."}</p>

                    <button
                        type="button"
                        onClick={fetchEvent}
                        className="mt-3 rounded-md bg-[#E87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d96818]"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="mt-5 grid grid-cols-12 gap-5">
                    <div className="col-span-12 overflow-hidden rounded-lg border border-gray-200 bg-white xl:col-span-8">
                        {/* Images */}
                        {images.length > 0 && (
                            <div>
                                <div className="h-56 bg-gray-100 sm:h-80">
                                    <img
                                        src={images[activeImage]?.url}
                                        alt={event.title || "Event image"}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto p-3">
                                        {images.map((image, index) => (
                                            <button
                                                key={image.url}
                                                type="button"
                                                onClick={() => setActiveImage(index)}
                                                className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${index === activeImage ? "border-[#E87722]" : "border-transparent"}`}
                                            >
                                                <img src={image.url} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    {event.event_type_label && (
                                        <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#E87722]">
                                            {event.event_type_label}
                                        </span>
                                    )}
                                    <h2 className="mt-2 text-xl font-semibold text-[#1A1F36] sm:text-2xl">{event.title}</h2>
                                    {event.organizer_name && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            By {event.organizer_name}
                                            {event.brand_name && <> · {event.brand_name}</>}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded px-2.5 py-1 text-xs font-medium ${event.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
                                    >
                                        {event.is_active ? "Active" : "Inactive"}
                                    </span>

                                    {can("events.edit") && (
                                        <Link
                                            href={`/admin/event/update/${event.id}`}
                                            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#E87722] hover:text-[#E87722]"
                                        >
                                            <FaPen size={10} /> Edit
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 border-b border-gray-100 pb-4 sm:grid-cols-2">
                                <InfoItem icon={FaCalendarAlt} label="Event Date">
                                    {formatEventDateRange(event) || "-"}
                                </InfoItem>

                                <InfoItem icon={FaClock} label="Event Time">
                                    {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                                </InfoItem>

                                <InfoItem icon={FaMapMarkerAlt} label="Venue">
                                    {event.location || "-"}
                                    {event.address && <p className="mt-0.5 text-xs font-normal text-gray-500">{event.address}</p>}
                                    {eventCityState(event) && <p className="mt-0.5 text-xs font-normal text-gray-500">{eventCityState(event)}</p>}
                                    <a
                                        href={mapUrl(event)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E87722]"
                                    >
                                        View on Map <FaExternalLinkAlt size={9} />
                                    </a>
                                </InfoItem>

                                <InfoItem icon={FaUsers} label="Expected Footfall">
                                    {event.expected_footfall_label || "-"}
                                </InfoItem>

                                <InfoItem icon={FaBuilding} label="Builders / Developers Attending">
                                    {event.builders_attending || "-"}
                                </InfoItem>

                                <InfoItem icon={FaTag} label="Key Highlights">
                                    {event.highlight_labels?.length ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {event.highlight_labels.map((label) => (
                                                <span key={label} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </InfoItem>
                            </div>

                            <div className="pt-4">
                                <h3 className="mb-2 text-sm font-semibold text-[#283A86]">Description</h3>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                    {event.description || "No description available."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <aside className="col-span-12 space-y-5 xl:col-span-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-[#283A86]">Added By</h3>
                            <AddedBy creator={event.creator} />
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-[#283A86]">Brochure / Invitation</h3>
                            {event.brochure ? (
                                <a
                                    href={event.brochure}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm font-medium text-[#E87722]"
                                >
                                    <FaFilePdf className="text-red-600" size={18} /> View Brochure (PDF)
                                </a>
                            ) : (
                                <p className="text-sm text-gray-500">No brochure uploaded.</p>
                            )}
                        </div>

                        {event.is_active && event.slug && (
                            <a
                                href={`/web/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg bg-[#E87722] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d96818]"
                            >
                                View on Website <FaExternalLinkAlt size={11} />
                            </a>
                        )}
                    </aside>

                    <Registrations items={event.registrations || []} />
                </div>
            )}
        </div>
    );
}
