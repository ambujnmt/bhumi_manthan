"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Link } from "@heroui/react";
import { useRouter } from "next/router";
import { getPropertyDetail } from "../../../utils/adminFetchApi";
import { RichTextContent } from "../../RichTextEditor/RichTextEditor";
import {
    FaMapMarkerAlt,
    FaBed,
    FaBath,
    FaCar,
    FaBuilding,
    FaRulerCombined,
    FaCompass,
    FaCalendarAlt,
    FaUser,
    FaPhone,
    FaCheckCircle,
    FaHome,
    FaLayerGroup,
    FaArrowLeft,
} from "react-icons/fa";

export default function Detail() {
    const router = useRouter();

    const { id } = router.query;

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!router.isReady || !id) return;

        const fetchPropertyDetail = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await getPropertyDetail(id);

                console.log(
                    "Property Detail API Response:",
                    res
                );

                if (
                    res?.status &&
                    res?.data?.property
                ) {
                    setProperty(res.data.property);
                } else {
                    setError(
                        res?.message ||
                        "Property not found."
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to fetch property detail:",
                    error
                );

                setError(
                    error?.message ||
                    "Something went wrong while fetching property."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyDetail();
    }, [router.isReady, id]);

    // Loading
    if (loading) {
        return (
            <div>
                <PageTitle
                    breadCrumbItems={[
                        {
                            label: "Dashboard",
                            path: "/admin/dashboard",
                        },
                        {
                            label: "Property Listing",
                            path: "/admin/propertyManagement/propertyList",
                        },
                        {
                            label: "Detail",
                            active: true,
                        },
                    ]}
                    title="Property Detail"
                />

                <div className="flex justify-center items-center py-24">
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    // Error
    if (error || !property) {
        return (
            <div>
                <PageTitle
                    breadCrumbItems={[
                        {
                            label: "Dashboard",
                            path: "/admin/dashboard",
                        },
                        {
                            label: "Property Listing",
                            path: "/admin/propertyManagement/propertyList",
                        },
                        {
                            label: "Detail",
                            active: true,
                        },
                    ]}
                    title="Property Detail"
                />

                <div className="bg-white rounded-xl shadow-sm p-10 text-center mt-6">
                    <p className="text-red-500 font-medium">
                        {error || "Property not found."}
                    </p>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        if (!price) return "-";

        return `₹${Number(price).toLocaleString(
            "en-IN"
        )}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const value = (data) => {
        if (
            data === null ||
            data === undefined ||
            data === ""
        ) {
            return "-";
        }

        return data;
    };

    return (
        <div className="pb-10">

            {/* Page Title */}
            <PageTitle
                breadCrumbItems={[
                    {
                        label: "Dashboard",
                        path: "/admin/dashboard",
                    },
                    {
                        label: "Property Listing",
                        path: "/admin/propertyManagement/propertyList",
                    },
                    {
                        label: "Detail",
                        active: true,
                    },
                ]}
                title="Property Detail"
            />


            {/* ===================================================== */}
            {/* HERO / PROPERTY HEADER */}
            {/* ===================================================== */}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

                    {/* Main Image */}
                    <div className="relative h-[320px] lg:h-[430px] bg-gray-100">

                        {property.main_image ? (
                            <img
                                src={property.main_image}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Property Image
                            </div>
                        )}

                        {/* Listing Badge */}
                        <div className="absolute top-5 left-5">

                            <span className="px-4 py-2 rounded-full bg-[rgb(232,119,34)] text-white text-sm font-semibold">
                                {value(
                                    property.listing_type
                                )}
                            </span>

                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-5 right-5">

                            <span className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold">
                                {value(
                                    property.status
                                )}
                            </span>

                        </div>

                    </div>

                    {/* Header Details */}
                    <div className="p-6 lg:p-8 flex flex-col justify-center">

                        <div className="mb-4">

                            <p className="text-sm font-medium text-[rgb(232,119,34)] mb-2">
                                {value(
                                    property.property_type
                                )}
                            </p>

                            <h1 className="text-2xl lg:text-3xl font-bold text-[#001737] break-words">
                                {value(property.title)}
                            </h1>

                        </div>

                        <div className="flex items-start gap-2 text-[#62748E] mb-6">

                            <FaMapMarkerAlt className="mt-1 text-[rgb(232,119,34)] shrink-0" />

                            <span>
                                {value(property.location)}
                                {property.city
                                    ? `, ${property.city}`
                                    : ""}
                                {property.state
                                    ? `, ${property.state}`
                                    : ""}
                            </span>

                        </div>

                        {/* Price */}
                        <div className="mb-6">

                            <p className="text-sm text-[#62748E] mb-1">
                                Property Price
                            </p>

                            <h2 className="text-3xl font-bold text-[#001737]">
                                {formatPrice(
                                    property.price
                                )}
                            </h2>

                            {property.price_per_sqft && (
                                <p className="text-sm text-[#62748E] mt-1">
                                    ₹
                                    {Number(
                                        property.price_per_sqft
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                    {" "}per sq.ft
                                </p>
                            )}

                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                            <QuickStat
                                icon={<FaBed />}
                                label="Bedrooms"
                                value={property.bedrooms}
                            />

                            <QuickStat
                                icon={<FaBath />}
                                label="Bathrooms"
                                value={property.bathrooms}
                            />

                            <QuickStat
                                icon={<FaRulerCombined />}
                                label="Area"
                                value={
                                    property.super_area
                                        ? `${property.super_area} sq.ft`
                                        : "-"
                                }
                            />

                            <QuickStat
                                icon={<FaCar />}
                                label="Parking"
                                value={property.parking}
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* ===================================================== */}
            {/* IMAGE GALLERY */}
            {/* ===================================================== */}

            {(property.image_2 ||
                property.image_3 ||
                property.gallery_images?.length > 0 ||
                property.floor_plan_image) && (

                <section className="mt-6">

                    <SectionTitle title="Property Images" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {property.image_2 && (
                            <ImageCard
                                src={property.image_2}
                                alt="Property Image 2"
                            />
                        )}

                        {property.image_3 && (
                            <ImageCard
                                src={property.image_3}
                                alt="Property Image 3"
                            />
                        )}

                        {property.gallery_images?.map((image, index) => (
                            <ImageCard
                                key={image}
                                src={image}
                                alt={`Property Image ${index + 1}`}
                            />
                        ))}

                        {property.floor_plan_image && (
                            <ImageCard
                                src={
                                    property.floor_plan_image
                                }
                                alt="Floor Plan"
                                label="Floor Plan"
                            />
                        )}

                    </div>

                </section>
            )}

            {/* ===================================================== */}
            {/* PROPERTY INFORMATION */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="Property Information" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">

                        <InfoItem
                            label="Property ID"
                            value={property.property_id}
                        />

                        <InfoItem
                            label="Property Type"
                            value={property.property_type}
                        />

                        <InfoItem
                            label="Listing Type"
                            value={property.listing_type}
                        />

                        <InfoItem
                            label="Configuration"
                            value={property.configuration}
                        />

                        <InfoItem
                            label="Property Status"
                            value={property.status}
                        />

                        <InfoItem
                            label="Project"
                            value={property.project}
                        />

                        <InfoItem
                            label="Super Area"
                            value={
                                property.super_area
                                    ? `${property.super_area} sq.ft`
                                    : null
                            }
                        />

                        <InfoItem
                            label="Price"
                            value={formatPrice(
                                property.price
                            )}
                        />

                        <InfoItem
                            label="Price Per Sq.Ft"
                            value={
                                property.price_per_sqft
                                    ? `₹${Number(
                                        property.price_per_sqft
                                    ).toLocaleString(
                                        "en-IN"
                                    )}`
                                    : null
                            }
                        />

                        <InfoItem
                            label="Bedrooms"
                            value={property.bedrooms}
                        />

                        <InfoItem
                            label="Bathrooms"
                            value={property.bathrooms}
                        />

                        <InfoItem
                            label="Balconies"
                            value={property.balconies}
                        />

                        <InfoItem
                            label="Parking"
                            value={property.parking}
                        />

                        <InfoItem
                            label="Floor"
                            value={property.floor}
                        />

                        <InfoItem
                            label="Total Floors"
                            value={property.total_floors}
                        />

                        <InfoItem
                            label="Facing"
                            value={property.facing}
                        />

                        <InfoItem
                            label="Furnishing"
                            value={property.furnishing}
                        />

                        <InfoItem
                            label="Age of Property"
                            value={property.age_of_property}
                        />

                        <InfoItem
                            label="Ownership"
                            value={property.ownership}
                        />

                    </div>

                </div>

            </section>

            {/* ===================================================== */}
            {/* DESCRIPTION */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="Description" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    <RichTextContent
                        value={property.description}
                        className="text-[#62748E] leading-7 break-words"
                    />

                </div>

            </section>

            {/* ===================================================== */}
            {/* LOCATION DETAILS */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="Location Details" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <InfoItem
                            label="Location"
                            value={property.location}
                        />

                        <InfoItem
                            label="City"
                            value={property.city}
                        />

                        <InfoItem
                            label="State"
                            value={property.state}
                        />

                        <InfoItem
                            label="Latitude"
                            value={property.latitude}
                        />

                        <InfoItem
                            label="Longitude"
                            value={property.longitude}
                        />

                        <InfoItem
                            label="Rapid Metro Distance"
                            value={
                                property.rapid_metro_distance
                            }
                        />

                        <InfoItem
                            label="School Distance"
                            value={
                                property.school_distance
                            }
                        />

                        <InfoItem
                            label="Hospital Distance"
                            value={
                                property.hospital_distance
                            }
                        />

                    </div>

                </div>

            </section>

            {/* ===================================================== */}
            {/* LOCATION IMAGE */}
            {/* ===================================================== */}

            {property.location_image && (

                <section className="mt-6">

                    <SectionTitle title="Location Image" />

                    <div className="bg-white rounded-xl shadow-sm p-5">

                        <img
                            src={property.location_image}
                            alt="Property Location"
                            className="w-full max-h-[450px] object-cover rounded-xl"
                        />

                    </div>

                </section>
            )}

            {/* ===================================================== */}
            {/* AGENT INFORMATION */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="Agent Information" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    <div className="flex flex-col md:flex-row gap-6 items-start">

                        {/* Agent Image */}
                        <div className="shrink-0">

                            {property.agent_image ? (
                                <img
                                    src={
                                        property.agent_image
                                    }
                                    alt={
                                        property.agent_name
                                    }
                                    className="w-24 h-24 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-[#001737] flex items-center justify-center">
                                    <FaUser
                                        size={32}
                                        className="text-white"
                                    />
                                </div>
                            )}

                        </div>

                        {/* Agent Details */}
                        <div className="flex-1">

                            <div className="flex flex-wrap items-center gap-3 mb-2">

                                <h3 className="text-xl font-bold text-[#001737]">
                                    {value(
                                        property.agent_name
                                    )}
                                </h3>

                                {property.agent_verified && (
                                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                        <FaCheckCircle />
                                        Verified
                                    </span>
                                )}

                            </div>

                            <p className="text-[#62748E] mb-5">
                                {value(
                                    property.agent_type
                                )}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                <InfoItem
                                    label="Experience"
                                    value={
                                        property.agent_experience
                                    }
                                />

                                <InfoItem
                                    label="Phone"
                                    value={
                                        property.agent_phone
                                    }
                                    icon={<FaPhone />}
                                />

                                <InfoItem
                                    label="Agent Type"
                                    value={
                                        property.agent_type
                                    }
                                />

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* ===================================================== */}
            {/* AMENITIES */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="Amenities" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    {Array.isArray(property.amenities) &&
                    property.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-3">

                            {property.amenities.map(
                                (amenity, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 rounded-lg bg-orange-50 text-[#001737] text-sm font-medium"
                                    >
                                        {typeof amenity ===
                                        "object"
                                            ? amenity.name ||
                                              "-"
                                            : amenity}
                                    </span>
                                )
                            )}

                        </div>
                    ) : (
                        <p className="text-[#62748E]">
                            No amenities added.
                        </p>
                    )}

                </div>

            </section>

            {/* ===================================================== */}
            {/* SYSTEM INFORMATION */}
            {/* ===================================================== */}

            <section className="mt-6">

                <SectionTitle title="System Information" />

                <div className="bg-white rounded-xl shadow-sm p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <InfoItem
                            label="Database ID"
                            value={property.id}
                        />

                        <InfoItem
                            label="Created By"
                            value={property.created_by}
                        />

                        <InfoItem
                            label="Created At"
                            value={formatDate(
                                property.created_at
                            )}
                        />

                        <InfoItem
                            label="Updated At"
                            value={formatDate(
                                property.updated_at
                            )}
                        />

                        <InfoItem
                            label="Deleted At"
                            value={formatDate(
                                property.deleted_at
                            )}
                        />

                    </div>

                </div>

            </section>

        </div>
    );
}


/* ========================================================= */
/* REUSABLE COMPONENTS */
/* ========================================================= */

function SectionTitle({ title }) {
    return (
        <div className="flex items-center gap-3 mb-4">

            <div className="w-1 h-7 rounded-full bg-[rgb(232,119,34)]" />

            <h2 className="text-xl font-bold text-[#001737]">
                {title}
            </h2>

        </div>
    );
}


function InfoItem({ label, value, icon }) {
    return (
        <div className="min-w-0">

            <p className="text-xs font-medium text-[#62748E] mb-1">
                {icon && (
                    <span className="inline-flex mr-1 text-[rgb(232,119,34)]">
                        {icon}
                    </span>
                )}

                {label}
            </p>

            <p className="text-sm font-semibold text-[#1A1F36] break-words">
                {value === null ||
                value === undefined ||
                value === ""
                    ? "-"
                    : value}
            </p>

        </div>
    );
}


function QuickStat({ icon, label, value }) {
    return (
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">

            <div className="text-[rgb(232,119,34)] mb-2">
                {icon}
            </div>

            <p className="text-xs text-[#62748E]">
                {label}
            </p>

            <p className="text-sm font-semibold text-[#001737] mt-1 break-words">
                {value === null ||
                value === undefined ||
                value === ""
                    ? "-"
                    : value}
            </p>

        </div>
    );
}


function ImageCard({ src, alt, label }) {
    return (
        <div className="relative bg-white rounded-xl shadow-sm overflow-hidden group">

            <img
                src={src}
                alt={alt}
                className="w-full h-[240px] object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {label && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#001737]/80 px-4 py-3">

                    <p className="text-white text-sm font-medium">
                        {label}
                    </p>

                </div>
            )}

        </div>
    );
}
