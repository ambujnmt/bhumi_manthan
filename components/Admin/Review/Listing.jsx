"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FaStar } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiCheck, FiSearch, FiX } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import { dangerActionButtonClass } from "../actionButtonClass";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { approveReview, deleteReview, getAdminReviews, rejectReview } from "../../../utils/adminFetchApi";

const TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
];

const STATUS_BADGE = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "-";

const Stars = ({ rating }) => (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <FaStar key={star} size={14} className={star <= rating ? "text-yellow-400" : "text-gray-200"} />
        ))}
    </span>
);

export default function Listing() {
    const can = useAdminPermission();
    const canReview = can("reviews.edit");
    const canDelete = can("reviews.delete");

    const [status, setStatus] = useState("pending");
    const [reviews, setReviews] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [busyId, setBusyId] = useState(null);

    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(30);

    // { type: "reject" | "delete", review }
    const [modal, setModal] = useState(null);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);

            try {
                const res = await getAdminReviews(status);

                if (cancelled) return;

                setReviews(Array.isArray(res?.data?.reviews) ? res.data.reviews : []);
                setCounts(res?.data?.counts || {});
            } catch (error) {
                if (cancelled) return;

                setReviews([]);
                showToast(error?.message || "Unable to load reviews.", "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [status, reloadKey]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return reviews;

        return reviews.filter((item) =>
            [item.review, item.agent_name, item.user?.name, item.user?.email]
                .join(" ")
                .toLowerCase()
                .includes(term)
        );
    }, [reviews, search]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const pageItems = useMemo(
        () => filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
        [filtered, pageIndex, pageSize]
    );

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

    const reload = () => setReloadKey((key) => key + 1);

    const handleApprove = async (item) => {
        setBusyId(item.id);

        try {
            const res = await approveReview(item.id);
            showToast(res?.message || "Review approved.");
            reload();
        } catch (error) {
            showToast(error?.message || "Something went wrong.", "error");
        } finally {
            setBusyId(null);
        }
    };

    const openModal = (type, review) => {
        setModal({ type, review });
        setNote("");
    };

    const closeModal = () => {
        if (!saving) setModal(null);
    };

    const confirmModal = async () => {
        if (!modal) return;

        setSaving(true);

        try {
            const res = modal.type === "reject"
                ? await rejectReview(modal.review.id, note.trim())
                : await deleteReview(modal.review.id);

            showToast(res?.message || "Done.");
            setModal(null);
            reload();
        } catch (error) {
            showToast(error?.message || "Something went wrong.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Reviews", active: true },
                ]}
                title="Review Approval"
            />

            <p className="mt-1 mb-0 text-sm text-[#62748E]">
                Buyer ratings of sellers and brokers. Only approved reviews show on the website and count in the average rating.
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
                            <span className={`min-w-[22px] rounded-full px-1.5 text-center text-xs ${active ? "bg-white/25 text-white" : "bg-gray-100 text-[#62748E]"}`}>
                                {counts?.[tab.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative mt-3 mb-4 w-full sm:max-w-sm">
                <FiSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by review, seller / broker, buyer..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                />
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center rounded-xl bg-white py-16 shadow">
                    <Spinner size="md" />
                </div>
            )}

            {/* Empty */}
            {!loading && pageItems.length === 0 && (
                <div className="rounded-xl bg-white py-10 text-center text-gray-500 shadow">
                    No {status} reviews
                </div>
            )}

            {/* Review Cards */}
            {!loading && pageItems.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pageItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                        >
                            {/* Buyer + status */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="mb-0 truncate font-semibold text-[#1A1F36]">
                                        {item.user?.name || "Customer"}
                                    </p>
                                    <p className="mb-0 mt-0.5 truncate text-xs text-[#62748E]">
                                        {item.user?.email || item.user?.phone || "-"}
                                    </p>
                                </div>

                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGE[item.status] || ""}`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* Seller / Broker + rating */}
                            <div className="mt-3 flex items-center justify-between gap-3 border-y border-gray-100 py-2.5">
                                <div className="min-w-0">
                                    <p className="mb-0 text-[11px] text-[#62748E]">Seller / Broker</p>
                                    <p className="mb-0 truncate text-sm font-medium text-[#1A1F36]">
                                        {item.agent_name || item.agent_key}
                                        {item.agent_type && (
                                            <span className="ml-1.5 text-xs font-normal text-[#62748E]">
                                                ({item.agent_type})
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <Stars rating={item.rating} />
                            </div>

                            {/* Review text */}
                            <div className="mt-3 flex-1">
                                {item.review ? (
                                    <p className="mb-0 whitespace-pre-line break-words text-sm text-[#1A1F36]">
                                        {item.review}
                                    </p>
                                ) : (
                                    <p className="mb-0 text-sm italic text-[#94A3B8]">
                                        Rating only, no text
                                    </p>
                                )}

                                {item.admin_note && (
                                    <p className="mb-0 mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-[#62748E]">
                                        <span className="font-semibold">Admin note:</span> {item.admin_note}
                                    </p>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="mt-3 text-xs text-[#62748E]">
                                <p className="mb-0">Submitted {formatDate(item.submitted_at)}</p>
                                {item.reviewed_at && (
                                    <p className="mb-0 mt-0.5">
                                        Reviewed {formatDate(item.reviewed_at)}
                                        {item.reviewer_name ? ` by ${item.reviewer_name}` : ""}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            {(canReview || canDelete) && (
                                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                                    {canReview && item.status !== "approved" && (
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(item)}
                                            disabled={busyId === item.id}
                                            className="flex h-8 items-center gap-1 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                                        >
                                            {busyId === item.id ? <Spinner size="sm" color="white" /> : <FiCheck size={14} />}
                                            Approve
                                        </button>
                                    )}

                                    {canReview && item.status !== "rejected" && (
                                        <button
                                            type="button"
                                            onClick={() => openModal("reject", item)}
                                            className="flex h-8 items-center gap-1 rounded-lg border border-red-600 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                        >
                                            <FiX size={14} />
                                            Reject
                                        </button>
                                    )}

                                    {canDelete && (
                                        <div className="ml-auto">
                                            <Tooltip content="Delete Review">
                                                <button
                                                    type="button"
                                                    onClick={() => openModal("delete", item)}
                                                    aria-label="Delete review"
                                                    className={dangerActionButtonClass}
                                                >
                                                    <FaRegTrashCan size={14} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
                <div className="mt-4 rounded-xl bg-white p-3 shadow">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={[
                            { text: "30", value: 30 },
                            { text: "60", value: 60 },
                            { text: "90", value: 90 },
                        ]}
                    />
                </div>
            )}

            {/* Reject / Delete */}
            <Tmodal
                isOpen={Boolean(modal)}
                onClose={closeModal}
                title={modal?.type === "reject" ? "Reject Review" : "Delete Review"}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmModal}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                            {saving && <Spinner size="sm" color="white" />}
                            {modal?.type === "reject" ? "Reject" : "Delete"}
                        </button>
                    </div>
                }
            >
                <div className="mb-3 rounded-lg bg-gray-50 p-3">
                    <Stars rating={modal?.review?.rating || 0} />
                    <p className="mb-0 mt-1.5 text-sm text-[#1A1F36]">{modal?.review?.review || "Rating only, no text"}</p>
                    <p className="mb-0 mt-1 text-xs text-[#62748E]">
                        {modal?.review?.user?.name || "Customer"} → {modal?.review?.agent_name || modal?.review?.agent_key}
                    </p>
                </div>

                {modal?.type === "reject" ? (
                    <>
                        <label htmlFor="reject_note" className="mb-1 block text-sm font-medium text-[#1A1F36]">
                            Reason (optional, shown to the buyer)
                        </label>
                        <textarea
                            id="reject_note"
                            rows={3}
                            maxLength={1000}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Review contains abusive language"
                            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                        />
                    </>
                ) : (
                    <p className="mb-0 text-sm text-red-600">This review will be removed permanently. This cannot be undone.</p>
                )}
            </Tmodal>
        </div>
    );
}
