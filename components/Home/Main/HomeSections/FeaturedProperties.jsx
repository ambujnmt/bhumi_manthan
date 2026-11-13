import React, { useEffect, useRef, useState } from 'react'
import { Link } from "@heroui/react";
import { FaArrowRight } from "react-icons/fa";
import { FiMapPin, FiNavigation } from "react-icons/fi";
import Pagination from "../../../Common/Pagination";
import { cardSpecs, priceInfo, propertyTypeLabel } from "../../../Innerpages/PropertyDetails/PropertySpecs";
import { formatDistance, formatPropertyPrice, imageFallback } from "../../../../utils/formatPrice";
import WishlistButton from "../../../Common/WishlistButton";
import AdMedia from "../../../Common/Ads/AdMedia";
import { AD_PLACEMENTS, fetchAd, peekAd } from "../../../../utils/ads";

const knownHomeAds = () => ({
    left: peekAd(AD_PLACEMENTS.HOME_FEATURED_LEFT) || null,
    right: peekAd(AD_PLACEMENTS.HOME_FEATURED_RIGHT) || null,
});

const badgeColors = {
    FEATURED: "bg-[#22C55E]",
    PREMIUM: "bg-[var(--primary-color)]",
    NEW: "bg-[#3B82F6]",
    "ULTRA LUXURY": "bg-[#D4AF37]",
};

// Home shows 8 cards (2 rows) per page; "View All Properties" opens the full list
const PER_PAGE = 8;

// Card photo: same simple <img> as before (fixed h-48, so the card never changes size).
// First row loads first (eager), the rest when needed (lazy).
function CardImage({ src, alt, eager }) {
    return (
        <img
            src={src}
            onError={imageFallback("/assets/img/prop-1.png")}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-48 object-cover bg-gray-100"
        />
    );
}

// Same size as a real card (image h-48 + the same text lines)
function CardSkeleton() {
    return (
        <div className="mb-4 flex w-full animate-pulse flex-col overflow-hidden rounded-lg bg-white shadow-md" aria-hidden="true">
            <div className="h-48 w-full bg-gray-200" />
            <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                <div className="mb-0.5 h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-[22px] w-3/4 rounded bg-gray-200" />
                <div className="mt-1 h-[18px] w-1/2 rounded bg-gray-100" />
                <div className="mt-1 h-[23px] w-1/3 rounded bg-gray-200" />
                <div className="my-2 w-full border-t border-slate-200" />
                <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
        </div>
    );
}

