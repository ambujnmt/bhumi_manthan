"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import AddedBy from "../AddedBy";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Tooltip } from "@heroui/react";
import { deleteProject, getAdminProjects, saveProject } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import Pagination from "../../Pagination/Pagination";
import { FaPen, FaRegImage } from "react-icons/fa";
import { LuBuilding2, LuEye, LuLayoutGrid, LuMapPin } from "react-icons/lu";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus, FiSearch } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";
import ImageSizeNote, { PROPERTY_IMAGE_SIZES } from "../PropertyManagement/ImageSizeNote";

const initialForm = {
    name: "",
    builder_name: "",
    location: "",
    city: "",
    state: "",
    starting_price: "",
    price_label: "",
    configuration: "",
    description: "",
    link: "",
    launch_status: "New Launch",
    sort_order: "0",
    is_active: true,
};

const launchStatusOptions = ["New Launch", "Pre Launch", "Under Construction", "Ready to Move"];

// Same limit as backend (ProjectController::MAX_IMAGE_KB)
const MAX_IMAGE_KB = 200;

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// ₹2.45 Cr / ₹42.00 Lakh
export const formatPrice = (value) => {
    const price = Number(value);

    if (!price) return "";

    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;

    return `₹${price.toLocaleString("en-IN")}`;
};

