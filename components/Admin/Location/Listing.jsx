"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Tooltip } from "@heroui/react";
import { deleteLocation, getAdminLocations, saveLocation } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import Pagination from "../../Pagination/Pagination";
import { FaPen, FaStar } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";

const initialCityForm = {
    state_id: "",
    name: "",
    sort_order: "0",
    is_popular: true,
    is_active: true,
};

const initialStateForm = {
    name: "",
    sort_order: "0",
    is_active: true,
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

export default function Listing() {
    const can = useAdminPermission();
    // "cities" | "states"
    const [tab, setTab] = useState("cities");

    const [cities, setCities] = useState([]);
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState("");

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Add / Edit Modal
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(initialCityForm);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const isCityTab = tab === "cities";

    // Fetch states + cities
    const fetchData = async () => {
        setLoading(true);

        try {
            const [cityRes, stateRes] = await Promise.all([
                getAdminLocations("cities"),
                getAdminLocations("states"),
            ]);

            setCities(cityRes?.data?.cities ?? []);
            setStates(stateRes?.data?.states ?? []);
        } catch (error) {
            console.error("Failed to fetch locations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered rows for current tab
    const filteredRows = useMemo(() => {
        const rows = isCityTab ? cities : states;
        const keyword = search.toLowerCase();

        return rows.filter((row) => {
            if (isCityTab && stateFilter && String(row.state_id) !== String(stateFilter)) {
                return false;
            }

            if (!keyword) return true;

            return `${row.name ?? ""} ${row.state?.name ?? ""}`
                .toLowerCase()
                .includes(keyword);
        });
    }, [isCityTab, cities, states, search, stateFilter]);

    // Pagination Calculation
    const pageCount = Math.ceil(filteredRows.length / pageSize);

    const currentPageRows = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, pageSize]);

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
        { text: "10", value: 10 },
        { text: "25", value: 25 },
        { text: "50", value: 50 },
    ];

    const changeTab = (nextTab) => {
        setTab(nextTab);
        setSearch("");
        setStateFilter("");
        setPageIndex(0);
    };

    // Open Add Modal
    const openAddModal = () => {
        setEditingItem(null);
        setForm(
            isCityTab
                ? { ...initialCityForm, state_id: stateFilter || "" }
                : initialStateForm
        );
        setImageFile(null);
        setImagePreview("");
        setFormError("");
        setFormModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (item) => {
        setEditingItem(item);
        setForm(
            isCityTab
                ? {
                    state_id: String(item.state_id ?? ""),
                    name: item.name ?? "",
                    sort_order: String(item.sort_order ?? 0),
                    is_popular: !!item.is_popular,
                    is_active: !!item.is_active,
                }
                : {
                    name: item.name ?? "",
                    sort_order: String(item.sort_order ?? 0),
                    is_active: !!item.is_active,
                }
        );
        setImageFile(null);
        setImagePreview(item.image ?? "");
        setFormError("");
        setFormModalOpen(true);
    };

    const closeFormModal = () => {
        if (saving) return;
        setFormModalOpen(false);
        setEditingItem(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : editingItem?.image || "");
    };

    // Save (Add / Update)
    const handleSave = async () => {
        if (isCityTab && !form.state_id) {
            setFormError("Please select a state.");
            return;
        }

        if (!form.name.trim()) {
            setFormError(`${isCityTab ? "City" : "State"} name is required.`);
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (typeof value === "boolean") {
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, value ?? "");
                }
            });

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const res = await saveLocation(tab, formData, editingItem?.id);

            showToast(
                res?.message ||
                    (editingItem ? "Updated successfully." : "Added successfully.")
            );

            setFormModalOpen(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving.");
            showToast(error?.message || "Something went wrong while saving.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Quick toggle (is_active / is_popular)
    const handleToggle = async (item, field) => {
        try {
            const formData = new FormData();
            formData.append(field, item[field] ? "0" : "1");

            const res = await saveLocation(tab, formData, item.id);

            const update = (list) =>
                list.map((row) =>
                    row.id === item.id ? { ...row, [field]: !item[field] } : row
                );

            isCityTab ? setCities(update) : setStates(update);
            showToast(res?.message || "Updated successfully.");
        } catch (error) {
            showToast(error?.message || "Failed to update.", "error");
        }
    };

    // Delete
    const handleDeleteClick = (item) => {
        setSelectedItem(item);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedItem?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteLocation(tab, selectedItem.id);

            if (isCityTab) {
                setCities((previous) => previous.filter((row) => row.id !== selectedItem.id));
                setStates((previous) =>
                    previous.map((row) =>
                        row.id === selectedItem.state_id
                            ? { ...row, cities_count: Math.max((row.cities_count ?? 1) - 1, 0) }
                            : row
                    )
                );
            } else {
                setStates((previous) => previous.filter((row) => row.id !== selectedItem.id));
            }

            setDeleteModalOpen(false);
            setSelectedItem(null);
            showToast(res?.message || "Deleted successfully.");
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const thClass = "px-4 py-3 text-left whitespace-nowrap";
    const colCount = isCityTab ? 6 : 5;

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "States & Cities", active: true },
                ]}
                title="States & Cities"
            />

            {/* Tabs */}
            <div className="mt-6 flex gap-2 border-b border-gray-200">
                {[
                    { key: "cities", label: `Cities (${cities.length})` },
                    { key: "states", label: `States (${states.length})` },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => changeTab(item.key)}
                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition
                        ${tab === item.key
                                ? "border-[#E87722] text-[#E87722]"
                                : "border-transparent text-[#62748E] hover:text-[#E87722]"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Filters + Add */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder={isCityTab ? "Search city or state..." : "Search state..."}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full sm:w-72 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(232,119,34)]"
                    />

                    {isCityTab && (
                        <select
                            value={stateFilter}
                            onChange={(e) => {
                                setStateFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full sm:w-56 px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(232,119,34)]"
                        >
                            <option value="">All States</option>
                            {states.map((state) => (
                                <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {can('locations.create') && (
                <button
                    type="button"
                    onClick={openAddModal}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                >
                    <FiPlus size={16} />
                    {isCityTab ? "Add City" : "Add State"}
                </button>
                )}
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className={thClass}>#</th>
                            <th className={thClass}>{isCityTab ? "City" : "State"}</th>
                            <th className={thClass}>{isCityTab ? "Properties" : "Cities"}</th>
                            {isCityTab && <th className={thClass}>Popular</th>}
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
                        ) : currentPageRows.length > 0 ? (
                            currentPageRows.map((row) => (
                                <tr key={row.id} className="border-t hover:bg-gray-50/60">
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                        {row.sort_order}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {row.image ? (
                                                <img
                                                    src={row.image}
                                                    alt={row.name}
                                                    className="h-12 w-20 shrink-0 rounded-lg object-cover border"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border bg-gray-50 text-[10px] text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-[#1A1F36] truncate max-w-[240px]">
                                                    {row.name}
                                                </div>
                                                {isCityTab && (
                                                    <div className="text-xs text-gray-500 truncate max-w-[240px]">
                                                        {row.state?.name || "-"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {isCityTab ? row.properties_count ?? 0 : row.cities_count ?? 0}
                                    </td>

                                    {isCityTab && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Tooltip content={row.is_popular ? "Shown on homepage. Click to remove" : "Click to show on homepage"}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(row, "is_popular")}
                                                    disabled={!can('locations.edit')}
                                                    className={row.is_popular ? "text-[#E87722]" : "text-gray-300 hover:text-[#E87722]"}
                                                >
                                                    <FaStar size={18} />
                                                </button>
                                            </Tooltip>
                                        </td>
                                    )}

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Tooltip content={row.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(row, "is_active")}
                                                disabled={!can('locations.edit')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold
                                                ${row.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {row.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </Tooltip>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {can('locations.edit') && (
                                            <Tooltip content={`Update ${isCityTab ? "City" : "State"}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(row)}
                                                    className={actionButtonClass}
                                                >
                                                    <FaPen size={13} />
                                                </button>
                                            </Tooltip>
                                            )}

                                            {can('locations.delete') && (
                                            <Tooltip content={`Delete ${isCityTab ? "City" : "State"}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(row)}
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
                                    {isCityTab ? "No cities found" : "No states found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-3 border-t">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>
            </div>

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={formModalOpen}
                onClose={closeFormModal}
                size="xl"
                title={`${editingItem ? "Update" : "Add"} ${isCityTab ? "City" : "State"}`}
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

                    {/* Image */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                        <label
                            htmlFor="location_image"
                            className="flex h-[110px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#E87722]"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <span className="px-4 text-center text-xs text-[#62748E]">Click to choose image</span>
                            )}
                        </label>

                        <div>
                            <p className={labelClass}>Image</p>
                            <input
                                id="location_image"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageChange}
                                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]"
                            />
                            <p className="mt-1 text-xs text-[#62748E]">
                                JPG, PNG or WEBP, max 5 MB.{editingItem && " Leave empty to keep current image."}
                            </p>
                        </div>
                    </div>

                    {isCityTab && (
                        <div>
                            <label htmlFor="state_id" className={labelClass}>
                                State <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="state_id"
                                name="state_id"
                                value={form.state_id}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">Select State</option>
                                {states.map((state) => (
                                    <option key={state.id} value={state.id}>{state.name}</option>
                                ))}
                            </select>
                            {states.length === 0 && (
                                <p className="mt-1 text-xs text-red-600">Add a state first from the States tab.</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
                        <div>
                            <label htmlFor="location_name" className={labelClass}>
                                {isCityTab ? "City" : "State"} Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="location_name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder={isCityTab ? "Mumbai" : "Maharashtra"}
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
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {isCityTab && (
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                <input
                                    type="checkbox"
                                    checked={form.is_popular}
                                    onChange={(event) =>
                                        setForm((previous) => ({ ...previous, is_popular: event.target.checked }))
                                    }
                                    className="h-4 w-4 accent-[#E87722]"
                                />
                                Popular (show on homepage)
                            </label>
                        )}

                        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) =>
                                    setForm((previous) => ({ ...previous, is_active: event.target.checked }))
                                }
                                className="h-4 w-4 accent-[#E87722]"
                            />
                            Active
                        </label>
                    </div>
                </div>
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteModalOpen(false);
                        setSelectedItem(null);
                    }
                }}
                title={`Delete ${isCityTab ? "City" : "State"}`}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedItem(null);
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
                    <span className="font-semibold text-gray-900">{selectedItem?.name}</span>?
                </p>

                {!isCityTab && selectedItem?.cities_count > 0 && (
                    <p className="mt-2 text-sm text-red-600">
                        This state has {selectedItem.cities_count} cities. Delete or move them first.
                    </p>
                )}
            </Tmodal>
        </div>
    );
}