// properties + nearby come from Body (useHomeListings)
export default function FeaturedProperties({ loading = false, properties = [], nearby = false }) {
    const [page, setPage] = useState(1);
    const sectionRef = useRef(null);

    // New list (location changed) -> back to first page
    useEffect(() => {
        setPage(1);
    }, [properties]);

    // Side ads (Admin -> Ads, "Home (Featured Properties)"). Only set ads show, no default card.
    // First render: ads from the server (pages/index.jsx) / cache -> layout right away, no jump
    const [ads, setAds] = useState(knownHomeAds);

    useEffect(() => {
        let active = true;

        Promise.all([fetchAd(AD_PLACEMENTS.HOME_FEATURED_LEFT), fetchAd(AD_PLACEMENTS.HOME_FEATURED_RIGHT)]).then(([left, right]) => {
            // Same ads -> keep the same state (no re-render, image does not reload)
            if (active) setAds((previous) => (previous.left === left && previous.right === right ? previous : { left, right }));
        });

        return () => {
            active = false;
        };
    }, []);

    // No ad on either side -> same width as the search box (container), no side columns
    const withAds = Boolean(ads.left || ads.right);

    // Loading: same section + skeleton cards (nothing moves when data arrives)
    if (!loading && properties.length === 0) {
        return null;
    }

    const totalPages = Math.max(1, Math.ceil(properties.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pageProperties = properties.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const goToPage = (value) => {
        setPage(Math.min(Math.max(value, 1), totalPages));

        // Keep the section in view when the new page has fewer rows
        const top = sectionRef.current?.getBoundingClientRect().top;
        if (top !== undefined && top < 0) {
            sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };


    return (
        <>
            {/* Phones / tablets: same width as other pages (container), ads included.
                Desktop with ads: wider (full width, 27px each side) so the side ad columns fit */}
            <section ref={sectionRef} className={`container ${withAds ? "lg:!max-w-none lg:!px-[27px]" : ""} scroll-mt-28`}>
                {/* Phone: less space above the heading; empty side columns only on lg+ (they made an empty row) */}
                <div className="grid grid-cols-12 gap-4 mt-6 lg:mt-[60px]">
                    {withAds && <div className="hidden lg:block lg:col-span-1"></div>}
                    <div className={`col-span-12 ${withAds ? "xl:col-span-10 lg:col-span-10" : ""} gap-4 xl:flex lg:flex block items-center justify-between`}>
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
                    {withAds && <div className="hidden lg:block lg:col-span-1"></div>}
                </div>

                <div className="grid grid-cols-12 gap-4 mt-4 lg:mt-[30px]">
                    {/* Left ad column (only when a side has an ad). Phones: shown only with a mobile image (full width); desktop: kept so cards stay centred */}
                    {withAds && (
                        <div className={`${ads.left?.mobile_image ? "col-span-12" : "hidden"} lg:col-span-1 lg:block xl:col-span-1`}>
                            {ads.left && <AdMedia ad={ads.left} />}
                        </div>
                    )}
                    <div className={`col-span-12 ${withAds ? "xl:col-span-10 lg:col-span-10" : ""} gap-4`}>
                        <div className="grid grid-cols-12 gap-4">
                            {loading && Array.from({ length: PER_PAGE }).map((_, index) => (
                                <div key={`skeleton-${index}`} className="col-span-12 flex xl:col-span-3 lg:col-span-3 md:col-span-6">
                                    <CardSkeleton />
                                </div>
                            ))}

                            {!loading && pageProperties.map((property, index) => {
                                const badge = (property.badge || (property.is_featured ? "FEATURED" : "NEW")).toUpperCase();
                                const distance = formatDistance(property.distance_km);
                                const place = [property.location, property.city].filter(Boolean).join(", ");

                                return (
                                    <div key={property.slug} className="col-span-12 flex xl:col-span-3 lg:col-span-3 md:col-span-6">
                                        <Link
                                            href={`/web/propertyDetail/${property.slug}`}
                                            className="relative mb-4 flex w-full flex-col overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
                                        >
                                            <div className="relative">
                                                <CardImage
                                                    src={property.main_image || "/assets/img/prop-1.png"}
                                                    alt={property.title}
                                                    eager={index < 4}
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
                                            <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                                                {/* Type: "Shop" / "PG" / "3 BHK Apartment" (+ For Rent / Lease) */}
                                                <div className="mb-0.5 flex items-center justify-between gap-2">
                                                    <span className="line-clamp-1 text-[12px] font-semibold text-[var(--primary-color)]">
                                                        {propertyTypeLabel(property)}
                                                    </span>
                                                    {property.listing_type && property.listing_type !== "Sale" && (
                                                        <span className="shrink-0 rounded bg-[#EEF4FB] px-1.5 py-[1px] text-[10px] font-semibold text-[var(--secondary-color)]">
                                                            For {property.listing_type}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="mb-0 text-[16px] font-semibold leading-snug text-[var(--text-color1)] line-clamp-1">{property.title}</h3>
                                                <p className="mb-0 mt-1 flex items-center text-[12px] text-[var(--text-color2)]">
                                                    <FiMapPin className="shrink-0" />&nbsp; <span className="line-clamp-1">{place || "-"}</span>
                                                </p>
                                                <h5 className="mb-0 mt-1 text-[18px] font-bold leading-tight text-[var(--primary-color)]">
                                                    {formatPropertyPrice(property.price)}
                                                    {property.price && priceInfo(property).perMonth && (
                                                        <span className="text-[12px] font-medium text-[var(--text-color2)]"> / month</span>
                                                    )}
                                                </h5>
                                                {/* pushes divider + facts to the bottom, so every card in a row is the same height */}
                                                <div className="mt-auto" />
                                                <div className="my-2 w-full border-t border-slate-200"></div>
                                                {/* Facts by type: beds / baths / area, plot area, washrooms, PG sharing ... */}
                                                <div className="flex min-h-[16px] flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-color2)]">
                                                    {cardSpecs(property).length > 0 ? (
                                                        cardSpecs(property).map(({ icon: Icon, text }) => (
                                                            <span key={text} className="flex items-center gap-1">
                                                                <Icon className="shrink-0" size={11} aria-hidden="true" /> {text}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span>{property.status || "-"}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                            <div className="col-span-12 flex flex-wrap items-center justify-center gap-4">
                                <Link href="/web/property/searchProperties?featured=1" className="flex items-center justify-center hover:bg-[var(--secondary-color)] text-[var(--secondary-color)] px-3 py-4 rounded-lg border text-[15px] font-medium leading-[100%] border-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out w-max">
                                    View More Properties
                                </Link>

                                {/* Pagination (8 per page) */}
                                {!loading && (
                                    <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} label="Featured properties pages" compact />
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Right ad column. Phones: -mb-12 pulls the next section (mt-[60px] py-10) closer, so no big gap under the ad */}
                    {withAds && (
                        <div className={`${ads.right?.mobile_image ? "col-span-12 -mb-12" : "hidden"} lg:col-span-1 lg:mb-0 lg:block xl:col-span-1`}>
                            {ads.right && <AdMedia ad={ads.right} />}
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}
