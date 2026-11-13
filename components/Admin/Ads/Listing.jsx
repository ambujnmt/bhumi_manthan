"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiImage, FiLink, FiPlus, FiVideo, FiX } from "react-icons/fi";
import { actionButtonClass } from "../actionButtonClass";
import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import AdMedia from "../../Common/Ads/AdMedia";
import { showToast } from "../../../store/toast";
import { deleteAd, getAdminAds, saveAd } from "../../../utils/adminFetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 30;

const MEDIA_TYPES = [
    { value: "image", label: "Image", icon: FiImage },
    { value: "video", label: "Video", icon: FiVideo },
    { value: "video_url", label: "Video Link", icon: FiLink },
];

const MEDIA_LABELS = { image: "Image", video: "Video", video_url: "Video Link" };

const emptyForm = (placements = []) => ({
    placements,
    media_type: "image",
    video_url: "",
    link_url: "",
    sort_order: "0",
    is_active: true,
});

// Same rule as backend: full http(s) URL or a page of this website ("/web/plans")
const isValidClickLink = (value) => /^(https?:\/\/\S+|\/(?!\/)\S*)$/i.test(value);

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const fileInputClass =
    "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]";

const labelClass = "block text-sm font-medium text-[#283A86]";

const sortAds = (list) =>
    [...list].sort((a, b) => a.sort_order - b.sort_order || b.id - a.id);

/**
 * Admin: website ads. Placement = where on the website it shows (list comes from the API,
 * backend App\Models\Ad::PLACEMENTS). Each ad: image OR video file OR video link.
 * Admin ticks every page (placement) the ad shows on. Each placement shows its first active ad (lowest display order).
 */
