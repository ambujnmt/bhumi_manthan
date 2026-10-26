"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import AddedBy from "../AddedBy";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Link, Spinner, Tooltip } from "@heroui/react";
import { deleteProperty, getAdminProperties } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import Pagination from "../../Pagination/Pagination";
import { AiOutlineEye } from "react-icons/ai";
import { FaPen, FaRegImage } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import Tmodal from "../../Tmodal/Tmodal";
import { FiPlus, FiSearch } from "react-icons/fi";

// First few words only (full text shows on hover)
const shortText = (text, words = 3) => {
    const parts = String(text || "").trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "-";

    return parts.length > words
        ? `${parts.slice(0, words).join(" ").replace(/,$/, "")}...`
        : parts.join(" ");
};

export default function Listing() {
    const can = useAdminPermission();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Deleted Properties Toggle
    const [showDeleted, setShowDeleted] = useState(false);

    // Search
    const [search, setSearch] = useState("");

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);

            try {
                const res = await getAdminProperties(showDeleted);

                if (res?.status && Array.isArray(res?.data?.properties)) {
                    setProperties(res.data.properties);
                } else {
                    setProperties([]);
                }
            } catch (error) {
                console.error("Failed to fetch properties:", error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [showDeleted]);

    // Search Filter
    const filteredProperties = useMemo(() => {
        const propertyList = Array.isArray(properties)
            ? properties
            : [];

        if (!search) return propertyList;

        return propertyList.filter((property) =>
            `${property?.title ?? ""}
            ${property?.property_id ?? ""}
            ${property?.location ?? ""}
            ${property?.city ?? ""}
            ${property?.property_type ?? ""}
            ${property?.listing_type ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [properties, search]);

    // Pagination Calculation
    const pageCount = Math.ceil(
        filteredProperties.length / pageSize
    );

    const currentPageProperties = useMemo(() => {
        const start = pageIndex * pageSize;

        return filteredProperties.slice(
            start,
            start + pageSize
        );
    }, [filteredProperties, pageIndex, pageSize]);

    // Pagination Adapter
    const tableProps = {
        pageCount,
        pageOptions: Array.from({ length: pageCount }),
        state: {
            pageIndex,
            pageSize,
        },

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

    // Delete Click
    const handleDeleteClick = (property) => {
        setSelectedProperty(property);
        setDeleteModalOpen(true);
    };

    // Delete Confirm
    const handleDeleteConfirm = async () => {
        if (!selectedProperty?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteProperty(selectedProperty.id);

            // Remove soft deleted property from list
            setProperties((prev) =>
                prev.filter(
                    (property) => property.id !== selectedProperty.id
                )
            );

            setDeleteModalOpen(false);
            setSelectedProperty(null);
            showToast(res?.message || "Property deleted successfully.");

        } catch (error) {
            console.error(
                "Failed to delete property:",
                error
            );

            showToast(
                error?.message ||
                "Something went wrong while deleting the property.",
                "error"
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    {
                        label: "Dashboard",
                        path: "/admin/dashboard",
                    },
                    {
                        label: "Property",
                        active: true,
                    },
                ]}
                title="Property Management"
            />

            {/* Search + Actions */}
            <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <FiSearch
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search by title, property ID, location..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageIndex(0);
                        }}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                <div className="flex items-center gap-3">

                    {/* Deleted Properties Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowDeleted((prev) => !prev);
                            setSearch("");
                            setPageIndex(0);
                        }}
                        className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition
                        ${showDeleted
                                ? "bg-[#E87722] text-white hover:bg-[#d96818]"
                                : "border border-[#E87722] bg-white text-[#E87722] hover:bg-orange-50"
                            }`}
                    >
                        <FaRegTrashCan size={14} />
                        <span className="hidden sm:inline">
                            {showDeleted ? "Show Active Properties" : "Show Deleted Properties"}
                        </span>
                    </button>

                    {can('properties.create') && (
                    <Link
                        href="/admin/propertyManagement/createProperty"
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]">
                        <FiPlus size={16} />
                        <span className="hidden sm:inline">
                            Add Property
                        </span>
                    </Link>
                    )}

                </div>
            </div>

            <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">

                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-[#62748E]">
                            <tr>
                                <th className="w-[150px] px-4 py-3 text-left font-semibold">Property</th>
                                <th className="px-4 py-3 text-left font-semibold">Property ID</th>
                                <th className="px-4 py-3 text-left font-semibold">Location</th>
                                <th className="px-4 py-3 text-left font-semibold">Price & Status</th>
                                <th className="px-4 py-3 text-left font-semibold">Added By</th>
                                {/* Action column stays visible on the right while the table scrolls sideways */}
                                <th className="sticky right-0 z-10 w-[130px] bg-gray-50 px-4 py-3 text-left font-semibold shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]">Action</th>
                            </tr>
                        </thead>

                        {loading ? (
                            <tbody>
                                <tr>
                                    <td colSpan="6">
                                        <div className="flex justify-center items-center py-16">
                                            <Spinner size="md" />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>

                                {currentPageProperties.length > 0 ? (
                                    currentPageProperties.map((property) => (
                                        <tr
                                            key={property.id}
                                            className="border-t border-gray-100 align-middle transition hover:bg-orange-50/40"
                                        >

                                            {/* Property: banner image + name below */}
                                            <td className="px-4 py-3">
                                                <div className="w-[118px]">
                                                    {/* Image + listing tag (Sale / Rent ...) on top */}
                                                    <div className="relative w-[110px]">
                                                    {property.main_image ? (
                                                        <img
                                                            src={property.main_image}
                                                            alt={property.title || "Property"}
                                                            className="h-[70px] w-[110px] rounded-md border border-gray-200 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-[70px] w-[110px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                                            <FaRegImage size={20} />
                                                        </div>
                                                    )}

                                                    {property.listing_type && (
                                                        <span className="absolute left-1 top-1 max-w-[100px] truncate rounded bg-[#E87722] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow">
                                                            {property.listing_type}
                                                        </span>
                                                    )}
                                                    </div>

                                                    <div
                                                        className="mt-1.5 truncate text-sm font-semibold text-[#001737]"
                                                        title={property.title || ""}
                                                    >
                                                        {property.title || "-"}
                                                    </div>

                                                    <div className="truncate text-xs text-[#62748E]">
                                                        {[property.configuration, property.property_type]
                                                            .filter(Boolean)
                                                            .join(" · ") || "-"}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Property ID */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-[#1A1F36]">
                                                    {property.property_id || "-"}
                                                </span>
                                            </td>

                                            {/* Location */}
                                            <td
                                                className="px-4 py-3"
                                                title={[property.location, property.city, property.state]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            >
                                                <div className="max-w-[140px] truncate text-[#1A1F36]">
                                                    {shortText(property.location)}
                                                </div>

                                                <div className="max-w-[140px] truncate text-xs text-[#62748E]">
                                                    {property.city || "-"}
                                                </div>
                                            </td>

                                            {/* Price & Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-semibold text-[#001737]">
                                                    {property.price
                                                        ? `₹${Number(property.price).toLocaleString("en-IN")}`
                                                        : "-"}
                                                </div>

                                                <span
                                                    className={`mt-1.5 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize
                                                    ${property.status
                                                            ?.toLowerCase()
                                                            .includes("ready")
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {property.status || "-"}
                                                </span>
                                            </td>

                                            {/* Added By (created_by) */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <AddedBy creator={property.creator} />
                                            </td>

                                            {/* Actions */}
                                            <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-4 py-3 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]">
                                                <div className="flex items-center gap-2">

                                                    <Tooltip content="View Property Detail">
                                                        <Link
                                                            href={`/admin/propertyManagement/propertyDetail/${property.id}`}
                                                            className={actionButtonClass}
                                                            aria-label="View property"
                                                        >
                                                            <AiOutlineEye size={18} />
                                                        </Link>
                                                    </Tooltip>

                                                    {!showDeleted && (
                                                        <>
                                                            {can('properties.edit') && (
                                                            <Tooltip content="Update Property">
                                                                <Link
                                                                    href={`/admin/propertyManagement/propertyUpdate/${property.id}`}
                                                                    className={actionButtonClass}
                                                                    aria-label="Update property"
                                                                >
                                                                    <FaPen size={13} />
                                                                </Link>
                                                            </Tooltip>
                                                            )}

                                                            {can('properties.delete') && (
                                                            <Tooltip content="Delete Property">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteClick(property)}
                                                                    className={actionButtonClass}
                                                                    aria-label="Delete property"
                                                                >
                                                                    <FaRegTrashCan size={14} />
                                                                </button>
                                                            </Tooltip>
                                                            )}
                                                        </>
                                                    )}

                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="py-12 text-center text-[#62748E]"
                                        >
                                            {showDeleted ? "No deleted properties found" : "No properties found"}
                                        </td>
                                    </tr>
                                )}

                            </tbody>
                        )}

                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-100 p-3">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>

            </div>

            {/* Delete Modal */}
            <Tmodal
                isOpen={deleteModalOpen}

                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteModalOpen(false);
                        setSelectedProperty(null);
                    }
                }}

                title="Delete Property"

                footer={
                    <div className="flex gap-3">

                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedProperty(null);
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
                                    <Spinner
                                        size="sm"
                                        color="white"
                                    />
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
                        {selectedProperty?.title}
                    </span>

                    ?

                </p>

            </Tmodal>

        </div>
    );
}
