"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { FiCheck, FiEdit3, FiSearch, FiX } from "react-icons/fi";
import { FaRegImage } from "react-icons/fa";
import { LuEye, LuHouse, LuMapPin, LuCalendarClock } from "react-icons/lu";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import AddedBy from "../AddedBy";
import ApprovalBadge from "../PropertyManagement/ApprovalBadge";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";
import {
    approvePropertyRequest,
    getPropertyRequests,
    rejectPropertyRequest,
    requestPropertyChanges,
} from "../../../utils/adminFetchApi";

const TABS = [
    { key: "pending", label: "Pending" },
    { key: "changes_requested", label: "Changes Requested" },
    { key: "rejected", label: "Rejected" },
    { key: "approved", label: "Approved" },
];

// Modal text per action
const ACTIONS = {
    approve: {
        title: "Approve Property",
        button: "Approve",
        busy: "Approving...",
        noteLabel: "Note for seller / broker (optional)",
        noteRequired: false,
        buttonClass: "bg-green-600 hover:bg-green-700",
        call: approvePropertyRequest,
    },
    changes: {
        title: "Request Changes",
        button: "Send Request",
        busy: "Sending...",
        noteLabel: "What should be changed?",
        noteRequired: true,
        buttonClass: "bg-blue-600 hover:bg-blue-700",
        call: requestPropertyChanges,
    },
    reject: {
        title: "Reject Property",
        button: "Reject",
        busy: "Rejecting...",
        noteLabel: "Reason for rejection",
        noteRequired: true,
        buttonClass: "bg-red-600 hover:bg-red-700",
        call: rejectPropertyRequest,
    },
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

export default function Listing() {
    const can = useAdminPermission();
    const canReview = can("property_requests.edit");

    const [status, setStatus] = useState("pending");
    const [properties, setProperties] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(12);

    // { type: "approve" | "changes" | "reject", property }
    const [action, setAction] = useState(null);
    const [note, setNote] = useState("");
    const [noteError, setNoteError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);

            try {
                const res = await getPropertyRequests(status);

                if (cancelled) return;

                setProperties(Array.isArray(res?.data?.properties) ? res.data.properties : []);
                setCounts(res?.data?.counts || {});
            } catch (error) {
                if (cancelled) return;

                setProperties([]);
                showToast(error?.message || "Unable to load property requests.", "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [status, reloadKey]);

    const filteredProperties = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return properties;

        return properties.filter((property) =>
            [
                property?.title,
                property?.property_id,
                property?.location,
                property?.city,
                property?.property_type,
                property?.creator?.name,
                property?.creator?.email,
            ]
                .join(" ")
                .toLowerCase()
                .includes(term)
        );
    }, [properties, search]);

    const pageCount = Math.ceil(filteredProperties.length / pageSize);

    const currentPageProperties = useMemo(() => {
        const start = pageIndex * pageSize;

        return filteredProperties.slice(start, start + pageSize);
    }, [filteredProperties, pageIndex, pageSize]);

    const tableProps = {
        pageCount,
        pageOptions: Array.from({ length: pageCount }),
        state: { pageIndex, pageSize },
        gotoPage: (page) => setPageIndex(page),
        setPageSize: (size) => {
            setPageSize(size);
            setPageIndex(0);
        },
    };

    const openAction = (type, property) => {
        setAction({ type, property });
        setNote("");
        setNoteError("");
    };

    const closeAction = () => {
        if (saving) return;

        setAction(null);
    };

    const handleConfirm = async () => {
        if (!action) return;

        const config = ACTIONS[action.type];
        const text = note.trim();

        if (config.noteRequired && !text) {
            setNoteError("Please write a note so the seller / broker knows what to fix.");
            return;
        }

        setSaving(true);

        try {
            const res = await config.call(action.property.id, text);

            showToast(res?.message || "Property updated.");
            setAction(null);
            // Moves to another tab: reload list + counts
            setReloadKey((key) => key + 1);
        } catch (error) {
            showToast(error?.message || "Something went wrong.", "error");
        } finally {
            setSaving(false);
        }
    };

    const actionConfig = action ? ACTIONS[action.type] : null;

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Properties Request", active: true },
                ]}
                title="Properties Request"
            />

            <p className="mt-1 mb-0 text-sm text-[#62748E]">
                Properties added by sellers and brokers show on the website only after approval.
            </p>

            {/* Status tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
                {TABS.map((tab) => {
                    const active = status === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => {
                                setStatus(tab.key);
                                setSearch("");
                                setPageIndex(0);
                            }}
                            className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition
                                ${active
                                    ? "bg-[#E87722] text-white shadow-sm"
                                    : "border border-gray-200 bg-white text-[#1A1F36] hover:border-[#E87722] hover:text-[#E87722]"
                                }`}
                        >
                            {tab.label}
                            <span
                                className={`min-w-[22px] rounded-full px-1.5 text-center text-xs ${active ? "bg-white/25 text-white" : "bg-gray-100 text-[#62748E]"}`}
                            >
                                {counts?.[tab.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="mt-3 mb-3 relative w-full sm:max-w-sm">
                <FiSearch
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Search by title, property ID, seller..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {[1, 2, 3, 4].map((key) => (
                        <div key={key} className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            <div className="h-40 bg-gray-200" />
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-4/5 rounded bg-gray-200" />
                                <div className="h-3 w-2/3 rounded bg-gray-100" />
                                <div className="h-9 rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : currentPageProperties.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {currentPageProperties.map((property) => {
                        const address = [property.location, property.city, property.state].filter(Boolean).join(", ");
                        const isPending = property.approval_status === "pending";

                        return (
                            <div
                                key={property.id}
                                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                            >
                                <div className="relative h-40 w-full shrink-0 bg-gray-100">
                                    {property.main_image ? (
                                        <img src={property.main_image} alt={property.title || "Property"} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                            <FaRegImage size={36} />
                                        </div>
                                    )}

                                    <ApprovalBadge status={property.approval_status} className="absolute left-2.5 top-2.5 shadow" />

                                    {property.property_type && (
                                        <span className="absolute right-2.5 top-2.5 max-w-[40%] truncate rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold capitalize text-[#1A1F36] shadow">
                                            {property.property_type}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col px-4 pt-3 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="mb-0 truncate text-base font-bold text-[#1A1F36]">
                                            {property.price ? (
                                                <>
                                                    <span className="mr-0.5 text-[#E87722]">₹</span>
                                                    {Number(property.price).toLocaleString("en-IN")}
                                                </>
                                            ) : (
                                                "Price on request"
                                            )}
                                        </p>
                                        {property.property_id && (
                                            <span className="shrink-0 rounded-md bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#E87722]">
                                                {property.property_id}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mb-0 mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[#001737]" title={property.title || ""}>
                                        <LuHouse size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{property.title || "-"}</span>
                                    </p>

                                    <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[13px] text-[#62748E]" title={address}>
                                        <LuMapPin size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{address || "-"}</span>
                                    </p>

                                    <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[12px] text-[#62748E]">
                                        <LuCalendarClock size={14} className="shrink-0 text-[#E87722]" />
                                        {isPending
                                            ? `Submitted ${formatDate(property.submitted_at || property.created_at)}`
                                            : `Reviewed ${formatDate(property.reviewed_at)}${property.reviewer?.name ? ` by ${property.reviewer.name}` : ""}`}
                                    </p>

                                    {property.approval_note && (
                                        <p className="mb-0 mt-2 line-clamp-3 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[12px] text-[#1A1F36]" title={property.approval_note}>
                                            <span className="font-semibold">Note: </span>
                                            {property.approval_note}
                                        </p>
                                    )}

                                    <div className="mt-3 border-t border-gray-100 pt-2">
                                        <p className="mb-0 text-[11px] text-[#62748E]">Added by</p>
                                        <AddedBy creator={property.creator} />
                                    </div>

                                    <div className="mt-auto pt-3">
                                        {canReview && (
                                            <div className="mb-2 grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    disabled={property.approval_status === "approved"}
                                                    onClick={() => openAction("approve", property)}
                                                    className="flex h-8 items-center justify-center gap-1 rounded-lg bg-green-600 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <FiCheck size={14} /> Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={property.approval_status === "changes_requested"}
                                                    onClick={() => openAction("changes", property)}
                                                    className="flex h-8 items-center justify-center gap-1 rounded-lg border border-blue-600 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <FiEdit3 size={13} /> Changes
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={property.approval_status === "rejected"}
                                                    onClick={() => openAction("reject", property)}
                                                    className="flex h-8 items-center justify-center gap-1 rounded-lg border border-red-600 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <FiX size={14} /> Reject
                                                </button>
                                            </div>
                                        )}

                                        <Link
                                            href={`/admin/propertyManagement/propertyDetail/${property.id}`}
                                            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#E87722] text-sm font-semibold text-white transition hover:bg-[#d96818]"
                                        >
                                            <LuEye size={15} />
                                            View Full Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center text-[#62748E]">
                    No {TABS.find((tab) => tab.key === status)?.label.toLowerCase()} property requests
                </div>
            )}

            {!loading && filteredProperties.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={[
                            { text: "12", value: 12 },
                            { text: "24", value: 24 },
                            { text: "48", value: 48 },
                        ]}
                    />
                </div>
            )}

            {/* Approve / Request changes / Reject */}
            <Tmodal
                isOpen={Boolean(action)}
                onClose={closeAction}
                title={actionConfig?.title}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeAction}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={saving}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white ${actionConfig?.buttonClass || ""}`}
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    {actionConfig?.busy}
                                </>
                            ) : (
                                actionConfig?.button
                            )}
                        </button>
                    </div>
                }
            >
                <p className="mb-3 text-gray-600">
                    <span className="font-semibold text-gray-900">{action?.property?.title}</span>
                    {action?.property?.creator?.name ? ` by ${action.property.creator.name}` : ""}
                </p>

                {action?.type === "approve" && (
                    <p className="mb-3 text-sm text-[#62748E]">The property will go live on the website right away.</p>
                )}

                <label className="mb-1 block text-sm font-medium text-[#1A1F36]">
                    {actionConfig?.noteLabel}
                    {actionConfig?.noteRequired && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                    rows={4}
                    value={note}
                    maxLength={2000}
                    onChange={(e) => {
                        setNote(e.target.value);
                        setNoteError("");
                    }}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                    placeholder={actionConfig?.noteRequired ? "e.g. Please upload clear photos and add the RERA number." : ""}
                />
                {noteError && <p className="mb-0 mt-1 text-xs text-red-600">{noteError}</p>}
                <p className="mb-0 mt-1 text-xs text-[#62748E]">The seller / broker gets this in a notification and by email.</p>
            </Tmodal>
        </div>
    );
}
