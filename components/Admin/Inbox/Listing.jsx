"use client";

import React, { useEffect, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import NextLink from "next/link";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Tooltip } from "@heroui/react";
import { deleteInboxItem, getAdminInbox, markInboxRead } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { FaRegEye } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import Tmodal from "../../Tmodal/Tmodal";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";

const PROPERTY_FALLBACK_IMAGE = "/assets/img/prop-1.png";

const propertyUrl = (property) => `/web/propertyDetail/${property.slug || property.id}`;

// Label / value rows (modal)
const DetailRows = ({ rows }) => (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[130px_1fr] gap-3 px-4 py-2.5 text-sm">
                <span className="font-semibold text-[#62748E]">{label}</span>
                <span className="whitespace-pre-line break-words text-[#1A1F36]">{value || "-"}</span>
            </div>
        ))}
    </div>
);

const SectionTitle = ({ children }) => (
    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#001737]">{children}</h4>
);

// Property details in enquiry "View" modal
const PropertyDetails = ({ property, fallbackTitle, eventTitle }) => {
    if (!property && eventTitle) {
        return (
            <div className="mb-5">
                <SectionTitle>Event Registration</SectionTitle>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#283A86]">
                    Registered for <span className="font-semibold text-[#1A1F36]">{eventTitle}</span> from the Events page.
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="mb-5">
                <SectionTitle>Property Details</SectionTitle>
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-[#62748E]">
                    {fallbackTitle
                        ? <>Property <span className="font-semibold text-[#1A1F36]">{fallbackTitle}</span> is no longer available.</>
                        : "General enquiry (no property)."}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-5">
            <SectionTitle>Property Details</SectionTitle>

            <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 p-2.5">
                {/* Small thumbnail */}
                <img
                    src={property.main_image || PROPERTY_FALLBACK_IMAGE}
                    onError={imageFallback(PROPERTY_FALLBACK_IMAGE)}
                    alt={property.title}
                    className="h-16 w-24 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#001737]" title={property.title}>{property.title}</p>
                    <p className="text-base font-bold text-[#E87722]">{formatPropertyPrice(property.price)}</p>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs font-semibold">
                        {property.is_active && (
                            <NextLink href={propertyUrl(property)} target="_blank" className="text-[#E87722] hover:underline">
                                View on website ↗
                            </NextLink>
                        )}
                        <NextLink href={`/admin/propertyManagement/propertyDetail/${property.id}`} className="text-[#283A86] hover:underline">
                            Open in admin
                        </NextLink>
                    </div>
                </div>
            </div>

            <DetailRows
                rows={[
                    ["Property ID", property.property_id],
                    ["Type", property.property_type],
                    ["Configuration", property.configuration],
                    ["Listing", property.listing_type ? `For ${property.listing_type}` : null],
                    ["Area", property.super_area != null ? `${Number(property.super_area).toLocaleString("en-IN")} sq. ft.` : null],
                    ["Location", [property.location, property.city, property.state].filter(Boolean).join(", ")],
                    ["Status", property.is_active ? "Active" : "Inactive"],
                ]}
            />
        </div>
    );
};

const INTERESTED_IN = {
    residential: "Residential Plots",
    commercial: "Commercial Plots",
    apartment: "Apartments",
    villa: "Villas",
    farmhouse: "Farm House",
};

const BUDGETS = {
    "below-25": "Below 25 Lac",
    "25-50": "25 Lac - 50 Lac",
    "50-1cr": "50 Lac - 1 Cr",
    "1-2cr": "1 Cr - 2 Cr",
    "above-2cr": "Above 2 Cr",
};

// Contact Us messages + property enquiries use the same list
const CONFIG = {
    contact: {
        apiType: "contact-messages",
        listKey: "messages",
        itemKey: "contact_message",
        title: "Contact Messages",
        singular: "Message",
        name: (item) => [item.fname, item.lname].filter(Boolean).join(" "),
        details: (item) => [
            ["Name", [item.fname, item.lname].filter(Boolean).join(" ")],
            ["Phone", item.phone],
            ["Email", item.email],
            ["Message", item.message],
        ],
    },
    enquiry: {
        apiType: "enquiries",
        listKey: "enquiries",
        itemKey: "enquiry",
        title: "Property Enquiries",
        singular: "Enquiry",
        name: (item) => item.name,
        details: (item) => [
            // Events page registration form
            ...(item.event_title
                ? [
                    ["Event", item.event_title],
                    ["Attendees", item.attendees],
                ]
                : []),
            ["Name", item.name],
            ["Phone", item.phone],
            ["Email", item.email],
            ["Interested In", INTERESTED_IN[item.interested_in] || item.interested_in],
            ["Budget Range", BUDGETS[item.budget] || item.budget],
            ["Message", item.message],
        ],
    },
};

// First few words + "..." (full text in View modal)
const shortText = (text, words = 8) => {
    const parts = String(text || "").trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return "-";

    return parts.length > words ? `${parts.slice(0, words).join(" ")}...` : parts.join(" ");
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

export default function Listing({ type = "contact" }) {
    const can = useAdminPermission();
    const config = CONFIG[type];
    const permissionModule = type === "enquiry" ? "enquiries" : "contact_messages";
    const isEnquiry = type === "enquiry";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // View Modal
    const [viewItem, setViewItem] = useState(null);

    // Delete Modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchItems = async () => {
        setLoading(true);

        try {
            const res = await getAdminInbox(config.apiType);
            const list = res?.data?.[config.listKey];

            setItems(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error(`Failed to fetch ${config.title}:`, error);
            showToast(error?.message || `Failed to load ${config.title.toLowerCase()}.`, "error");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const replaceItem = (updated) =>
        setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));

    const setRead = async (item, isRead, silent = false) => {
        try {
            const res = await markInboxRead(config.apiType, item.id, isRead);
            const updated = res?.data?.[config.itemKey];

            if (updated) replaceItem(updated);
            // Sidebar Messages box refreshes its counts
            window.dispatchEvent(new Event("inbox:updated"));
            if (!silent) showToast(res?.message || `${config.singular} updated successfully.`);
        } catch (error) {
            showToast(error?.message || `Failed to update ${config.singular.toLowerCase()}.`, "error");
        }
    };

    // Open = mark as read
    const openView = (item) => {
        setViewItem(item);
        if (!item.is_read && can(`${permissionModule}.edit`)) setRead(item, true, true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedItem?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteInboxItem(config.apiType, selectedItem.id);

            setItems((previous) => previous.filter((item) => item.id !== selectedItem.id));
            setSelectedItem(null);
            window.dispatchEvent(new Event("inbox:updated"));
            showToast(res?.message || `${config.singular} deleted successfully.`);
        } catch (error) {
            showToast(error?.message || `Something went wrong while deleting.`, "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const unreadCount = items.filter((item) => !item.is_read).length;

    const term = search.trim().toLowerCase();
    const visibleItems = items.filter((item) => {
        if (filter === "unread" && item.is_read) return false;
        if (filter === "read" && !item.is_read) return false;
        if (!term) return true;

        return [...config.details(item).map(([, value]) => value), item.property?.title, item.property_title, item.property?.city]
            .some((value) => String(value || "").toLowerCase().includes(term));
    });

    const colCount = 5;
    const thClass = "px-4 py-3 text-left whitespace-nowrap";

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: config.title, active: true },
                ]}
                title={config.title}
            />

            <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {[
                        ["all", `All (${items.length})`],
                        ["unread", `Unread (${unreadCount})`],
                        ["read", "Read"],
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

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, email..."
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E87722] sm:w-72"
                />
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className={thClass}>Name / Contact</th>
                            {/* w-full: this column takes the extra width, Name stays compact */}
                            <th className={`${thClass} w-full`}>{isEnquiry ? "Requirement" : "Message"}</th>
                            <th className={thClass}>Date</th>
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
                        ) : visibleItems.length > 0 ? (
                            visibleItems.map((item) => {
                                const requirement = [
                                    INTERESTED_IN[item.interested_in] || item.interested_in,
                                    BUDGETS[item.budget] || item.budget,
                                ].filter(Boolean);

                                return (
                                    <tr key={item.id} className={`border-t align-middle ${item.is_read ? "" : "bg-orange-50/40"}`}>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                {/* First letter avatar */}
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                                                    {(config.name(item) || item.email || "?").trim().charAt(0)}
                                                </span>
                                                <div className="leading-tight">
                                                    <b className={`text-[#1A1F36] ${item.is_read ? "font-medium" : "font-bold"}`}>
                                                        {config.name(item) || "-"}
                                                    </b>
                                                    <p className="mt-0.5 text-xs text-[#62748E]">
                                                        {item.phone} · {item.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {isEnquiry ? (
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#1A1F36]">
                                                {item.event_title && (
                                                    <p>
                                                        <span className="mr-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Event</span>
                                                        {item.event_title}
                                                        {item.attendees ? ` · ${item.attendees} ${item.attendees === 1 ? "person" : "people"}` : ""}
                                                    </p>
                                                )}
                                                {requirement.length
                                                    ? requirement.map((text) => <p key={text}>{text}</p>)
                                                    : !item.event_title && "-"}
                                            </td>
                                        ) : (
                                            <td className="px-4 py-3">
                                                <p className="text-[#1A1F36]" title={item.message || ""}>
                                                    {shortText(item.message)}
                                                </p>
                                            </td>
                                        )}

                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#62748E]">{formatDate(item.created_at)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Tooltip content={item.is_read ? "Mark as unread" : "Mark as read"}>
                                                <button
                                                    type="button"
                                                    onClick={() => setRead(item, !item.is_read)}
                                                    disabled={!can(`${permissionModule}.edit`)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        item.is_read
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-orange-100 text-[#E87722]"
                                                    }`}
                                                >
                                                    {item.is_read ? "Read" : "New"}
                                                </button>
                                            </Tooltip>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Tooltip content={`View ${config.singular}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => openView(item)}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaRegEye size={18} />
                                                    </button>
                                                </Tooltip>

                                                {can(`${permissionModule}.delete`) && (
                                                <Tooltip content={`Delete ${config.singular}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItem(item)}
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
                                    No {config.title.toLowerCase()} found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            <Tmodal
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                title={`${config.singular} Details`}
                size={isEnquiry ? "4xl" : "2xl"}
                footer={
                    <div className="flex gap-3">
                        {viewItem?.email && (
                            <a
                                href={`mailto:${viewItem.email}`}
                                className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white"
                            >
                                Reply by Email
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => setViewItem(null)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {viewItem && (
                    // Enquiry: property + enquiry side by side on desktop
                    <div className={isEnquiry ? "grid grid-cols-1 gap-x-6 md:grid-cols-2" : ""}>
                        {isEnquiry && (
                            <PropertyDetails property={viewItem.property} fallbackTitle={viewItem.property_title} eventTitle={viewItem.event_title} />
                        )}

                        <div>
                            {isEnquiry && <SectionTitle>Enquiry Details</SectionTitle>}
                            <DetailRows
                                rows={[
                                    ...config.details(viewItem),
                                    ["Received", formatDate(viewItem.created_at)],
                                ]}
                            />
                        </div>
                    </div>
                )}
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={!!selectedItem}
                onClose={() => {
                    if (!deleteLoading) setSelectedItem(null);
                }}
                title={`Delete ${config.singular}`}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedItem(null)}
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
                    Are you sure you want to delete the {config.singular.toLowerCase()} from{" "}
                    <span className="font-semibold text-gray-900">
                        {selectedItem ? config.name(selectedItem) || selectedItem.email : ""}
                    </span>
                    ?
                </p>
            </Tmodal>
        </div>
    );
}
