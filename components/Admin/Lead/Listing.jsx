"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, Spinner, Tooltip } from "@heroui/react";
import { FaRegTrashCan, FaWhatsapp } from "react-icons/fa6";
import { FiDollarSign, FiDownload, FiMail, FiMapPin, FiPhone, FiSearch } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import { actionButtonClass } from "../actionButtonClass";
import { AiOutlineEye } from "react-icons/ai";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { deleteLead, downloadLeads, getAdminLeads, getLeadSaleOptions, updateLeadStatus } from "../../../utils/adminFetchApi";
import { useUser } from "../../../context/UserContext";
import SellLeadModal from "./SellLeadModal";

// Lead type tabs
const TYPE_TABS = [
    { key: "all", label: "All" },
    { key: "profile", label: "Get Number" },
    { key: "property", label: "Property" },
    { key: "project", label: "Project" },
];

const TYPE_BADGES = {
    profile: { label: "Get Number", className: "bg-orange-50 text-[#C2410C]" },
    property: { label: "Property", className: "bg-blue-50 text-blue-700" },
    project: { label: "Project", className: "bg-purple-50 text-purple-700" },
};

const STATUS_STYLES = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-amber-100 text-amber-800",
    interested: "bg-green-100 text-green-800",
    closed: "bg-gray-200 text-gray-700",
    not_interested: "bg-red-100 text-red-700",
};

const statusLabel = (status) => {
    const text = (status || "").replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatDay = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const formatTime = (value) =>
    value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

const formatINR = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

// wa.me needs country code: 10-digit Indian numbers get 91
const whatsappLink = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

function TypeBadge({ type }) {
    const badge = TYPE_BADGES[type];

    if (!badge) return null;

    return <span className={`inline-block shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>;
}

// What the lead is about: seller / broker, property or project
function LeadTarget({ lead, full = false }) {
    const titleClass = full ? "text-sm font-medium text-[#1A1F36]" : "block truncate text-sm font-medium text-[#1A1F36]";

    let title;
    let sub = null;

    if (lead.lead_type === "profile") {
        title = <p className={`mb-0 ${titleClass}`} title={lead.agent?.name}>{lead.agent?.name || "-"}</p>;
        // Only a seller / broker account is worth showing (admin-listed agents show no role)
        if (["seller", "broker"].includes(lead.agent?.role)) sub = lead.agent.role.charAt(0).toUpperCase() + lead.agent.role.slice(1);
    } else if (lead.lead_type === "property") {
        // List shows only the Property ID (opens the property); the name is in the detail popup
        const label = full ? lead.property?.title : lead.property?.property_id || `Property #${lead.property?.id}`;

        title = lead.property ? (
            <Link
                href={`/admin/propertyManagement/propertyDetail/${lead.property.id}`}
                className={`${titleClass} hover:text-[#E87722] ${full ? "" : "font-mono"}`}
                title={full ? lead.property.title : "Open property"}
            >
                {label}
            </Link>
        ) : (
            <p className="mb-0 text-sm text-[#94A3B8]">Property removed</p>
        );
        sub = full
            ? [lead.property?.property_id, lead.property?.city].filter(Boolean).join(" · ")
            : lead.property?.city;
    } else {
        title = <p className={`mb-0 ${titleClass}`} title={lead.project?.name}>{lead.project?.name || "Project removed"}</p>;
        sub = lead.project?.city;
    }

    return (
        <div className="min-w-0 leading-tight">
            <TypeBadge type={lead.lead_type} />
            <div className="mt-1">{title}</div>
            {sub && <p className="mb-0 mt-0.5 truncate text-xs text-[#62748E]">{sub}</p>}
        </div>
    );
}

// List cell: badge + target on one line, ID / city + sale info below (no property name)
function LeadForCell({ lead, badge }) {
    let target;
    let sub = null;

    if (lead.lead_type === "profile") {
        target = <span className="truncate font-medium text-[#1A1F36]">{lead.agent?.name || "-"}</span>;
        if (["seller", "broker"].includes(lead.agent?.role)) sub = lead.agent.role.charAt(0).toUpperCase() + lead.agent.role.slice(1);
    } else if (lead.lead_type === "property") {
        target = lead.property ? (
            <Link
                href={`/admin/propertyManagement/propertyDetail/${lead.property.id}`}
                className="font-mono text-[13px] font-medium text-[#1A1F36] hover:text-[#E87722]"
                title="Open property"
            >
                {lead.property.property_id || `#${lead.property.id}`}
            </Link>
        ) : (
            <span className="text-[#94A3B8]">Property removed</span>
        );
        sub = lead.property?.city;
    } else {
        target = <span className="truncate font-medium text-[#1A1F36]">{lead.project?.name || "Project removed"}</span>;
        sub = lead.project?.city;
    }

    return (
        <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-center gap-2">
                <TypeBadge type={lead.lead_type} />
                {target}
            </div>
            {(sub || badge) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#62748E]">
                    {/* City (property / project) or seller / broker role, as a badge */}
                    {sub && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-[#283A86]">
                            {lead.lead_type !== "profile" && <FiMapPin size={10} className="shrink-0 text-[#E87722]" />}
                            {sub}
                        </span>
                    )}
                    {badge}
                </div>
            )}
        </div>
    );
}

