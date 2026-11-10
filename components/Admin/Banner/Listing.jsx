"use client";

import React, { useEffect, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Tooltip } from "@heroui/react";
import { deleteBanner, getAdminBanners, saveBanner } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";

// Banner type = website page where it shows
const BANNER_TYPES = [
    { value: "home", label: "Home Page", badge: "bg-blue-50 text-blue-700" },
    { value: "events", label: "Events Page", badge: "bg-purple-50 text-purple-700" },
    { value: "plans", label: "Plans Page", badge: "bg-orange-50 text-[#E87722]" },
];

const typeOf = (value) => BANNER_TYPES.find((type) => type.value === value) || BANNER_TYPES[0];

const initialForm = {
    type: "home",
    title: "",
    link: "",
    sort_order: "0",
    is_active: true,
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

export default function Listing() {
    const can = useAdminPermission();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");

    const visibleBanners = typeFilter
        ? banners.filter((banner) => (banner.type || "home") === typeFilter)
        : banners;

    // Add / Edit Modal
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch Banners
    const fetchBanners = async () => {
        setLoading(true);

        try {
            const res = await getAdminBanners();

            setBanners(
                res?.status && Array.isArray(res?.data?.banners)
                    ? res.data.banners
                    : []
            );
        } catch (error) {
            console.error("Failed to fetch banners:", error);
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // Open Add Modal
    const openAddModal = () => {
        setEditingBanner(null);
        // New banner gets the type being viewed
        setForm({ ...initialForm, type: typeFilter || "home" });
        setImageFile(null);
        setImagePreview("");
        setFormError("");
        setFormModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setForm({
            type: banner.type || "home",
            title: banner.title || "",
            link: banner.link || "",
            sort_order: String(banner.sort_order ?? 0),
            is_active: !!banner.is_active,
        });
        setImageFile(null);
        setImagePreview(banner.image || "");
        setFormError("");
        setFormModalOpen(true);
    };

    const closeFormModal = () => {
        if (saving) return;
        setFormModalOpen(false);
        setEditingBanner(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : editingBanner?.image || "");
    };

    // Save (Add / Update)
    const handleSave = async () => {
        if (!editingBanner && !imageFile) {
            setFormError("Banner image is required.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const formData = new FormData();
            formData.append("type", form.type || "home");
            formData.append("title", form.title);
            formData.append("link", form.link);
            formData.append("sort_order", form.sort_order || "0");
            formData.append("is_active", form.is_active ? "1" : "0");

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const res = await saveBanner(formData, editingBanner?.id);

            showToast(
                res?.message ||
                    (editingBanner ? "Banner updated successfully." : "Banner added successfully.")
            );

            setFormModalOpen(false);
            setEditingBanner(null);
            fetchBanners();
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving the banner.");
            showToast(error?.message || "Something went wrong while saving the banner.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Toggle Active / Inactive
    const handleToggleActive = async (banner) => {
        try {
            const formData = new FormData();
            formData.append("is_active", banner.is_active ? "0" : "1");

            const res = await saveBanner(formData, banner.id);

            setBanners((previous) =>
                previous.map((item) =>
                    item.id === banner.id ? res.data.banner : item
                )
            );

            showToast(res?.message || "Banner status updated successfully.");
        } catch (error) {
            showToast(error?.message || "Failed to update banner status.", "error");
        }
    };

    // Delete
    const handleDeleteClick = (banner) => {
        setSelectedBanner(banner);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedBanner?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteBanner(selectedBanner.id);

            setBanners((previous) =>
                previous.filter((banner) => banner.id !== selectedBanner.id)
            );

            setDeleteModalOpen(false);
            setSelectedBanner(null);
            showToast(res?.message || "Banner deleted successfully.");
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting the banner.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Banner", active: true },
                ]}
                title="Banner Management"
            />

            <div className="flex flex-wrap justify-between items-center gap-3 mt-6 mb-4">
                {/* Filter by type (page) */}
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Banner type">
                    {[{ value: "", label: "All" }, ...BANNER_TYPES].map((type) => {
                        const count = type.value
                            ? banners.filter((banner) => (banner.type || "home") === type.value).length
                            : banners.length;
                        const active = typeFilter === type.value;

                        return (
                            <button
                                key={type.value || "all"}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTypeFilter(type.value)}
                                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${active
                                    ? "border-[#E87722] bg-[#E87722] text-white"
                                    : "border-gray-200 bg-white text-[#283A86] hover:border-[#E87722]"
                                    }`}
                            >
                                {type.label}
                                <span className={`rounded-full px-1.5 text-[11px] font-semibold ${active ? "bg-white/25 text-white" : "bg-gray-100 text-[#62748E]"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {can('banners.create') && (
                <button
                    type="button"
                    onClick={openAddModal}
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                >
                    <FiPlus size={16} />
                    <span className="hidden sm:inline">Add Banner</span>
                </button>
                )}
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Banner</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Type</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Title</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Order</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="flex justify-center items-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : visibleBanners.length > 0 ? (
                            visibleBanners.map((banner) => (
                                <tr key={banner.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <img
                                            src={banner.image}
                                            alt={banner.title || "Banner"}
                                            className="h-14 w-32 rounded-md object-cover border"
                                        />
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeOf(banner.type).badge}`}>
                                            {typeOf(banner.type).label}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {banner.title || "-"}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {banner.sort_order}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Tooltip content={banner.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(banner)}
                                                disabled={!can('banners.edit')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold
                                                ${banner.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {banner.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </Tooltip>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {can('banners.edit') && (
                                            <Tooltip content="Update Banner">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(banner)}
                                                    className={actionButtonClass}
                                                >
                                                    <FaPen size={13} />
                                                </button>
                                            </Tooltip>
                                            )}

                                            {can('banners.delete') && (
                                            <Tooltip content="Delete Banner">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(banner)}
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
                                <td colSpan="6" className="text-center py-6 text-gray-500">
                                    {typeFilter ? `No ${typeOf(typeFilter).label} banner yet.` : "No banners found."} Click "Add Banner" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={formModalOpen}
                onClose={closeFormModal}
                title={editingBanner ? "Update Banner" : "Add Banner"}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeFormModal}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
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
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <div>
                        <label htmlFor="type" className={labelClass}>
                            Banner Type (Page)<span className="ml-1 text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            {BANNER_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-[#62748E]">
                            Banner shows on this website page. Home page shows a slider, Events / Plans pages show the first active banner.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="banner_image" className={labelClass}>
                            Banner Image
                            {!editingBanner && <span className="ml-1 text-red-500">*</span>}
                        </label>

                        <input
                            id="banner_image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageChange}
                            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]"
                        />

                        <p className="mt-1 text-xs text-[#62748E]">
                            JPG or WEBP recommended, max 5 MB. Best size 1920 × 818 px, under 400 KB for fast loading.
                        </p>

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Banner preview"
                                className="mt-3 w-full max-h-40 rounded-lg border object-cover"
                            />
                        )}
                    </div>

                    <div>
                        <label htmlFor="title" className={labelClass}>Title</label>
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Diwali Offer"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="link" className={labelClass}>Link (on click)</label>
                        <input
                            id="link"
                            name="link"
                            value={form.link}
                            onChange={handleChange}
                            placeholder="/web/searchProperties or https://..."
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="sort_order" className={labelClass}>Display Order</label>
                        <input
                            id="sort_order"
                            name="sort_order"
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-[#62748E]">Lower number shows first.</p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    is_active: event.target.checked,
                                }))
                            }
                            className="h-4 w-4 accent-[#E87722]"
                        />
                        Show on website (Active)
                    </label>
                </div>
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteModalOpen(false);
                        setSelectedBanner(null);
                    }
                }}
                title="Delete Banner"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedBanner(null);
                            }}
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
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">
                        {selectedBanner?.title || "this banner"}
                    </span>
                    ? The image will also be removed.
                </p>
            </Tmodal>
        </div>
    );
}
