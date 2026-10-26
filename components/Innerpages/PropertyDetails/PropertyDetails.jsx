"use client";

import { Link } from '@heroui/react'
import { FaBed, FaBath, FaCar } from "react-icons/fa";
import FloorLocation from './FloorLocation';
import PropertyImageSlider from './PropertyImageSlider';
import SimilarProperties from './SimilarProperties';
import PropertySideForm from './PropertySideForm';
import { FaCog, FaRulerCombined, FaCity, FaBuilding, } from "react-icons/fa";
import { FaVectorSquare, FaCompass, FaFileSignature, FaCouch } from "react-icons/fa";
import { FaHome, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import { MdRealEstateAgent, MdApartment } from "react-icons/md";
import PropertyDescription from './PropertyDescription';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPropertyDetails } from "@/utils/fetchApi";

export default function PropertyDetails() {
    const params = useParams();
    const id = params?.id;

    const [property, setProperty] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        const fetchProperty = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getPropertyDetails(id);

                if (!cancelled) {
                    setProperty(data.property);
                    setSimilarProperties(data.similar_properties || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Unable to load property details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProperty();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const propertyImages = property
        ? [
            property.main_image,
            ...(Array.isArray(property.gallery_images)
                ? property.gallery_images
                : []),
        ].filter(
            (image, index, images) =>
                typeof image === "string" &&
                image.trim() !== "" &&
                images.indexOf(image) === index
        )
        : [];

    // Same layout as loaded page, so footer/content don't jump (blink)
    if (loading) {
        return (
            <section className="min-h-screen" aria-busy="true" aria-label="Loading property details">
                <div className="container animate-pulse">
                    <div className="my-[40px] flex items-center justify-between gap-3">
                        <div className="h-8 w-72 max-w-full rounded-full bg-gray-200" />
                        <div className="hidden h-8 w-36 rounded-full bg-gray-200 sm:block" />
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="xl:col-span-8 lg:col-span-8 md:col-span-8 col-span-12">
                            <div className="h-[280px] w-full rounded-2xl bg-gray-200 sm:h-[350px]" />
                            <div className="mt-3 grid grid-cols-3 gap-[10px] sm:grid-cols-4 lg:grid-cols-5">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-[4/3] rounded-lg bg-gray-200 ${i >= 3 ? "hidden sm:block" : ""} ${i >= 4 ? "sm:hidden lg:block" : ""}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-[30px] h-24 w-full rounded-lg bg-gray-200" />
                        </div>
                        <div className="xl:col-span-4 lg:col-span-4 md:col-span-4 col-span-12">
                            <div className="h-[460px] w-full rounded-2xl bg-gray-200" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || !property) {
        return (
            <div className="container py-10 text-center">
                <p className="text-red-500">
                    {error || "Property not found."}
                </p>
                <Link href="/buy-properties">
                    Back to Listings
                </Link>
            </div>
        );
    }
    return (
        <>
            <section>
                {/* Breadcrumb section */}
                <div className="container">
                    <div className="my-[40px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Breadcrumb */}
                        <nav aria-label="Breadcrumb">
                            <ol className="flex flex-wrap items-center gap-1.5 text-[13px]">
                                {/* Home */}
                                <li>
                                    <Link
                                        href="/"
                                        className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                            <FaHome className="text-[10px]" />
                                        </span>
                                        Home
                                    </Link>
                                </li>

                                <li aria-hidden="true">
                                    <FaChevronRight className="text-[9px] text-gray-400" />
                                </li>

                                {/* Buy Properties */}
                                <li>
                                    <Link
                                        href="/buy-properties"
                                        className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                            <MdRealEstateAgent className="text-[12px]" />
                                        </span>
                                        Buy Properties
                                    </Link>
                                </li>

                                <li aria-hidden="true">
                                    <FaChevronRight className="text-[9px] text-gray-400" />
                                </li>

                                {/* Current Page */}
                                <li aria-current="page">
                                    <span className="flex items-center gap-2 rounded-full bg-[var(--secondary-color)] px-3.5 py-1.5 font-semibold text-white shadow-md">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-color)] text-white">
                                            <MdApartment className="text-[12px]" />
                                        </span>
                                        {property.title}
                                    </span>
                                </li>
                            </ol>
                        </nav>

                        {/* Back Button */}
                        <Link
                            href="/buy-properties"
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--primary-color)] px-4 py-1.5 text-[13px] font-semibold text-[var(--primary-color)] transition hover:bg-[var(--primary-color)] hover:text-white"
                        >
                            <FaArrowLeft className="text-[11px]" />
                            Back to Listings
                        </Link>
                    </div>

                    {/* Accent line */}
                    <div className="-mt-6 mb-6 h-[3px] w-full rounded-full bg-gradient-to-r from-[var(--primary-color)] via-[var(--primary-color)]/30 to-transparent" />
                </div>
                {/* // Breadcrumb section */}


                {/* Overview Tab */}
                <div className="container">
                    <div className="grid grid-cols-12 gap-4">

                        {/* Slider section */}
                        <div className="xl:col-span-8 lg:col-span-8 md:col-span-8 col-span-12">
                            <PropertyImageSlider images={propertyImages} />

                            {/* highlights */}
                            <section className="w-full mt-[30px]">
                                <div className="mb-2 flex items-center gap-2">
                                    <FaCog className="text-[var(--primary-color)]" size={20} />
                                    <h2 className="text-lg font-bold text-gray-900 mb-0">
                                        Project Highlights
                                    </h2>
                                </div>

                                {/* Highlights Box */}
                                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#f3d9bf] bg-[#fdf3e7] p-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-0 lg:p-4">
                                    {/* Total Area */}
                                    <div className="flex items-center gap-3 lg:border-r lg:border-[#f0cfae] lg:px-3 lg:first:pl-0">
                                        <FaRulerCombined
                                            className="shrink-0 text-[var(--primary-color)]"
                                            size={28}
                                        />
                                        <div>
                                            <p className="text-sm font-bold leading-tight text-[var(--secondary-color)] mb-2">
                                                10 Acres
                                            </p>
                                            <p className="text-xs text-gray-600 mb-0">Total Area</p>
                                        </div>
                                    </div>

                                    {/* Configurations */}
                                    <div className="flex items-center gap-3 lg:border-r lg:border-[#f0cfae] lg:px-3">
                                        <FaBed className="shrink-0 text-[var(--primary-color)]" size={28} />
                                        <div>
                                            <p className="text-sm font-bold leading-tight text-[var(--secondary-color)] mb-2">
                                                2, 3 &amp; 4 BHK
                                            </p>
                                            <p className="text-xs text-gray-600 mb-0">Configurations</p>
                                        </div>
                                    </div>

                                    {/* Total Towers */}
                                    <div className="flex items-center gap-3 lg:border-r lg:border-[#f0cfae] lg:px-3">
                                        <FaCity className="shrink-0 text-[var(--primary-color)]" size={28} />
                                        <div>
                                            <p className="text-sm font-bold leading-tight text-[var(--secondary-color)] mb-2">
                                                6 Towers
                                            </p>
                                            <p className="text-xs text-gray-600 mb-0">Total Towers</p>
                                        </div>
                                    </div>

                                    {/* Total Units */}
                                    <div className="flex items-center gap-3 lg:px-3">
                                        <FaBuilding
                                            className="shrink-0 text-[var(--primary-color)]"
                                            size={28}
                                        />
                                        <div>
                                            <p className="text-sm font-bold leading-tight text-[var(--secondary-color)] mb-2">
                                                650 Units
                                            </p>
                                            <p className="text-xs text-gray-600 mb-0">Total Units</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            {/* // highlights */}
                        </div>
                        {/* // Slider section */}

                        {/* Form section */}
                        <div className="xl:col-span-4 lg:col-span-4 md:col-span-4 col-span-12">
                            <PropertySideForm propertyId={id} />
                        </div>
                        {/* // Form section */}
                    </div>
                </div>
                {/* // Overview Tab */}


                {/* Property description */}
                <PropertyDescription property={property} />
                {/* // Property description */}


                <div className="min-h-screen bg-white">
                    <div className="container py-8">
                        <div className="flex flex-col gap-8 lg:flex-row">
                            {/* ---------------- Main Content ---------------- */}
                            <div className="flex-1">
                                {/* Top badges + actions */}
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-md text-[var(--primary-color)] px-2.5 py-1 text-xs font-semibold bg-[#FFECD3] uppercase">
                                            {property.configuration}
                                        </span>
                                        <span className="rounded-md bg-[#F3F7FC] px-2.5 py-1 text-xs font-semibold text-emerald-500 uppercase">
                                            {property.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="mb-0 text-[#768198] text-[12px]">     {property.created_at
                                            ? new Date(property.created_at).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                }
                                            )
                                            : "Date unavailable"}</p>
                                    </div>
                                </div>

                                {/* Title + location */}
                                <h1 className="text-[28px] font-bold text-[var(--text-color1)]">
                                    {property.title}
                                </h1>

                                {/* Price */}
                                <div className="mt-2">
                                    <p className="text-3xl font-bold text-[var(--primary-color)]">    {property.price != null
                                        ? Number(property.price).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            maximumFractionDigits: 0,
                                        })
                                        : "Price on Request"}</p>
                                    <p className="mt-1 text-sm text-[#62748E]">
                                        {[property.location, property.city, property.state]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>

                                {/* Specs row */}
                                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                                    {/* <div className="flex items-center gap-3">
                                        <FaRulerCombined className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Carpet Area</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">1,230 sq. ft.</p>
                                        </div>
                                    </div> */}
                                    <div className="flex items-center gap-3">
                                        <FaVectorSquare className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Super Area</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">{property.super_area != null
                                                ? `${Number(property.super_area).toLocaleString("en-IN")} sq. ft.`
                                                : "Not specified"}</p>
                                        </div>
                                    </div>
                                        {/* Configuration / Bedrooms */}
    <div className="flex items-center gap-3">
        <FaVectorSquare className="shrink-0 text-[20px] text-[var(--primary-color)]" />
        <div>
            <p className="text-[14px] text-[#768198] mb-2">
                Configuration
            </p>
            <p className="text-[16px] font-bold text-[#202D47] mb-0">
                {property.configuration ||
                    (property.bedrooms != null
                        ? `${property.bedrooms} BHK`
                        : "Not specified")}
            </p>
        </div>
    </div>
                                    <div className="flex items-center gap-3">
                                        <FaBuilding className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Floor</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">  {property.floor != null
                    ? `${property.floor}${
                          property.total_floors != null
                              ? ` (out of ${property.total_floors})`
                              : ""
                      }`
                    : "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaCar className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Parking</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0"> {property.parking || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaCompass className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Facing</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">  {property.facing}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaFileSignature className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Type of Ownership</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0"> {property.ownership || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaCouch className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Furnishing</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">{property.furnishing || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaCity className="shrink-0 text-[20px] text-[var(--primary-color)]" />
                                        <div>
                                            <p className="text-[14px] text-[#768198] mb-2">Project</p>
                                            <p className="text-[16px] font-bold text-[#202D47] mb-0">  {property.project || "Not specified"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="gap-4">
                                    <Link href="#" className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] transition-colors text-white text-sm font-semibold rounded-lg px-8 py-3 w-full lg:w-auto shrink-0 mr-5">
                                        Contact Seller
                                    </Link>
                                    <Link href="#" className="border-1 border-orange-600 hover:bg-[var(--secondary-color)] hover:text-white transition-colors text-[var(--primary-color)] text-sm font-semibold rounded-lg px-8 py-3 w-full lg:w-auto shrink-0">
                                        Get Phone No.
                                    </Link>
                                </div>


                                {/* <AboutPropertyDetail /> */}

                                {/* <AmenitiesGallery /> */}

                                <FloorLocation property={property}/>



                                {/* Seller / Agent Information */}
                                {/* <div className="mt-10 border-t border-gray-100 pt-8 pb-4">
                                    <h2 className="mb-3 text-lg font-bold text-gray-900">
                                        Seller / Agent Information
                                    </h2>
                                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src="/assets/img/aarav.png"
                                                alt="Aarav Gupta"
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                                    Aarav Gupta
                                                </p>
                                                <p className="text-xs text-gray-500 mb-0">
                                                    Certified Property Consultant · 8 years experience
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 rounded-lg text-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]"
                                        >
                                            <FiPhone className="h-4 w-4" />
                                            Contact Agent
                                        </button>
                                    </div>
                                </div> */}

                                <SimilarProperties properties={similarProperties} />

                            </div>

                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
