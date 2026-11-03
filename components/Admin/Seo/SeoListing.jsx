"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { AiOutlineEye } from "react-icons/ai";
import { FaPen } from "react-icons/fa";
import PageTitle from "../../Breadcrumb/PageTitle";
import Pagination from "../../Pagination/Pagination";
import Tmodal from "../../Tmodal/Tmodal";
import SeoFields from "../SeoFields";
import { actionButtonClass } from "../actionButtonClass";
import { showToast } from "../../../store/toast";
import { getSeoItems, saveSeoItem } from "../../../utils/adminFetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { buildBlogSeo, buildPropertySeo } from "../../../utils/seo";

const CONTENT_TYPES = {
    properties: { title: "Property SEO", urlPath: "/web/propertyDetail/", buildSeo: buildPropertySeo },
    blogs: { title: "Blog SEO", urlPath: "/web/blog/", buildSeo: buildBlogSeo },
};

const STATUS_FILTERS = [
    ["all", "All"],
    ["missing", "Needs SEO"],
    ["done", "Done"],
];

const sizePerPageList = [
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "50", value: 50 },
];

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const isSeoDone = (item) => Boolean(item.meta_title?.trim() && item.meta_description?.trim());

// type = "properties" / "blogs" (one sidebar page each)
export default function SeoListing({ type }) {
    const can = useAdminPermission();
    const canEdit = can("seo.edit");

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Item being edited + its form values
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const { title, urlPath, buildSeo } = CONTENT_TYPES[type];

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError("");
            setItems([]);

            try {
                const res = await getSeoItems(type);

                if (!cancelled) setItems(res.data.items);
            } catch (loadError) {
                if (!cancelled) setError(loadError?.message || "Failed to load the list.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [type]);

    const filteredItems = useMemo(() => {
        const text = search.trim().toLowerCase();

        return items.filter((item) => {
            if (statusFilter === "done" && !isSeoDone(item)) return false;
            if (statusFilter === "missing" && isSeoDone(item)) return false;

            return !text || `${item.title ?? ""} ${item.slug ?? ""} ${item.meta_title ?? ""}`.toLowerCase().includes(text);
        });
    }, [items, search, statusFilter]);

    const pageCount = Math.ceil(filteredItems.length / pageSize);
    const pageItems = filteredItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

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

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            slug: item.slug ?? "",
            meta_title: item.meta_title ?? "",
            meta_description: item.meta_description ?? "",
            meta_keywords: item.meta_keywords ?? "",
        });
    };

    const closeEdit = () => {
        setEditing(null);
        setForm(null);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const res = await saveSeoItem(type, editing.id, form);

            setItems((current) => current.map((item) => (item.id === editing.id ? res.data.item : item)));
            showToast(res.message);
            closeEdit();
        } catch (saveError) {
            showToast(saveError?.message || "Failed to save SEO details.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <PageTitle breadCrumbItems={[{ label: title, active: true }]} title={title} />

            <div className="mb-4 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    type="text"
                    aria-label="Search"
                    placeholder="Search by title, URL, meta title..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPageIndex(0);
                    }}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(232,119,34)] sm:w-1/3"
                />

                <select
                    aria-label="Filter by SEO status"
                    value={statusFilter}
                    onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPageIndex(0);
                    }}
                    className="rounded-lg border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(232,119,34)]"
                >
                    {STATUS_FILTERS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="w-full overflow-auto rounded-xl bg-white shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Title</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Meta Title (on Google)</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">SEO</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="flex items-center justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="4" role="alert" className="py-10 text-center text-red-600">{error}</td>
                            </tr>
                        ) : pageItems.length > 0 ? (
                            pageItems.map((item) => {
                                const done = isSeoDone(item);

                                return (
                                    <tr key={item.id} className="border-t hover:bg-gray-50/60">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} className="h-12 w-16 shrink-0 rounded-lg border object-cover" />
                                                ) : (
                                                    <div className="h-12 w-16 shrink-0 rounded-lg border bg-gray-50" />
                                                )}
                                                <div className="min-w-0">
                                                    <div className="line-clamp-1 max-w-[320px] font-semibold text-[#1A1F36]">{item.title}</div>
                                                    <div className="max-w-[320px] truncate text-xs text-gray-500">{urlPath}{item.slug}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="max-w-[320px] px-4 py-3">
                                            <div className="line-clamp-2 text-[#1A1F36]">{buildSeo(item).title}</div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                                            }`}>
                                                {done ? "Done" : "Needs SEO"}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {item.is_active && (
                                                    <Tooltip content="View on Website">
                                                        <a
                                                            href={`${urlPath}${item.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`View ${item.title} on website`}
                                                            className={actionButtonClass}
                                                        >
                                                            <AiOutlineEye size={18} />
                                                        </a>
                                                    </Tooltip>
                                                )}

                                                {canEdit && (
                                                    <Tooltip content="Edit SEO">
                                                        <button
                                                            type="button"
                                                            aria-label={`Edit SEO of ${item.title}`}
                                                            onClick={() => openEdit(item)}
                                                            className={actionButtonClass}
                                                        >
                                                            <FaPen size={13} />
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
                                <td colSpan="4" className="py-10 text-center text-gray-500">Nothing found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {!loading && !error && filteredItems.length > 0 && (
                    <div className="border-t p-4">
                        <Pagination tableProps={tableProps} sizePerPageList={sizePerPageList} />
                    </div>
                )}
            </div>

            <Tmodal
                isOpen={Boolean(editing)}
                onClose={closeEdit}
                size="5xl"
                title={editing ? `Edit SEO: ${editing.title}` : ""}
                footer={
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={closeEdit}
                            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={handleSave}
                            className="rounded-lg bg-[#E87722] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#cf681b] disabled:opacity-70"
                        >
                            {saving ? "Saving..." : "Save SEO"}
                        </button>
                    </div>
                }
            >
                {editing && form && (
                    <SeoFields
                        values={{ ...form, title: editing.title }}
                        onChange={(patch) => setForm((previous) => ({ ...previous, ...patch }))}
                        seo={buildSeo({ ...editing, ...form })}
                        urlPath={urlPath}
                        savedSlug={editing.slug}
                        inputClass={inputClass}
                        labelClass={labelClass}
                    />
                )}
            </Tmodal>
        </div>
    );
}