export default function Listing() {
    const can = useAdminPermission();
    const [ads, setAds] = useState([]);
    const [placements, setPlacements] = useState([]); // [{ key, label, group }]
    const [loading, setLoading] = useState(true);

    // Placement filter: "all" | placement key
    const [filter, setFilter] = useState("all");

    // Add / Edit modal
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [file, setFile] = useState(null); // new image / video file
    const [filePreview, setFilePreview] = useState("");
    // Optional image for phones / tablets (shown there instead of the main media)
    const [mobileFile, setMobileFile] = useState(null);
    const [mobilePreview, setMobilePreview] = useState("");
    const [removeMobile, setRemoveMobile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete / Preview modals
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [previewAd, setPreviewAd] = useState(null);

    useEffect(() => {
        getAdminAds()
            .then((res) => {
                setAds(res?.data?.ads || []);
                setPlacements(res?.data?.placements || []);
            })
            .catch((error) => showToast(error?.message || "Failed to load ads.", "error"))
            .finally(() => setLoading(false));
    }, []);

    // Free the old blob preview
    useEffect(() => () => filePreview.startsWith("blob:") && URL.revokeObjectURL(filePreview), [filePreview]);

    const placementLabel = (key) => placements.find((item) => item.key === key)?.label || key;

    // One row per page: [{ page, label, left: placement, right: placement }]
    const pageRows = placements.reduce((rows, item) => {
        let row = rows.find((entry) => entry.page === item.page);
        if (!row) {
            row = { page: item.page, label: item.page_label || item.label, left: null, right: null };
            rows.push(row);
        }
        row[item.side] = item;
        return rows;
    }, []);

    const placementsOf = (ad) => (Array.isArray(ad.placements) ? ad.placements : []);

    // placement key -> id of the ad live there (first active ad of that placement)
    const liveAt = Object.fromEntries(
        placements
            .map(({ key }) => [key, sortAds(ads.filter((ad) => ad.is_active && placementsOf(ad).includes(key)))[0]?.id])
            .filter(([, id]) => id)
    );

    const visibleAds = filter === "all" ? ads : ads.filter((ad) => placementsOf(ad).includes(filter));

    const openForm = (ad = null) => {
        setEditing(ad);
        setForm(
            ad
                ? {
                      placements: placementsOf(ad),
                      media_type: ad.media_type,
                      video_url: ad.video_url || "",
                      link_url: ad.link_url || "",
                      sort_order: String(ad.sort_order ?? 0),
                      is_active: !!ad.is_active,
                  }
                : emptyForm(filter !== "all" ? [filter] : [])
        );
        setFile(null);
        setFilePreview("");
        setMobileFile(null);
        setMobilePreview(ad?.mobile_image || "");
        setRemoveMobile(false);
        setFormError("");
        setFormOpen(true);
    };

    const handleMobileChange = (event) => {
        const selected = event.target.files?.[0] || null;

        if (selected && selected.size > MAX_IMAGE_MB * 1024 * 1024) {
            event.target.value = "";
            setFormError(`Mobile image must be ${MAX_IMAGE_MB} MB or smaller.`);
            return;
        }

        setFormError("");
        setMobileFile(selected);
        setMobilePreview(selected ? URL.createObjectURL(selected) : removeMobile ? "" : editing?.mobile_image || "");
    };

    const clearMobile = () => {
        setMobileFile(null);
        setMobilePreview("");
        setRemoveMobile(Boolean(editing?.mobile_image));

        const input = document.getElementById("ad_mobile_image");
        if (input) input.value = "";
    };

    const closeForm = () => {
        if (saving) return;
        setFormOpen(false);
        setEditing(null);
    };

    const setMediaType = (mediaType) => {
        setForm((previous) => ({ ...previous, media_type: mediaType }));
        setFile(null);
        setFilePreview("");
        setFormError("");
    };

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0] || null;
        const isImage = form.media_type === "image";
        const maxMb = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB;

        if (selected && selected.size > maxMb * 1024 * 1024) {
            event.target.value = "";
            setFormError(`${isImage ? "Image" : "Video"} must be ${maxMb} MB or smaller.`);
            return;
        }

        setFormError("");
        setFile(selected);
        setFilePreview(selected ? URL.createObjectURL(selected) : "");
    };

    // Same media type as saved + nothing new chosen -> saved media stays
    const keepsSavedMedia = () =>
        editing &&
        editing.media_type === form.media_type &&
        (form.media_type === "video_url" ? form.video_url.trim() === (editing.video_url || "") : !file);

    const handleSave = async () => {
        const link = form.video_url.trim();
        const clickLink = form.link_url.trim();

        if (form.placements.length === 0) {
            setFormError("Tick at least one page where the ad should show.");
            return;
        }

        if (clickLink && !isValidClickLink(clickLink)) {
            setFormError("Click link must start with http://, https:// or / (a page of this website).");
            return;
        }

        if (!keepsSavedMedia()) {
            if (form.media_type === "video_url" && !link) {
                setFormError("Enter a video link.");
                return;
            }

            if (form.media_type !== "video_url" && !file) {
                setFormError(`Choose ${form.media_type === "image" ? "an image" : "a video"} to upload.`);
                return;
            }
        }

        setSaving(true);
        setFormError("");

        try {
            const formData = new FormData();
            form.placements.forEach((key) => formData.append("placements[]", key));
            formData.append("link_url", clickLink); // empty -> no link (removes a saved one)
            formData.append("sort_order", form.sort_order || "0");
            formData.append("is_active", form.is_active ? "1" : "0");

            if (!keepsSavedMedia()) {
                if (form.media_type === "video_url") formData.append("video_url", link);
                else formData.append(form.media_type, file);
            }

            if (mobileFile) formData.append("mobile_image", mobileFile);
            else if (removeMobile) formData.append("remove_mobile_image", "1");

            const res = await saveAd(formData, editing?.id);
            const saved = res.data.ad;

            setAds((previous) => sortAds([...previous.filter((ad) => ad.id !== saved.id), saved]));
            showToast(res.message);
            setFormOpen(false);
            setEditing(null);
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving the ad.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (ad) => {
        try {
            const formData = new FormData();
            formData.append("is_active", ad.is_active ? "0" : "1");

            const res = await saveAd(formData, ad.id);
            setAds((previous) => previous.map((row) => (row.id === ad.id ? res.data.ad : row)));
            showToast(res.message);
        } catch (error) {
            showToast(error?.message || "Failed to update ad status.", "error");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await deleteAd(deleteTarget.id);
            setAds((previous) => previous.filter((ad) => ad.id !== deleteTarget.id));
            setDeleteTarget(null);
            showToast(res.message);
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting the ad.", "error");
        } finally {
            setDeleting(false);
        }
    };

    // Preview inside the form: new file / typed link, else saved media
    const formPreview = (() => {
        if (form.media_type === "image") return file ? { image: filePreview } : editing?.media_type === "image" ? editing : null;
        if (form.media_type === "video") return file ? { video_file: filePreview } : editing?.media_type === "video" ? editing : null;
        return form.video_url.trim() ? { video_url: form.video_url.trim() } : null;
    })();

    // Tick / untick one page, or a whole group
    const togglePlacement = (key) =>
        setForm((previous) => ({
            ...previous,
            placements: previous.placements.includes(key)
                ? previous.placements.filter((item) => item !== key)
                : [...previous.placements, key],
        }));

    const toggleGroup = (items, checked) =>
        setForm((previous) => {
            const keys = items.map((item) => item.key);
            const rest = previous.placements.filter((key) => !keys.includes(key));
            return { ...previous, placements: checked ? [...rest, ...keys] : rest };
        });

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Ads", active: true },
                ]}
                title="Ads"
            />

            <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                {/* Page filter */}
                <div className="flex items-center gap-2">
                    <label htmlFor="ad_filter" className="text-sm font-semibold text-[#283A86]">Page</label>
                    <select
                        id="ad_filter"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none focus:border-[#E87722]"
                    >
                        <option value="all">All ads ({ads.length})</option>
                        {pageRows.map((row) => (
                            <optgroup key={row.page} label={row.label}>
                                {[row.left, row.right].filter(Boolean).map((item) => (
                                    <option key={item.key} value={item.key}>
                                        {item.label} ({ads.filter((ad) => placementsOf(ad).includes(item.key)).length})
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {can("ads.create") && (
                    <button
                        type="button"
                        onClick={() => openForm()}
                        disabled={loading || placements.length === 0}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:opacity-60"
                    >
                        <FiPlus size={16} />
                        <span>Add Ad</span>
                    </button>
                )}
            </div>

            <p className="mb-3 text-xs text-[#62748E]">
                Tick the pages an ad should show on. Each page shows its first active ad (lowest display order). Orange = showing there now. No active ad: that spot shows its default content (or nothing).
            </p>

            <div className="w-full overflow-auto rounded-xl bg-white shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Ad</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Shows On</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Type</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Order</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Status</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="flex items-center justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : visibleAds.length > 0 ? (
                            visibleAds.map((ad) => (
                                <tr key={ad.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewAd(ad)}
                                            aria-label="Preview ad"
                                            className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-md border bg-gray-50"
                                        >
                                            {ad.image ? (
                                                <img src={ad.image} alt="" className="h-full w-full object-cover" />
                                            ) : ad.video_file ? (
                                                <video src={`${ad.video_file}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                                            ) : (
                                                <FiLink size={20} className="text-[#E87722]" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex max-w-[420px] flex-wrap gap-1">
                                            {placementsOf(ad).map((key, index) => {
                                                const live = liveAt[key] === ad.id;

                                                return (
                                                    <span
                                                        key={key}
                                                        title={live ? "Showing here now" : ad.is_active ? "Another ad with lower order shows here" : "Inactive"}
                                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                            live ? "bg-orange-100 text-[#c25e12]" : "bg-gray-100 text-[#62748E]"
                                                        }`}
                                                    >
                                                        {ad.placement_labels?.[index] || placementLabel(key)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {ad.link_url && (
                                            <span className="mt-1 flex max-w-[260px] items-center gap-1 truncate text-xs text-[#62748E]" title={ad.link_url}>
                                                <FiLink size={11} className="shrink-0" />
                                                <span className="truncate">{ad.link_url}</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {MEDIA_LABELS[ad.media_type]}
                                        {ad.mobile_image && (
                                            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700" title="Has a separate image for phones">
                                                + Mobile
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{ad.sort_order}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <Tooltip content={ad.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(ad)}
                                                disabled={!can("ads.edit")}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    ad.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {ad.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </Tooltip>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {can("ads.edit") && (
                                                <Tooltip content="Update Ad">
                                                    <button type="button" aria-label={`Update ad ${ad.id}`} onClick={() => openForm(ad)} className={actionButtonClass}>
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                            {can("ads.delete") && (
                                                <Tooltip content="Delete Ad">
                                                    <button type="button" aria-label={`Delete ad ${ad.id}`} onClick={() => setDeleteTarget(ad)} className={actionButtonClass}>
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
                                <td colSpan="6" className="py-6 text-center text-gray-500">
                                    {filter === "all" ? "No ads yet." : `No ads on ${placementLabel(filter)} yet.`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={formOpen}
                onClose={closeForm}
                size="2xl"
                title={editing ? "Update Ad" : "Add Ad"}
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-[rgb(232,119,34)] px-4 py-2 text-white"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {formError && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    {/* Pages (checkboxes) */}
                    <fieldset>
                        <legend className={labelClass}>
                            Show On <span className="text-red-500">*</span>
                            <span className="ml-2 text-xs font-normal text-[#62748E]">{form.placements.length} selected</span>
                        </legend>

                        {(() => {
                            const leftItems = pageRows.map((row) => row.left).filter(Boolean);
                            const rightItems = pageRows.map((row) => row.right).filter(Boolean);
                            const allItems = [...leftItems, ...rightItems];
                            const allTicked = (items) => items.length > 0 && items.every((item) => form.placements.includes(item.key));
                            const quick = [
                                { label: "All pages - Left", items: leftItems },
                                { label: "All pages - Right", items: rightItems },
                                { label: "All pages - Both sides", items: allItems },
                            ];

                            return (
                                <div className="mt-1.5 rounded-lg border border-gray-200">
                                    {/* Quick select */}
                                    <div className="flex flex-wrap gap-2 border-b border-gray-200 p-2.5">
                                        {quick.map(({ label, items }) => {
                                            const on = allTicked(items);

                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleGroup(items, !on)}
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                        on ? "border-[#E87722] bg-[#E87722] text-white" : "border-gray-300 text-[#283A86] hover:border-[#E87722]"
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Page x side */}
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase tracking-wide text-[#62748E]">
                                                <th className="px-3 py-2 font-semibold">Page</th>
                                                <th className="w-20 px-3 py-2 text-center font-semibold">Left</th>
                                                <th className="w-20 px-3 py-2 text-center font-semibold">Right</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageRows.map((row) => (
                                                <tr key={row.page} className="border-t border-gray-100">
                                                    <td className="px-3 py-1.5 text-[#1A1F36]">{row.label}</td>
                                                    {["left", "right"].map((side) => (
                                                        <td key={side} className="px-3 py-1.5 text-center">
                                                            {row[side] && (
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={row[side].label}
                                                                    checked={form.placements.includes(row[side].key)}
                                                                    onChange={() => togglePlacement(row[side].key)}
                                                                    className="h-4 w-4 cursor-pointer accent-[#E87722]"
                                                                />
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">
                            The ad shows beside the page content on the ticked side, like home Featured Properties. Hidden on phones and tablets.
                        </p>
                    </fieldset>

                    {/* Media type */}
                    <div>
                        <span className={labelClass}>
                            Ad Media <span className="text-red-500">*</span>
                        </span>
                        <div role="radiogroup" aria-label="Ad media" className="mt-1.5 inline-flex max-w-full flex-wrap rounded-lg border border-gray-200 bg-white p-1">
                            {MEDIA_TYPES.map(({ value, label, icon: Icon }) => {
                                const active = form.media_type === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setMediaType(value)}
                                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                                            active ? "bg-[#001737] text-white" : "text-[#283A86] hover:text-[#E87722]"
                                        }`}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {form.media_type === "video_url" ? (
                        <div>
                            <label htmlFor="ad_video_url" className={labelClass}>Video Link</label>
                            <input
                                id="ad_video_url"
                                type="url"
                                maxLength={1000}
                                value={form.video_url}
                                onChange={(event) => setForm((previous) => ({ ...previous, video_url: event.target.value }))}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className={inputClass}
                            />
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">YouTube (also Shorts) or Vimeo link. Plays silently on loop.</p>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="ad_file" className={labelClass}>{form.media_type === "image" ? "Image" : "Video"}</label>
                            <input
                                key={form.media_type}
                                id="ad_file"
                                type="file"
                                accept={form.media_type === "image" ? "image/png,image/jpeg,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"}
                                onChange={handleFileChange}
                                className={fileInputClass}
                            />
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">
                                {form.media_type === "image"
                                    ? `JPG, PNG, WEBP or GIF, max ${MAX_IMAGE_MB} MB.`
                                    : `MP4, WEBM or MOV, max ${MAX_VIDEO_MB} MB. Plays silently on loop. Bigger video: use a video link.`}
                                {editing && editing.media_type === form.media_type && " Leave empty to keep the current one."}
                            </p>
                        </div>
                    )}

                    {formPreview && (
                        <div className="relative w-[180px]">
                            <AdMedia ad={formPreview} />
                            {file && (
                                <button
                                    type="button"
                                    aria-label="Remove selected file"
                                    onClick={() => {
                                        setFile(null);
                                        setFilePreview("");
                                        const input = document.getElementById("ad_file");
                                        if (input) input.value = "";
                                    }}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                                >
                                    <FiX size={15} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Mobile image (optional) */}
                    <div>
                        <label htmlFor="ad_mobile_image" className={labelClass}>Mobile Image</label>
                        <input
                            id="ad_mobile_image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleMobileChange}
                            className={fileInputClass}
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">
                            Optional. Phones / tablets show this image instead of the ad above (a video is heavy on mobile data).
                            JPG, PNG, WEBP or GIF, max {MAX_IMAGE_MB} MB. Wide picture works best (about 800 × 300 px).
                            Empty: side ads stay hidden on phones.
                        </p>

                        {mobilePreview && (
                            <div className="relative mt-3 w-[220px]">
                                <img src={mobilePreview} alt="Mobile image preview" className="w-full rounded-lg border object-cover" />
                                <button
                                    type="button"
                                    aria-label="Remove mobile image"
                                    onClick={clearMobile}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                                >
                                    <FiX size={15} aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ad_link_url" className={labelClass}>Click Link</label>
                        <input
                            id="ad_link_url"
                            type="text"
                            inputMode="url"
                            maxLength={1000}
                            value={form.link_url}
                            onChange={(event) => setForm((previous) => ({ ...previous, link_url: event.target.value }))}
                            placeholder="https://partner-site.com/offer or /web/plans"
                            className={inputClass}
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">
                            Optional. Clicking the ad opens this. Other website (https://...) opens in a new tab, a page of this website (/web/...) in the same tab.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="ad_sort_order" className={labelClass}>Display Order</label>
                        <input
                            id="ad_sort_order"
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={(event) => setForm((previous) => ({ ...previous, sort_order: event.target.value }))}
                            className={inputClass}
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">Lower number shows first. Each page shows only its first active ad.</p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                            className="h-4 w-4 accent-[#E87722]"
                        />
                        Show on website (Active)
                    </label>
                </div>
            </Tmodal>

            {/* Preview Modal */}
            <Tmodal isOpen={Boolean(previewAd)} onClose={() => setPreviewAd(null)} title="Ad Preview">
                {previewAd && (
                    <div className="mx-auto mb-3 w-[240px]">
                        {/* No click-through in admin preview, link shown below */}
                        <AdMedia ad={{ ...previewAd, link_url: null }} />
                        <p className="mb-0 mt-2 break-all text-center text-xs text-[#62748E]">
                            {previewAd.link_url ? (
                                <>
                                    On click opens:{" "}
                                    <a href={previewAd.link_url} target="_blank" rel="noopener noreferrer" className="text-[#E87722]">
                                        {previewAd.link_url}
                                    </a>
                                </>
                            ) : (
                                "No click link"
                            )}
                        </p>
                    </div>
                )}
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                title="Delete Ad"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
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
                    Are you sure you want to delete this ad? It will be removed from{" "}
                    <span className="font-semibold text-gray-900">
                        {deleteTarget && placementsOf(deleteTarget).map((key) => placementLabel(key)).join(", ")}
                    </span>.
                    An uploaded image or video will also be removed.
                </p>
            </Tmodal>
        </div>
    );
}
