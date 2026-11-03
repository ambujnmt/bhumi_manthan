import React from 'react'
import { Link } from "@heroui/react";
import { FaArrowRight } from "react-icons/fa";
import { FiMapPin, FiNavigation } from "react-icons/fi";
import { formatDistance, formatPropertyPrice, imageFallback } from "../../../../utils/formatPrice";
import SectionSkeleton from "./SectionSkeleton";
import WishlistButton from "../../../Common/WishlistButton";

const badgeColors = {
    FEATURED: "bg-[#22C55E]",
    PREMIUM: "bg-[var(--primary-color)]",
    NEW: "bg-[#3B82F6]",
    "ULTRA LUXURY": "bg-[#D4AF37]",
};

// Home shows one row of cards; "View All Properties" opens the full list
const MAX_ON_HOME = 4;

// properties + nearby come from Body (useHomeListings)
export default function FeaturedProperties({ loading = false, properties = [], nearby = false }) {
    if (loading) {
        return <SectionSkeleton cards={4} />;
    }

    if (properties.length === 0) {
        return null;
    }

    return (
        <>
            <section className="container-fluid mx-[15px]">
                <div className="grid grid-cols-12 gap-4 mt-[60px]">
                    <div className="col-span-1"></div>
                    <div className="col-span-12 xl:col-span-10 lg:col-span-10 gap-4 xl:flex lg:flex block items-center justify-between">
                        <div className="">
                            <h2 className="text-[28px] font-bold text-[var(--text-color1)]">
                                {nearby ? "Featured Properties Near You" : "Featured Properties"}
                            </h2>
                            <p className="text-[16px] text-[var(--text-color2)] mb-4">
                                {nearby
                                    ? "Handpicked listings closest to your current location"
                                    : "Handpicked residential, commercial and land listings across prime Indian micro-markets"}
                            </p>
                        </div>
                        <div className="">
                            <Link href="/web/property/searchProperties?featured=1">
                                <h6 className="text-[var(--text-color3)] text-[15px] font-semibold flex items-center hover:text-[var(--primary-color)]">View All Properties &nbsp; <FaArrowRight /></h6>
                            </Link>
                        </div>
                    </div>
                    <div className="col-span-1"></div>
                </div>

                <div className="grid grid-cols-12 gap-4 mt-[30px]">
                    <div className="col-span-12 xl:col-span-1 lg:col-span-1 md:col-span-6">
                        <div className="bg-[var(--secondary-color)] p-2 rounded-lg">
                            <h6 className="text-[var(--primary-color)] text-[10px] mb-[10px] text-center">LOW INTEREST</h6>
                            <h3 className="text-white text-[24px] font-bold leading-[33px] mb-[10px] text-center">HOME LOAN</h3>
                            <p className="text-white/80 text-[10px] mb-[8px] text-center">Interest Rate</p>
                            <h2 className="text-[var(--primary-color)] text-[21px] font-bold text-center">8.40%*</h2>
                            <p className="text-white/80 text-[10px] mb-[8px] text-center">p.a.</p>
                            <div className="border border-slate-500 w-full my-[15px]"></div>
                            <p className="text-white/80 text-[10px] mb-[5px]">Quick Approval</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Lowest Interest</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Minimal Docs</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Trusted Partners</p>
                            <Link href="#" className="mt-[20px] flex items-center hover:bg-[var(--secondary-color)] text-white px-1 py-2 rounded-lg border text-[11px] font-medium leading-[100%] bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out text-center">
                                APPLY NOW
                            </Link>
                            <img src="/assets/img/property-img.png" alt="Featured Properties" className="w-full h-[70px] object-cover mt-4 rounded-lg" />
                        </div>
                    </div>
                    <div className="col-span-12 xl:col-span-10 lg:col-span-10 gap-4">
                        <div className="grid grid-cols-12 gap-4">
                            {properties.slice(0, MAX_ON_HOME).map((property) => {
                                const badge = (property.badge || (property.is_featured ? "FEATURED" : "NEW")).toUpperCase();
                                const distance = formatDistance(property.distance_km);
                                const place = [property.location, property.city].filter(Boolean).join(", ");

                                return (
                                    <div key={property.slug} className="col-span-12 xl:col-span-3 lg:col-span-3 md:col-span-6">
                                        <Link
                                            href={`/web/propertyDetail/${property.slug}`}
                                            className="block bg-white rounded-lg shadow-md overflow-hidden relative mb-4 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={property.main_image || "/assets/img/prop-1.png"}
                                                    onError={imageFallback("/assets/img/prop-1.png")}
                                                    alt={property.title}
                                                    className="w-full h-48 object-cover"
                                                />
                                                <div className={`absolute top-[10px] left-[10px] text-white px-2 py-1 rounded-md ${badgeColors[badge] || "bg-[var(--primary-color)]"}`}>
                                                    <p className="text-[11px] font-bold mb-0">{badge}</p>
                                                </div>
                                                <WishlistButton propertyId={property.id} className="absolute top-[10px] right-[10px]" />
                                                {distance && (
                                                    <div className="absolute bottom-[10px] left-[10px] inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                                                        <FiNavigation size={10} /> {distance}
                                                    </div>  
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-[16px] font-semibold text-[var(--text-color1)] line-clamp-1">{property.title}</h3>
                                                <p className="text-[12px] text-[var(--text-color2)] mt-2 flex items-center">
                                                    <FiMapPin className="shrink-0" />&nbsp; <span className="line-clamp-1">{place || "-"}</span>
                                                </p>
                                                <h5 className="text-[18px] font-bold text-[var(--primary-color)] mt-1">{formatPropertyPrice(property.price)}</h5>
                                                <div className="border border-slate-200 w-full my-[9px]"></div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-[11px] text-[var(--text-color2)]">
                                                        {property.super_area ? `${Number(property.super_area)} Sq.Ft.` : property.configuration || "-"}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-color1)]">{property.status || property.property_type || ""}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                            <div className="col-span-12">
                                <Link href="/web/property/searchProperties?featured=1" className="flex items-center justify-center hover:bg-[var(--secondary-color)] text-[var(--secondary-color)] px-3 py-4 rounded-lg border text-[15px] font-medium leading-[100%] border-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out w-max mx-auto">
                                    View More Properties
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 xl:col-span-1 lg:col-span-1 md:col-span-6">
                        <div className="bg-[var(--secondary-color)] p-2 rounded-lg">
                            <h6 className="text-[var(--primary-color)] text-[10px] mb-[10px] text-center">GET INSTANT</h6>
                            <h3 className="text-white text-[24px] font-bold leading-[33px] mb-[10px] text-center">GOLD LOAN</h3>
                            <p className="text-white/80 text-[10px] mb-[8px] text-center">Loan Upto</p>
                            <h2 className="text-[var(--primary-color)] text-[21px] font-bold text-center">₹20 Lakhs*</h2>
                            <p className="text-white/80 text-[10px] mb-[8px] text-center">Instant Disbursal</p>
                            <div className="border border-slate-500 w-full my-[15px]"></div>
                            <p className="text-white/80 text-[10px] mb-[5px]">Quick Disbursal</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Minimal Documents</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Lowest Interest</p>
                            <p className="text-white/80 text-[10px] mb-[5px]">Trusted Partners</p>
                            <Link href="#" className="mt-[20px] flex items-center hover:bg-[var(--secondary-color)] text-white px-1 py-2 rounded-lg border text-[11px] font-medium leading-[100%] bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out text-center">
                                APPLY NOW
                            </Link>
                            <img src="/assets/img/gold-loan.png" alt="Featured Properties" className="w-full h-[70px] object-cover mt-4 rounded-lg" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
