"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiDownload, FiMail, FiUsers, FiCalendar, FiSun, FiTrendingUp } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { deleteInboxItem, getAdminInbox } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";

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

const sizePerPageList = [
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "50", value: 50 },
];

// Download visible list as CSV (opens in Excel)
const downloadCsv = (rows) => {
    const lines = [
        ["Email", "Subscribed On"],
        ...rows.map((row) => [row.email, formatDate(row.created_at)]),
    ].map((cells) => cells.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","));

    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Admin -> Newsletter Subscribers (website footer "Subscribe" form)
 */
export default function Listing() {
    const can = useAdminPermission();

    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchSubscribers = async () => {
            setLoading(true);

            try {
                const res = await getAdminInbox("subscribers");

                setSubscribers(Array.isArray(res?.data?.subscribers) ? res.data.subscribers : []);
            } catch (error) {
                console.error("Failed to fetch subscribers:", error);
                showToast(error?.message || "Failed to load subscribers.", "error");
                setSubscribers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term ? subscribers.filter((item) => item.email?.toLowerCase().includes(term)) : subscribers;
    }, [subscribers, search]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const currentPage = filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

    // Adapter for Pagination component
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

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await deleteInboxItem("subscribers", deleteTarget.id);

            setSubscribers((previous) => previous.filter((item) => item.id !== deleteTarget.id));
            showToast(res?.message || "Subscriber deleted successfully.");
            setDeleteTarget(null);
        } catch (error) {
            showToast(error?.message || "Failed to delete subscriber.", "error");
        } finally {
            setDeleting(false);
        }
    };

    // Counts by subscribe date
    const stats = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const since = (start) => subscribers.filter((item) => item.created_at && new Date(item.created_at) >= start).length;

        return [
            { label: "Total Subscribers", value: subscribers.length, icon: FiUsers, style: "bg-orange-50 text-[#E87722]" },
            { label: "Today", value: since(today), icon: FiSun, style: "bg-blue-50 text-blue-600" },
            { label: "Last 7 Days", value: since(weekStart), icon: FiTrendingUp, style: "bg-violet-50 text-violet-600" },
            { label: "This Month", value: since(monthStart), icon: FiCalendar, style: "bg-emerald-50 text-emerald-600" },
        ];
    }, [subscribers]);

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Subscribers", active: true },
                ]}
                title="Newsletter Subscribers"
            />

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, icon: Icon, style }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${style}`}>
                            <Icon size={20} />
                        </span>
                        <div>
                            <p className="mb-0 text-xs text-[#62748E]">{label}</p>
                            <p className="mb-0 text-xl font-bold text-[#1A1F36]">{loading ? "-" : value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + export */}
            <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E87722] sm:w-72"
                />

                <button
                    type="button"
                    onClick={() => downloadCsv(filtered)}
                    disabled={!filtered.length}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E87722] px-4 text-sm font-semibold text-[#E87722] transition hover:bg-orange-50 disabled:opacity-50"
                >
                    <FiDownload size={15} />
                    Export CSV
                </button>
            </div>

            <div className="w-full overflow-auto rounded-xl bg-white shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="w-12 px-4 py-3 text-left whitespace-nowrap">#</th>
                            <th className="w-full px-4 py-3 text-left whitespace-nowrap">Email</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Subscribed On</th>
                            {can("subscribers.delete") && <th className="px-4 py-3 text-left whitespace-nowrap">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="flex items-center justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : currentPage.length ? (
                            currentPage.map((item, index) => (
                                <tr key={item.id} className="border-t align-middle hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-[#62748E]">{pageIndex * pageSize + index + 1}</td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <a
                                            href={`mailto:${item.email}`}
                                            className="flex items-center gap-2 font-medium text-[#1A1F36] no-underline hover:text-[#E87722]"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#E87722]">
                                                <FiMail size={14} />
                                            </span>
                                            {item.email}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-[#62748E]">{formatDate(item.created_at)}</td>
                                    {can("subscribers.delete") && (
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <Tooltip content="Delete Subscriber">
                                                <button type="button" onClick={() => setDeleteTarget(item)} className={actionButtonClass}>
                                                    <FaRegTrashCan size={14} />
                                                </button>
                                            </Tooltip>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-gray-500">
                                    {search ? "No subscriber found." : "No subscribers yet."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="border-t p-3">
                    <Pagination tableProps={tableProps} sizePerPageList={sizePerPageList} />
                </div>
            </div>

            {/* Delete confirm */}
            <Tmodal
                isOpen={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                title="Delete Subscriber"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 rounded-lg bg-[rgb(232,119,34)] px-4 py-2 text-white"
                        >
                            {deleting ? (
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
                    Remove <span className="font-semibold text-gray-900">{deleteTarget?.email}</span> from subscribers?
                </p>
            </Tmodal>
        </div>
    );
}