function StatTile({ label, value, sub }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="mb-0.5 text-xs font-medium text-[#62748E]">{label}</p>
            <p className="mb-0 text-xl font-bold tabular-nums text-[#1A1F36]">{value}</p>
            {sub && <p className="mb-0 text-[11px] text-[#94A3B8]">{sub}</p>}
        </div>
    );
}

export default function Listing() {
    const can = useAdminPermission();
    const canEdit = can("leads.edit");
    const canDelete = can("leads.delete");

    const [leads, setLeads] = useState([]);
    const [statuses, setStatuses] = useState(Object.keys(STATUS_STYLES));
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    const [type, setType] = useState("all");
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    // Received date: all | today | month | year | custom (fromDate / toDate)
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [downloading, setDownloading] = useState("");
    // One row per mobile number (list + download)
    const [uniqueOnly, setUniqueOnly] = useState(false);

    // CSV / Excel of exactly what the filters show
    const handleDownload = async (format) => {
        setDownloading(format);

        try {
            const fileName = await downloadLeads({
                format,
                type,
                status: statusFilter,
                period,
                from: period === "custom" ? fromDate : "",
                to: period === "custom" ? toDate : "",
                q: search.trim(),
                unique: uniqueOnly ? 1 : "",
            });
            showToast(`Downloaded ${fileName}`);
        } catch (error) {
            showToast(error?.message || "Download failed. Please try again.", "error");
        } finally {
            setDownloading("");
        }
    };
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20); // 20 leads per page

    const [viewLead, setViewLead] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Selling leads: super admin / staff with lead_sales.create (never seller / broker)
    const { user } = useUser();
    const isOwnerPanel = ["seller", "broker"].includes(user?.role);
    const canSell = !isOwnerPanel && can("lead_sales.create");
    const [saleOptions, setSaleOptions] = useState(null);
    const [sellTarget, setSellTarget] = useState(null);

    useEffect(() => {
        let cancelled = false;

        getAdminLeads()
            .then((res) => {
                if (cancelled) return;
                setLeads(Array.isArray(res?.data?.leads) ? res.data.leads : []);
                if (Array.isArray(res?.data?.statuses)) setStatuses(res.data.statuses);
            })
            .catch((error) => {
                if (cancelled) return;
                setLeads([]);
                showToast(error?.message || "Unable to load leads.", "error");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!canSell) return;

        getLeadSaleOptions()
            .then((res) => setSaleOptions(res?.data || null))
            .catch(() => setSaleOptions(null));
    }, [canSell]);

    // Received date filter (same as the export): all | today | month | year | custom
    const inPeriod = (lead) => {
        if (period === "all") return true;

        const date = new Date(lead.created_at);
        const now = new Date();

        if (period === "today") return date.toDateString() === now.toDateString();
        if (period === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        if (period === "year") return date.getFullYear() === now.getFullYear();

        // custom: from / to are "YYYY-MM-DD" (whole days, local time)
        if (fromDate && date < new Date(`${fromDate}T00:00:00`)) return false;
        if (toDate && date > new Date(`${toDate}T23:59:59.999`)) return false;

        return true;
    };

    // Type tab counts follow the date filter
    const typeCounts = useMemo(() => {
        const list = leads.filter(inPeriod);
        const counts = { all: list.length };
        list.forEach((lead) => {
            counts[lead.lead_type] = (counts[lead.lead_type] || 0) + 1;
        });
        return counts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads, period, fromDate, toDate]);

    // Headline counts: total / today / this month / this year
    const stats = useMemo(() => {
        const now = new Date();
        let today = 0;
        let thisMonth = 0;
        let thisYear = 0;

        leads.forEach((lead) => {
            const date = new Date(lead.created_at);

            if (date.getFullYear() !== now.getFullYear()) return;
            thisYear += 1;
            if (date.getMonth() !== now.getMonth()) return;
            thisMonth += 1;
            if (date.getDate() === now.getDate()) today += 1;
        });

        return { total: leads.length, today, thisMonth, thisYear };
    }, [leads]);

    // Same buyer = same mobile (last 10 digits)
    const phoneKey = (lead) => String(lead.phone || "").replace(/\D/g, "").slice(-10) || `lead-${lead.id}`;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        const list = leads.filter((lead) => {
            if (type !== "all" && lead.lead_type !== type) return false;
            if (statusFilter && lead.status !== statusFilter) return false;
            if (!inPeriod(lead)) return false;
            if (!term) return true;

            return [lead.name, lead.email, lead.phone, lead.message, lead.agent?.name, lead.property?.title, lead.property?.property_id, lead.project?.name]
                .join(" ")
                .toLowerCase()
                .includes(term);
        });

        if (!uniqueOnly) return list;

        // Unique: one row per mobile number, the latest lead (list is newest first)
        const seen = new Set();

        return list.filter((lead) => {
            const key = phoneKey(lead);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads, type, statusFilter, search, period, fromDate, toDate, uniqueOnly]);

    // How many leads each mobile number sent (within the current filters, before "unique")
    const enquiryCounts = useMemo(() => {
        if (!uniqueOnly) return {};

        const term = search.trim().toLowerCase();
        const counts = {};

        leads.forEach((lead) => {
            if (type !== "all" && lead.lead_type !== type) return;
            if (statusFilter && lead.status !== statusFilter) return;
            if (!inPeriod(lead)) return;
            if (term && ![lead.name, lead.email, lead.phone, lead.message, lead.agent?.name, lead.property?.title, lead.property?.property_id, lead.project?.name]
                .join(" ").toLowerCase().includes(term)) return;

            const key = phoneKey(lead);
            counts[key] = (counts[key] || 0) + 1;
        });

        return counts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads, type, statusFilter, search, period, fromDate, toDate, uniqueOnly]);

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

    const changeStatus = async (lead, status) => {
        if (status === lead.status) return;

        setSavingId(lead.id);

        try {
            const res = await updateLeadStatus(lead.id, status);
            const saved = res?.data?.lead;

            setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, ...(saved || { status }) } : item)));
            setViewLead((current) => (current?.id === lead.id ? { ...current, status } : current));
            showToast(res?.message || "Lead status updated.");
        } catch (error) {
            showToast(error?.message || "Unable to update status.", "error");
        } finally {
            setSavingId(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await deleteLead(deleteTarget.id);
            setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.id));
            showToast(res?.message || "Lead deleted.");
            setDeleteTarget(null);
        } catch (error) {
            showToast(error?.message || "Unable to delete lead.", "error");
        } finally {
            setDeleting(false);
        }
    };

    // Sale done -> update the lead's sales info (sold count / buyers)
    const handleSold = (sale) => {
        setSellTarget(null);

        if (!sale) return;

        setLeads((prev) =>
            prev.map((item) => {
                if (item.id !== sale.lead_id) return item;

                const sales = item.sales || { sold_count: 0, pending_count: 0, revenue: 0, buyers: [] };
                const paid = sale.payment_status === "paid";

                return {
                    ...item,
                    sales: {
                        ...sales,
                        sold_count: sales.sold_count + (paid ? 1 : 0),
                        pending_count: sales.pending_count + (paid ? 0 : 1),
                        revenue: sales.revenue + (paid ? sale.amount : 0),
                        buyers: [
                            ...sales.buyers,
                            { sale_id: sale.id, buyer_id: sale.buyer?.id, name: sale.buyer?.name, status: sale.payment_status, amount: sale.amount },
                        ],
                    },
                };
            })
        );
    };

    // Bought leads are read only for the seller / broker who bought them
    const statusSelect = (lead) =>
        canEdit && !lead.purchased ? (
            <div className="flex items-center gap-1.5">
                <select
                    value={lead.status || "new"}
                    disabled={savingId === lead.id}
                    onChange={(e) => changeStatus(lead, e.target.value)}
                    aria-label={`Status of lead from ${lead.name}`}
                    className={`w-[140px] cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-6 text-xs font-semibold outline-none ${STATUS_STYLES[lead.status] || "bg-gray-100"}`}
                >
                    {statuses.map((status) => (
                        <option key={status} value={status} className="bg-white text-[#1A1F36]">
                            {statusLabel(status)}
                        </option>
                    ))}
                </select>
                {savingId === lead.id && <Spinner size="sm" />}
            </div>
        ) : (
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[lead.status] || "bg-gray-100"}`}>
                {statusLabel(lead.status)}
            </span>
        );

    // Admin: who bought it / seller: bought from admin
    const saleBadge = (lead) => {
        if (lead.purchased) {
            return (
                <span className="inline-block rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-semibold text-green-700">
                    Purchased{lead.purchased_at ? ` · ${formatDay(lead.purchased_at)}` : ""}
                </span>
            );
        }

        if (!lead.sales || (lead.sales.sold_count === 0 && lead.sales.pending_count === 0)) return null;

        return (
            <Tooltip
                content={
                    <div className="p-1 text-xs">
                        {lead.sales.buyers.map((item) => (
                            <p key={item.sale_id} className="mb-0.5">
                                {item.name} · {formatINR(item.amount)} ({item.status})
                            </p>
                        ))}
                    </div>
                }
            >
                <span className="inline-block cursor-help rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-semibold text-green-700">
                    Sold {lead.sales.sold_count}×{lead.sales.revenue > 0 && ` · ${formatINR(lead.sales.revenue)}`}
                    {lead.sales.pending_count > 0 && ` · ${lead.sales.pending_count} pending`}
                </span>
            </Tooltip>
        );
    };

    const colCount = 5;

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Leads", active: true },
                ]}
                title="Leads"
            />

            <p className="mt-1 mb-0 text-sm text-[#62748E]">
                Buyers who asked for a seller / broker number (Get Number) or enquired on a property or project.
            </p>

            {/* Headline counts: click one to show only those leads */}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    { key: "all", label: "Total Leads", value: stats.total, sub: "All time" },
                    { key: "today", label: "Today", value: stats.today, sub: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) },
                    { key: "month", label: "This Month", value: stats.thisMonth, sub: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }) },
                    { key: "year", label: "This Year", value: stats.thisYear, sub: String(new Date().getFullYear()) },
                ].map((tile) => (
                    <button
                        key={tile.key}
                        type="button"
                        onClick={() => {
                            setPeriod(tile.key);
                            setPageIndex(0);
                        }}
                        aria-pressed={period === tile.key}
                        className={`rounded-xl text-left transition ${period === tile.key ? "ring-2 ring-[#E87722]" : "hover:ring-1 hover:ring-orange-200"}`}
                    >
                        <StatTile label={tile.label} value={loading ? "–" : tile.value} sub={tile.sub} />
                    </button>
                ))}
            </div>

            {/* Toolbar: type tabs + search + status, one row */}
            <div className="mt-4 mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1" role="tablist" aria-label="Lead type">
                    {TYPE_TABS.map((tab) => {
                        const active = type === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                    setType(tab.key);
                                    setPageIndex(0);
                                }}
                                className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
                                    active ? "bg-[#E87722] text-white" : "text-[#62748E] hover:bg-gray-50 hover:text-[#1A1F36]"
                                }`}
                            >
                                {tab.label}
                                {!loading && (
                                    <span className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold ${active ? "bg-white/25 text-white" : "bg-gray-100 text-[#62748E]"}`}>
                                        {typeCounts[tab.key] || 0}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                        <FiSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, phone, email, property..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPageIndex(0);
                            }}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPageIndex(0);
                        }}
                        aria-label="Filter by status"
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none focus:border-[#E87722]"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Date filter + download (exactly the filtered leads) */}
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#62748E]">Received</span>
                    <div className="flex flex-wrap gap-1 rounded-lg bg-gray-50 p-1" role="tablist" aria-label="Received date">
                        {[
                            ["all", "All time"],
                            ["today", "Today"],
                            ["month", "This Month"],
                            ["year", "This Year"],
                            ["custom", "Custom"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={period === key}
                                onClick={() => {
                                    setPeriod(key);
                                    setPageIndex(0);
                                }}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                                    period === key ? "bg-[#001737] text-white" : "text-[#62748E] hover:bg-white hover:text-[#1A1F36]"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {period === "custom" && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#62748E]">
                            <input
                                type="date"
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setPageIndex(0);
                                }}
                                aria-label="From date"
                                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-[#1A1F36] outline-none focus:border-[#E87722]"
                            />
                            to
                            <input
                                type="date"
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setPageIndex(0);
                                }}
                                aria-label="To date"
                                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-[#1A1F36] outline-none focus:border-[#E87722]"
                            />
                        </div>
                    )}

                    {/* Unique: one row per mobile number (list + CSV / Excel) */}
                    <label
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            uniqueOnly ? "bg-orange-50 text-[#E87722] ring-1 ring-[#E87722]" : "bg-gray-50 text-[#62748E] hover:text-[#1A1F36]"
                        }`}
                        title="Show each mobile number once (its latest lead) with how many enquiries it sent"
                    >
                        <input
                            type="checkbox"
                            checked={uniqueOnly}
                            onChange={(e) => {
                                setUniqueOnly(e.target.checked);
                                setPageIndex(0);
                            }}
                            className="h-3.5 w-3.5 accent-[#E87722]"
                        />
                        Unique buyers only
                    </label>

                    {!loading && (
                        <span className="text-xs text-[#62748E]">
                            <span className="font-semibold text-[#1A1F36]">{filtered.length}</span>{" "}
                            {uniqueOnly ? `unique buyer${filtered.length === 1 ? "" : "s"}` : `lead${filtered.length === 1 ? "" : "s"} match`}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleDownload("csv")}
                        disabled={loading || filtered.length === 0 || Boolean(downloading)}
                        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#001737] bg-white px-3 text-xs font-semibold text-[#001737] transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        {downloading === "csv" ? <Spinner size="sm" /> : <FiDownload size={14} />} Download CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDownload("xlsx")}
                        disabled={loading || filtered.length === 0 || Boolean(downloading)}
                        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#001737] px-3 text-xs font-semibold text-white transition hover:bg-[#283A86] disabled:opacity-50"
                    >
                        {downloading === "xlsx" ? <Spinner size="sm" color="white" /> : <FiDownload size={14} />} Download Excel
                    </button>
                </div>
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Name / Contact</th>
                            <th className="px-3 py-3 text-left whitespace-nowrap w-full">Lead For</th>
                            <th className="hidden px-3 py-3 text-left whitespace-nowrap xl:table-cell">Received</th>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Status</th>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Action</th>
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
                        ) : pageItems.length > 0 ? (
                            pageItems.map((lead) => (
                                <tr key={lead.id} className="border-t align-middle hover:bg-gray-50">
                                    {/* Name / Email */}
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                                                {(lead.name || "?").trim().charAt(0)}
                                            </span>
                                            <div className="min-w-0 leading-tight">
                                                <p className="mb-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium text-[#1A1F36]">
                                                    <span className="whitespace-nowrap">{lead.name || "-"}</span>
                                                    {lead.is_guest && (
                                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#62748E]">Guest</span>
                                                    )}
                                                    {/* Unique view: how many enquiries this number sent */}
                                                    {uniqueOnly && (enquiryCounts[phoneKey(lead)] || 1) > 1 && (
                                                        <span className="whitespace-nowrap rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-[#C2410C]" title="Enquiries from this mobile number">
                                                            ×{enquiryCounts[phoneKey(lead)]} enquiries
                                                        </span>
                                                    )}
                                                </p>
                                                {lead.email && (
                                                    <p className="mb-0 mt-0.5 max-w-[170px] truncate text-xs text-[#62748E] xl:max-w-[220px]" title={lead.email}>
                                                        {lead.email}
                                                    </p>
                                                )}
                                                {/* Phone below the email */}
                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="mt-0.5 block text-xs text-[#62748E] no-underline hover:text-[#E87722]"
                                                >
                                                    {lead.phone || "-"}
                                                </a>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Lead for: type + target on one line, details below */}
                                    <td className="px-3 py-2.5">
                                        <LeadForCell lead={lead} badge={saleBadge(lead)} />
                                        {/* Smaller screens: Received column is hidden, date shows here */}
                                        <p className="mb-0 mt-1 text-xs text-[#94A3B8] xl:hidden">
                                            {formatDay(lead.created_at)}, {formatTime(lead.created_at)}
                                        </p>
                                    </td>

                                    {/* Received */}
                                    <td className="hidden px-3 py-2.5 whitespace-nowrap text-[#62748E] xl:table-cell">
                                        <p className="mb-0">{formatDay(lead.created_at)}</p>
                                        <p className="mb-0 mt-0.5 text-xs text-[#94A3B8]">{formatTime(lead.created_at)}</p>
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 py-2.5 whitespace-nowrap">{statusSelect(lead)}</td>

                                    {/* Action */}
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Tooltip content="View Lead">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewLead(lead)}
                                                    aria-label={`View lead from ${lead.name}`}
                                                    className={actionButtonClass}
                                                >
                                                    <AiOutlineEye size={18} />
                                                </button>
                                            </Tooltip>

                                            {/* {canSell && saleOptions && (
                                                <Tooltip content="Sell Lead">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSellTarget(lead)}
                                                        aria-label={`Sell lead from ${lead.name}`}
                                                        className={actionButtonClass}
                                                    >
                                                        <FiDollarSign size={15} />
                                                    </button>
                                                </Tooltip>
                                            )} */}

                                            {canDelete && !lead.purchased && (
                                                <Tooltip content="Delete Lead">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(lead)}
                                                        aria-label={`Delete lead from ${lead.name}`}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaRegTrashCan size={14} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={colCount} className="text-center py-6 text-gray-500">
                                    {leads.length === 0 ? "No leads found" : "No leads match your filters"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* PAGINATION */}
                {!loading && filtered.length > 0 && (
                    <div className="p-3 border-t">
                        <Pagination
                            tableProps={tableProps}
                            sizePerPageList={[
                                { text: "10", value: 10 },
                                { text: "20", value: 20 },
                                { text: "50", value: 50 },
                                { text: "100", value: 100 },
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Sell lead */}
            <SellLeadModal lead={sellTarget} options={saleOptions} onClose={() => setSellTarget(null)} onSold={handleSold} />

            {/* Lead detail */}
            <Tmodal isOpen={Boolean(viewLead)} onClose={() => setViewLead(null)} size="lg" title="Lead Details">
                {viewLead && (
                    <div className="space-y-4 pb-2">
                        {/* Buyer */}
                        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-base font-bold uppercase text-[#E87722]">
                                {(viewLead.name || "?").trim().charAt(0)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="mb-0 font-semibold text-[#1A1F36]">
                                    {viewLead.name}
                                    {viewLead.is_guest && <span className="ml-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#62748E]">Guest</span>}
                                </p>
                                <p className="mb-0 mt-0.5 text-sm text-[#62748E]">{[viewLead.phone, viewLead.email].filter(Boolean).join(" · ")}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <a href={`tel:${viewLead.phone}`} className="flex items-center gap-1.5 rounded-lg bg-[#E87722] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d96818]">
                                        <FiPhone size={12} /> Call
                                    </a>
                                    <a href={whatsappLink(viewLead.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50">
                                        <FaWhatsapp size={13} /> WhatsApp
                                    </a>
                                    {viewLead.email && (
                                        <a href={`mailto:${viewLead.email}`} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1A1F36] hover:bg-white">
                                            <FiMail size={12} /> Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">Lead For</p>
                                <LeadTarget lead={viewLead} full />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">Received</p>
                                <p className="mb-0 text-sm text-[#1A1F36]">{formatDay(viewLead.created_at)}, {formatTime(viewLead.created_at)}</p>
                                <p className="mb-1 mt-3 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">Status</p>
                                {statusSelect(viewLead)}
                            </div>
                        </div>

                        <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">Message</p>
                            <p className="mb-0 whitespace-pre-line rounded-lg border border-gray-100 p-3 text-sm text-[#1A1F36]">
                                {viewLead.message || <span className="text-[#94A3B8]">No message</span>}
                            </p>
                        </div>

                        {/* Sales (admin) */}
                        {viewLead.sales?.buyers?.length > 0 && (
                            <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">Sold To</p>
                                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                                    {viewLead.sales.buyers.map((item) => (
                                        <li key={item.sale_id} className="flex items-center justify-between px-3 py-2 text-sm">
                                            <span className="text-[#1A1F36]">{item.name}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="font-semibold tabular-nums text-[#1A1F36]">{formatINR(item.amount)}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${item.status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                                    {item.status}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {canSell && saleOptions && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSellTarget(viewLead);
                                    setViewLead(null);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E87722] py-2.5 text-sm font-semibold text-white hover:bg-[#d96818]"
                            >
                                <FiDollarSign size={15} /> Sell this lead
                            </button>
                        )}
                    </div>
                )}
            </Tmodal>

            {/* Delete */}
            <Tmodal
                isOpen={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                title="Delete Lead"
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
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                            {deleting && <Spinner size="sm" color="white" />}
                            Delete
                        </button>
                    </div>
                }
            >
                <p className="text-gray-600">
                    Delete the lead from <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>? This cannot be undone.
                </p>
            </Tmodal>
        </div>
    );
}
