"use client";

import React, { useEffect, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus, FiX } from "react-icons/fi";
import { actionButtonClass } from "../actionButtonClass";
import PropertyVideoField, { appendVideo, emptyVideo, videoFromProperty } from "../PropertyManagement/PropertyVideoField";
import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import { showToast } from "../../../store/toast";
import {
    deleteYoutuberVideo,
    getAdminYoutuberVideos,
    saveYoutuberVideo,
} from "../../../utils/adminFetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";

const MAX_THUMBNAIL_MB = 2;

const initialForm = {
    youtuber_name: "",
    title: "",
    sort_order: "0",
    is_active: true,
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const fileInputClass =
    "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]";

const labelClass = "block text-sm font-medium text-[#283A86]";

const hasVideo = (video) =>
    Boolean(video.file) ||
    (video.mode === "link" ? Boolean(video.url.trim()) : Boolean(video.savedFile || video.savedUrl) && !video.removed);

export default function Listing() {
    const can = useAdminPermission();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add / Edit Modal
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [video, setVideo] = useState(emptyVideo);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete Modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAdminYoutuberVideos();
                setVideos(res.data.videos);
            } catch (error) {
                showToast(error?.message || "Failed to load videos.", "error");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const openForm = (item = null) => {
        setEditing(item);
        setForm(
            item
                ? {
                      youtuber_name: item.youtuber_name || "",
                      title: item.title || "",
                      sort_order: String(item.sort_order ?? 0),
                      is_active: !!item.is_active,
                  }
                : initialForm
        );
        setVideo(item ? videoFromProperty(item) : emptyVideo());
        setThumbnailFile(null);
        setThumbnailPreview(item?.thumbnail || "");
        setRemoveThumbnail(false);
        setFormError("");
        setFormOpen(true);
    };

    const closeForm = () => {
        if (saving) return;
        setFormOpen(false);
        setEditing(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleThumbnailChange = (event) => {
        const file = event.target.files?.[0] || null;

        if (file && file.size > MAX_THUMBNAIL_MB * 1024 * 1024) {
            event.target.value = "";
            showToast(`Thumbnail must be ${MAX_THUMBNAIL_MB} MB or smaller.`, "error");
            return;
        }

        setThumbnailFile(file);
        setThumbnailPreview(file ? URL.createObjectURL(file) : removeThumbnail ? "" : editing?.thumbnail || "");
    };

    const clearThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview("");
        setRemoveThumbnail(Boolean(editing?.thumbnail));

        const input = document.getElementById("video_thumbnail");
        if (input) input.value = "";
    };

    const handleSave = async () => {
        if (!form.youtuber_name.trim()) {
            setFormError("YouTuber name is required.");
            return;
        }

        if (!hasVideo(video)) {
            setFormError("Add a video file or a video link.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const formData = new FormData();

            formData.append("youtuber_name", form.youtuber_name.trim());
            formData.append("title", form.title.trim());
            formData.append("sort_order", form.sort_order || "0");
            formData.append("is_active", form.is_active ? "1" : "0");
            appendVideo(formData, video);

            if (thumbnailFile) {
                formData.append("thumbnail", thumbnailFile);
            } else if (removeThumbnail) {
                formData.append("remove_thumbnail", "1");
            }

            const res = await saveYoutuberVideo(formData, editing?.id);
            const saved = res.data.video;

            setVideos((previous) =>
                [...previous.filter((item) => item.id !== saved.id), saved].sort(
                    (a, b) => a.sort_order - b.sort_order || b.id - a.id
                )
            );

            showToast(res.message);
            setFormOpen(false);
            setEditing(null);
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving the video.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            const formData = new FormData();
            formData.append("is_active", item.is_active ? "0" : "1");

            const res = await saveYoutuberVideo(formData, item.id);

            setVideos((previous) => previous.map((row) => (row.id === item.id ? res.data.video : row)));
            showToast(res.message);
        } catch (error) {
            showToast(error?.message || "Failed to update video status.", "error");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await deleteYoutuberVideo(deleteTarget.id);

            setVideos((previous) => previous.filter((item) => item.id !== deleteTarget.id));
            setDeleteTarget(null);
            showToast(res.message);
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting the video.", "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "YouTuber Videos", active: true },
                ]}
                title="YouTuber Videos"
            />

            <div className="mb-4 mt-6 flex items-center justify-end">
                {can("youtuber_videos.create") && (
                    <button
                        type="button"
                        onClick={() => openForm()}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                    >
                        <FiPlus size={16} />
                        <span>Add Video</span>
                    </button>
                )}
            </div>

            <div className="w-full overflow-auto rounded-xl bg-white shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="whitespace-nowrap px-4 py-3 text-left">YouTuber</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Title</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Video</th>
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
                        ) : videos.length > 0 ? (
                            videos.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#1A1F36]">{item.youtuber_name}</td>
                                    <td className="max-w-[280px] truncate px-4 py-3">{item.title || "-"}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <a
                                            href={item.video_file || item.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-[#E87722] no-underline hover:no-underline"
                                        >
                                            {item.video_file ? "Uploaded file" : "Link"}
                                        </a>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{item.sort_order}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <Tooltip content={item.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(item)}
                                                disabled={!can("youtuber_videos.edit")}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {item.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </Tooltip>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {can("youtuber_videos.edit") && (
                                                <Tooltip content="Update Video">
                                                    <button
                                                        type="button"
                                                        aria-label={`Update video of ${item.youtuber_name}`}
                                                        onClick={() => openForm(item)}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>
                                            )}

                                            {can("youtuber_videos.delete") && (
                                                <Tooltip content="Delete Video">
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete video of ${item.youtuber_name}`}
                                                        onClick={() => setDeleteTarget(item)}
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
                                <td colSpan="6" className="py-6 text-center text-gray-500">
                                    No videos yet. The home page section stays hidden until one is added.
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
                title={editing ? "Update Video" : "Add Video"}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                        >
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

                    <div>
                        <label htmlFor="youtuber_name" className={labelClass}>
                            YouTuber Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="youtuber_name"
                            name="youtuber_name"
                            maxLength={255}
                            value={form.youtuber_name}
                            onChange={handleChange}
                            placeholder="Channel or creator name"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="video_title" className={labelClass}>Video Title</label>
                        <input
                            id="video_title"
                            name="title"
                            maxLength={255}
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Property tour in Noida"
                            className={inputClass}
                        />
                    </div>

                    <PropertyVideoField
                        value={video}
                        onChange={setVideo}
                        labelClass={labelClass}
                        inputClass={inputClass}
                        fileInputClass={fileInputClass}
                        description="Required. Upload a file or paste a YouTube link, not both. For a video over 30 MB, use the link."
                    />

                    <div>
                        <label htmlFor="video_thumbnail" className={labelClass}>Thumbnail</label>
                        <input
                            id="video_thumbnail"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleThumbnailChange}
                            className={fileInputClass}
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">
                            Optional. JPG, PNG or WEBP, max {MAX_THUMBNAIL_MB} MB. Empty: YouTube's picture, or the video's first frame.
                        </p>

                        {thumbnailPreview && (
                            <div className="relative mt-3 w-full max-w-xs">
                                <img src={thumbnailPreview} alt="Thumbnail preview" className="aspect-video w-full rounded-lg border object-cover" />
                                <button
                                    type="button"
                                    aria-label="Remove thumbnail"
                                    onClick={clearThumbnail}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                                >
                                    <FiX size={15} aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="video_sort_order" className={labelClass}>Display Order</label>
                        <input
                            id="video_sort_order"
                            name="sort_order"
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">Lower number shows first.</p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                                setForm((previous) => ({ ...previous, is_active: event.target.checked }))
                            }
                            className="h-4 w-4 accent-[#E87722]"
                        />
                        Show on website (Active)
                    </label>
                </div>
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={Boolean(deleteTarget)}
                onClose={() => {
                    if (!deleting) setDeleteTarget(null);
                }}
                title="Delete Video"
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
                    Are you sure you want to delete the video of{" "}
                    <span className="font-semibold text-gray-900">{deleteTarget?.youtuber_name}</span>?
                    An uploaded video file and thumbnail will also be removed.
                </p>
            </Tmodal>
        </div>
    );
}
