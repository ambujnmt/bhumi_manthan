import React from 'react'
import { FaArrowRight, FaShieldAlt, FaParking, FaDumbbell, FaBed, FaVectorSquare, FaSwimmer, FaTree, FaCheck } from "react-icons/fa";
import { FiNavigation } from "react-icons/fi";
import { formatDistance, formatPropertyPrice, imageFallback } from "../../../../utils/formatPrice";
import SectionSkeleton from "./SectionSkeleton";
import WishlistButton from "../../../Common/WishlistButton";
import { Link } from "@heroui/react";

// Amenity name -> icon (anything else gets a check mark)
const amenityIcon = (name) => {
    const text = String(name).toLowerCase();

    if (text.includes("secur") || text.includes("cctv")) return FaShieldAlt;
    if (text.includes("park")) return FaParking;
    if (text.includes("gym") || text.includes("fitness")) return FaDumbbell;
    if (text.includes("pool") || text.includes("swim")) return FaSwimmer;
    if (text.includes("garden") || text.includes("lawn")) return FaTree;

    return FaCheck;
};

// Description is HTML from the editor -> plain text for the card
const plainText = (html) =>
    String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// properties + nearby come from Body (useHomeListings)
export default function PremiumLuxury({ loading = false, properties = [], nearby = false }) {
    if (loading) {
        return <SectionSkeleton cards={3} colClass="col-span-12 md:col-span-6 lg:col-span-4" imageHeight="h-56" centerTitle />;
    }

    // Hide section until admin marks a property as luxury
    if (properties.length === 0) {
        return null;
    }

    return (
        <section className="mt-[60px]">
            <div className="container">
                {/* Heading left, "View All" right (same as Featured Properties) */}
                <div className="mb-6 gap-4 lg:flex items-center justify-between">
                    <div>
                        <h2 className="text-[28px] font-bold text-[var(--text-color1)]">
                            {nearby ? "Premium Luxury Listings Near You" : "Premium Luxury Listings"}
                        </h2>
                        <p className="text-[16px] text-[var(--text-color2)] mb-4">
                            Exquisite design, premier addresses and world-class amenities for sophisticated living
                        </p>
                    </div>

                    <Link href="/web/property/searchProperties?luxury=1" className="shrink-0">
                        <h6 className="text-[var(--text-color3)] text-[15px] font-semibold flex items-center hover:text-[var(--primary-color)]">
                            View All Properties &nbsp; <FaArrowRight />
                        </h6>
                    </Link>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {properties.map((property) => {
                        const amenities = (Array.isArray(property.amenities) ? property.amenities : [])
                            .filter((item) => typeof item === "string" && item.trim())
                            .slice(0, 3);
                        const distance = formatDistance(property.distance_km);
                        const description = plainText(property.description);

                        return (
                            <div key={property.slug} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                                <Link
                                    href={`/web/propertyDetail/${property.slug}`}
                                    className="block bg-white rounded-2xl shadow-md overflow-hidden border-2 border-gray-200 mx-auto h-full hover:shadow-lg transition-shadow"
                                >
                                    {/* Image */}
                                    <div className="relative">
                                        <img
                                            src={property.main_image || "/assets/img/PremiumLuxury1.png"}
                                            onError={imageFallback("/assets/img/PremiumLuxury1.png")}
                                            alt={property.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <WishlistButton propertyId={property.id} className="absolute top-[10px] right-[10px]" />
                                        {distance && (
                                            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                                                <FiNavigation size={10} /> {distance}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <span className="inline-block bg-[#D4AF37] text-white text-[11px] font-bold px-3 py-1 rounded-md mb-3 uppercase">
                                            {property.badge || "Ultra Luxury"}
                                        </span>

                                        <h2 className="text-[20px] font-bold text-[var(--text-color1)] line-clamp-1">
                                            {property.title}
                                        </h2>
                                        <p className="text-[13px] text-[var(--text-color2)] mt-0.5">
                                            {[property.location, property.city].filter(Boolean).join(", ")}
                                        </p>

                                        {description && (
                                            <p className="text-[14px] text-[var(--text-color1)] mt-2 leading-relaxed line-clamp-3">
                                                {description}
                                            </p>
                                        )}

                                        {/* Amenities */}
                                        {amenities.length > 0 && (
                                            <div className="flex gap-6 mt-4">
                                                {amenities.map((amenity) => {
                                                    const Icon = amenityIcon(amenity);

                                                    return (
                                                        <div key={amenity} className="flex flex-col items-center gap-1">
                                                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-black">
                                                                <Icon size={14} />
                                                            </div>
                                                            <span className="text-[14px] text-black">{amenity}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <hr className="my-4 border-gray-100" />

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[var(--primary-color)] font-bold text-[20px]">
                                                {formatPropertyPrice(property.price)}
                                            </span>
                                            <div className="flex items-center gap-3 text-[var(--text-color2)] text-[13px]">
                                                {(property.configuration || property.bedrooms) && (
                                                    <span className="flex items-center gap-1">
                                                        <FaBed size={13} /> {property.configuration || `${property.bedrooms} BHK`}
                                                    </span>
                                                )}
                                                {property.super_area && (
                                                    <span className="flex items-center gap-1">
                                                        <FaVectorSquare size={12} /> {Number(property.super_area)} Sq.Ft.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* Full luxury list (no limit) on the search page */}
                <div className="mt-6 flex justify-center">
                    <Link
                        href="/web/property/searchProperties?luxury=1"
                        className="flex items-center justify-center hover:bg-[var(--secondary-color)] text-[var(--secondary-color)] px-3 py-4 rounded-lg border text-[15px] font-medium leading-[100%] border-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out w-max"
                    >
                        View All Luxury Properties
                    </Link>
                </div>
            </div>
        </section>
    )
}
