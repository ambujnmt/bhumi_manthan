"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import AddedBy from "../AddedBy";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Link, Spinner, Tooltip } from "@heroui/react";
import { deleteProperty, getAdminProperties } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { saveCachedProperties } from "../../../utils/adminPropertyCache";
import Pagination from "../../Pagination/Pagination";
import { FaPen, FaRegImage } from "react-icons/fa";
import { LuCopy, LuEye, LuHouse, LuMapPin } from "react-icons/lu";

// Property ID chip click -> copy plain ID
const copyPropertyId = async (id) => {
    try {
        await navigator.clipboard.writeText(String(id));
        showToast("Property ID copied.");
    } catch (error) {
        showToast("Unable to copy Property ID.", "error");
    }
};
import { FaRegTrashCan } from "react-icons/fa6";
import Tmodal from "../../Tmodal/Tmodal";
import { FiPlus, FiSearch } from "react-icons/fi";
import { LuBath, LuBedDouble, LuCar, LuRuler } from "react-icons/lu";

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
    const [pageSize, setPageSize] = useState(12);

    // Fetch Properties
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);

            try {
                const res = await getAdminProperties(showDeleted);

                if (res?.status && Array.isArray(res?.data?.properties)) {
                    setProperties(res.data.properties);
                    saveCachedProperties(res.data.properties);
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
        { text: "12", value: 12 },
        { text: "24", value: 24 },
        { text: "48", value: 48 },
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
            <div className="mt-4 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            {/* Count */}
            {!loading && (
                <p className="mb-2 text-sm text-[#62748E]">
                    {filteredProperties.length > 0
                        ? `Showing ${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, filteredProperties.length)} of ${filteredProperties.length} properties`
                        : ""}
                </p>
            )}

            {/* Property cards (3 per row) */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <div key={key} className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            <div className="h-44 bg-gray-200" />
                            <div className="space-y-3 p-4">
                                <div className="h-5 w-1/3 rounded bg-gray-200" />
                                <div className="h-4 w-4/5 rounded bg-gray-200" />
                                <div className="h-3 w-2/3 rounded bg-gray-100" />
                                <div className="h-3 w-1/2 rounded bg-gray-100" />
                                <div className="h-9 rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : currentPageProperties.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {currentPageProperties.map((property) => {
                        const address = [property.location, property.city, property.state]
                            .filter(Boolean)
                            .join(", ");
                        const isReady = property.status?.toLowerCase().includes("ready");

                        return (
                            <div
                                key={property.id}
                                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                            >
                                {/* Image + badges */}
                                <div className="relative h-44 w-full shrink-0 bg-gray-100">
                                    {property.main_image ? (
                                        <img
                                            src={property.main_image}
                                            alt={property.title || "Property"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                            <FaRegImage size={36} />
                                        </div>
                                    )}

                                    {property.status && (
                                        <span
                                            className={`absolute left-2.5 top-2.5 max-w-[60%] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-white shadow ${isReady ? "bg-green-700" : "bg-[#E87722]"}`}
                                        >
                                            {property.status}
                                        </span>
                                    )}

                                    {property.property_type && (
                                        <span className="absolute right-2.5 top-2.5 max-w-[40%] truncate rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold capitalize text-[#1A1F36] shadow">
                                            {property.property_type}
                                        </span>
                                    )}

                                </div>

                                <div className="flex flex-1 flex-col px-4 pt-3 pb-3">
                                    {/* Price */}
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="mb-0 truncate text-base font-bold leading-tight text-[#1A1F36]">
                                            {property.price ? (
                                                <>
                                                    <span className="mr-0.5 text-[#E87722]">₹</span>
                                                    {Number(property.price).toLocaleString("en-IN")}
                                                </>
                                            ) : (
                                                "Price on request"
                                            )}
                                        </p>

                                        {/* Property ID */}
                                        {property.property_id && (
                                            <button
                                                type="button"
                                                onClick={() => copyPropertyId(property.property_id)}
                                                className="flex shrink-0 items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#E87722] transition hover:bg-orange-100"
                                                title="Click to copy Property ID"
                                            >
                                                {property.property_id}
                                                <LuCopy size={11} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <p
                                        className="mb-0 mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[#001737]"
                                        title={property.title || ""}
                                    >
                                        <LuHouse size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{property.title || "-"}</span>
                                    </p>

                                    {/* Address */}
                                    <p className="mb-0 mt-1.5 flex items-center gap-1.5 text-[13px] text-[#62748E]" title={address}>
                                        <LuMapPin size={14} className="shrink-0 text-[#E87722]" />
                                        <span className="truncate">{address || "-"}</span>
                                    </p>

                                    {/* Beds / baths / parking / area */}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#62748E]">
                                        <span className="flex items-center gap-1.5" title="Bedrooms">
                                            <LuBedDouble size={16} className="text-[#62748E]" />
                                            {property.bedrooms ?? 0}
                                        </span>
                                        <span className="flex items-center gap-1.5" title="Bathrooms">
                                            <LuBath size={16} className="text-[#62748E]" />
                                            {property.bathrooms ?? 0}
                                        </span>
                                        <span className="flex items-center gap-1.5" title="Parking">
                                            <LuCar size={16} className="text-[#62748E]" />
                                            {property.parking ?? 0}
                                        </span>
                                        {property.super_area && (
                                            <span className="flex items-center gap-1.5" title="Super area">
                                                <LuRuler size={15} className="text-[#62748E]" />
                                                {property.super_area}
                                            </span>
                                        )}
                                    </div>

                                    {/* Added by */}
                                    <div className="mt-3 border-t border-gray-100 pt-2">
                                        <p className="mb-0 text-[11px] text-[#62748E]">Added by</p>
                                        <AddedBy creator={property.creator} />
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {!showDeleted && can('properties.edit') && (
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

                                            {!showDeleted && can('properties.delete') && (
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
                                        </div>

                                        <Link
                                            href={`/admin/propertyManagement/propertyDetail/${property.id}`}
                                            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white transition hover:bg-[#d96818]"
                                        >
                                            <LuEye size={15} />
                                            View
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-14 text-center text-[#62748E]">
                    {showDeleted ? "No deleted properties found" : "No properties found"}
                </div>
            )}

            {/* Pagination */}
            {!loading && filteredProperties.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>
            )}

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