export default function Listing() {
    const can = useAdminPermission();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search
    const [search, setSearch] = useState("");

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(48);

    // Add / Edit Modal
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch Projects
    const fetchProjects = async () => {
        setLoading(true);

        try {
            const res = await getAdminProjects();

            setProjects(
                res?.status && Array.isArray(res?.data?.projects)
                    ? res.data.projects
                    : []
            );
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Search Filter
    const filteredProjects = useMemo(() => {
        if (!search) return projects;

        return projects.filter((project) =>
            `${project?.name ?? ""} ${project?.builder_name ?? ""} ${project?.location ?? ""} ${project?.city ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [projects, search]);

    // Pagination Calculation
    const pageCount = Math.ceil(filteredProjects.length / pageSize);

    const currentPageProjects = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredProjects.slice(start, start + pageSize);
    }, [filteredProjects, pageIndex, pageSize]);

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

    const sizePerPageList = [
        { text: "12", value: 12 },
        { text: "24", value: 24 },
        { text: "48", value: 48 },
    ];

    // Open Add Modal
    const openAddModal = () => {
        setEditingProject(null);
        setForm(initialForm);
        setImageFile(null);
        setImagePreview("");
        setFormError("");
        setFormModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (project) => {
        setEditingProject(project);
        setForm({
            name: project.name || "",
            builder_name: project.builder_name || "",
            location: project.location || "",
            city: project.city || "",
            state: project.state || "",
            starting_price: project.starting_price ? String(Number(project.starting_price)) : "",
            price_label: project.price_label || "",
            configuration: project.configuration || "",
            description: project.description || "",
            link: project.link || "",
            launch_status: project.launch_status || "New Launch",
            sort_order: String(project.sort_order ?? 0),
            is_active: !!project.is_active,
        });
        setImageFile(null);
        setImagePreview(project.image || "");
        setFormError("");
        setFormModalOpen(true);
    };

    const closeFormModal = () => {
        if (saving) return;
        setFormModalOpen(false);
        setEditingProject(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null;

        // Max 200 KB: reject before upload
        if (file && file.size > MAX_IMAGE_KB * 1024) {
            event.target.value = "";
            setImageFile(null);
            setImagePreview(editingProject?.image || "");
            setFormError(
                `Image is ${Math.ceil(file.size / 1024)} KB. Please upload an image of max ${MAX_IMAGE_KB} KB.`
            );
            return;
        }

        setFormError("");
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : editingProject?.image || "");
    };

    // Save (Add / Update)
    const handleSave = async () => {
        if (!form.name.trim()) {
            setFormError("Project name is required.");
            return;
        }

        if (!editingProject && !imageFile) {
            setFormError("Project image is required.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (key === "is_active") {
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, value ?? "");
                }
            });

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const res = await saveProject(formData, editingProject?.id);

            showToast(
                res?.message ||
                    (editingProject ? "Project updated successfully." : "Project added successfully.")
            );

            setFormModalOpen(false);
            setEditingProject(null);
            fetchProjects();
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving the project.");
            showToast(error?.message || "Something went wrong while saving the project.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Toggle Active / Inactive
    const handleToggleActive = async (project) => {
        try {
            const formData = new FormData();
            formData.append("is_active", project.is_active ? "0" : "1");

            const res = await saveProject(formData, project.id);

            setProjects((previous) =>
                previous.map((item) =>
                    item.id === project.id ? res.data.project : item
                )
            );

            showToast(res?.message || "Project status updated successfully.");
        } catch (error) {
            showToast(error?.message || "Failed to update project status.", "error");
        }
    };

    // Delete
    const handleDeleteClick = (project) => {
        setSelectedProject(project);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedProject?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteProject(selectedProject.id);

            setProjects((previous) =>
                previous.filter((project) => project.id !== selectedProject.id)
            );

            setDeleteModalOpen(false);
            setSelectedProject(null);
            showToast(res?.message || "Project deleted successfully.");
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting the project.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Projects", active: true },
                ]}
                title="New Launch & Premium Projects"
            />

            {/* Search + Add (same as Property Management) */}
            <div className="mt-4 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <FiSearch
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search by project, builder, location..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageIndex(0);
                        }}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                {can('projects.create') && (
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                    >
                        <FiPlus size={16} />
                        <span className="hidden sm:inline">Add Project</span>
                    </button>
                )}
            </div>

            {/* Count */}
            {!loading && filteredProjects.length > 0 && (
                <p className="mb-2 text-sm text-[#62748E]">
                    Showing {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredProjects.length)} of {filteredProjects.length} projects
                </p>
            )}

            {/* Project cards (same layout as property cards) */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <div key={key} className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            <div className="h-44 bg-gray-200" />
                            <div className="space-y-3 p-4">
                                <div className="h-5 w-1/3 rounded bg-gray-200" />
                                <div className="h-4 w-4/5 rounded bg-gray-200" />
                                <div className="h-3 w-2/3 rounded bg-gray-100" />
                                <div className="h-9 rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : currentPageProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {currentPageProjects.map((project) => {
                        const address = [project.location, project.city, project.state].filter(Boolean).join(", ");
                        const price = project.price_label || (project.starting_price ? `${formatPrice(project.starting_price)} onwards` : "");
                        const isReady = project.launch_status?.toLowerCase().includes("ready");

                        return (
                            <div
                                key={project.id}
                                className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md ${project.is_active ? "" : "opacity-80"}`}
                            >
                                {/* Image + badges */}
                                <div className="relative h-44 w-full shrink-0 bg-gray-100">
                                    {project.image ? (
                                        <img src={project.image} alt={project.name || "Project"} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                            <FaRegImage size={36} />
                                        </div>
                                    )}

                                    {project.launch_status && (
                                        <span className={`absolute left-2.5 top-2.5 max-w-[60%] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow ${isReady ? "bg-green-700" : "bg-[#E87722]"}`}>
                                            {project.launch_status}
                                        </span>
                                    )}

                                    {/* Active / Inactive: click to switch */}
                                    <Tooltip content={can('projects.edit') ? (project.is_active ? "Click to deactivate" : "Click to activate") : (project.is_active ? "Shown on website" : "Hidden from website")}>
                                        <button
                                            type="button"
                                            onClick={() => can('projects.edit') && handleToggleActive(project)}
                                            disabled={!can('projects.edit')}
                                            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow ${
                                                project.is_active ? "bg-white text-green-700" : "bg-red-600 text-white"
                                            }`}
                                        >
                                            {project.is_active ? "● Active" : "Inactive"}
                                        </button>
                                    </Tooltip>
                                </div>

                                <div className="flex flex-1 flex-col px-4 pt-3 pb-3">
                                    {/* Price */}
                                    <p className="mb-0 truncate text-base font-bold leading-tight text-[#1A1F36]" title={price}>
                                        {price || "Price on request"}
                                    </p>

                                    {/* Builder + name */}
                                    {project.builder_name && (
                                        <p className="mb-0 mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[#62748E]">
                                            {project.builder_name}
                                        </p>
                                    )}
                                    <p className="mb-0 mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[#001737]" title={project.name || ""}>
                                        <LuBuilding2 size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{project.name || "-"}</span>
                                    </p>

                                    {/* Address */}
                                    <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[13px] text-[#62748E]" title={address}>
                                        <LuMapPin size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{address || "-"}</span>
                                    </p>

                                    {/* Configuration */}
                                    {project.configuration && (
                                        <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[13px] text-[#62748E]" title={project.configuration}>
                                            <LuLayoutGrid size={14} className="shrink-0 text-[#62748E]" />
                                            <span className="truncate">{project.configuration}</span>
                                        </p>
                                    )}

                                    {/* Added by */}
                                    <div className="mt-3 border-t border-gray-100 pt-2">
                                        <p className="mb-0 text-[11px] text-[#62748E]">Added by</p>
                                        <AddedBy creator={project.creator} />
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                        <div className="flex items-center gap-2">
                                            {can('projects.edit') && (
                                                <Tooltip content="Update Project">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(project)}
                                                        className={actionButtonClass}
                                                        aria-label={`Update ${project.name}`}
                                                    >
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>
                                            )}

                                            {can('projects.delete') && (
                                                <Tooltip content="Delete Project">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(project)}
                                                        className={actionButtonClass}
                                                        aria-label={`Delete ${project.name}`}
                                                    >
                                                        <FaRegTrashCan size={14} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* Website page of the project (new tab); inactive ones are not on the website */}
                                        {!project.is_active ? (
                                            <Tooltip content="Inactive: not shown on the website">
                                                <span className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-200 px-4 text-sm font-semibold text-gray-500">
                                                    <LuEye size={15} />
                                                    View
                                                </span>
                                            </Tooltip>
                                        ) : (
                                        <a
                                            href={`/web/project/projectDetail/${encodeURIComponent(project.slug || project.id)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white no-underline transition hover:bg-[#d96818] hover:text-white"
                                        >
                                            <LuEye size={15} />
                                            View
                                        </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center text-[#62748E]">
                    {search ? "No projects found" : 'No projects yet. Click "Add Project" to create one.'}
                </div>
            )}

            {/* Pagination */}
            {!loading && filteredProjects.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>
            )}

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={formModalOpen}
                onClose={closeFormModal}
                size="3xl"
                title={editingProject ? "Update Project" : "Add Project"}
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
                <div className="space-y-6">
                    {formError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    {/* Image */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
                        <label
                            htmlFor="project_image"
                            className="flex h-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#E87722]"
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Project preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="px-4 text-center text-xs text-[#62748E]">
                                    Click to choose image
                                </span>
                            )}
                        </label>

                        <div>
                            <p className={labelClass}>
                                Project Image
                                {!editingProject && <span className="ml-1 text-red-500">*</span>}
                            </p>

                            <input
                                id="project_image"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageChange}
                                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]"
                            />

                            <p className="mt-1 text-xs text-[#62748E]">
                                JPG, PNG or WEBP, max {MAX_IMAGE_KB} KB.{editingProject && " Leave empty to keep current image."}
                            </p>

                            {/* Recommended width x height + chosen image size */}
                            <ImageSizeNote size={PROPERTY_IMAGE_SIZES.project} file={imageFile} />
                        </div>
                    </div>

                    {/* Basic */}
                    <div>
                        <h4 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-[#001737]">
                            Project Details
                        </h4>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className={labelClass}>
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Godrej Horizon" className={inputClass} />
                            </div>

                            <div>
                                <label htmlFor="builder_name" className={labelClass}>Builder / Developer</label>
                                <input id="builder_name" name="builder_name" value={form.builder_name} onChange={handleChange} placeholder="Godrej Properties" className={inputClass} />
                            </div>

                            <div>
                                <label htmlFor="configuration" className={labelClass}>Configuration</label>
                                <input id="configuration" name="configuration" value={form.configuration} onChange={handleChange} placeholder="2 & 3 BHK Apartments" className={inputClass} />
                            </div>

                            <div>
                                <label htmlFor="launch_status" className={labelClass}>Launch Status</label>
                                <select id="launch_status" name="launch_status" value={form.launch_status} onChange={handleChange} className={inputClass}>
                                    {launchStatusOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="description" className={labelClass}>Description</label>
                                <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Short project description" className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h4 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-[#001737]">
                            Location
                        </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="location" className={labelClass}>Locality</label>
                            <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Wadala" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="city" className={labelClass}>City</label>
                            <input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="state" className={labelClass}>State</label>
                            <input id="state" name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra" className={inputClass} />
                        </div>
                    </div>
                    </div>

                    {/* Price */}
                    <div>
                        <h4 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-[#001737]">
                            Price
                        </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="starting_price" className={labelClass}>Starting Price (₹)</label>
                            <input id="starting_price" name="starting_price" type="number" min="0" value={form.starting_price} onChange={handleChange} placeholder="24500000" className={inputClass} />
                            {form.starting_price && (
                                <p className="mt-1 text-xs text-[#62748E]">
                                    {formatPrice(form.starting_price)} onwards
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="price_label" className={labelClass}>Price Text (optional)</label>
                            <input id="price_label" name="price_label" value={form.price_label} onChange={handleChange} placeholder="₹2.45 Cr onwards" className={inputClass} />
                            <p className="mt-1 text-xs text-[#62748E]">Leave empty to show starting price.</p>
                        </div>
                    </div>
                    </div>

                    {/* Display */}
                    <div>
                        <h4 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-[#001737]">
                            Display on Website
                        </h4>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
                            <div>
                                <label htmlFor="link" className={labelClass}>Link (on click)</label>
                                <input id="link" name="link" value={form.link} onChange={handleChange} placeholder="https://builder-website.com" className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="sort_order" className={labelClass}>Display Order</label>
                                <input id="sort_order" name="sort_order" type="number" min="0" value={form.sort_order} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <p className="mt-1 text-xs text-[#62748E]">Lower order number shows first on homepage.</p>
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
                        setSelectedProject(null);
                    }
                }}
                title="Delete Project"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedProject(null);
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
                        {selectedProject?.name}
                    </span>
                    ?
                </p>
            </Tmodal>
        </div>
    );
}
