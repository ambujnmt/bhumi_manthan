import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { FiHome, FiMapPin, FiMessageSquare, FiSend } from "react-icons/fi";
import { getMyEnquiries } from "../../../utils/fetchApi";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";

const FALLBACK_IMAGE = "/assets/img/prop-1.png";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "-";

/**
 * Buyer dashboard "My Enquiries": properties I sent an enquiry for (Enquire Now form), latest first.
 */
export default function MyEnquiries() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyEnquiries()
            .then((res) => setData(res.data))
            .catch((err) => setError(err?.message || "Enquiries could not be loaded."));
    }, []);

    const loading = !data && !error;
    const enquiries = data?.enquiries || [];
    const summary = data?.summary;

    return (
        <div>
            <div className="mb-[16px]">
                <h1 className="mb-0 text-2xl font-bold text-[var(--secondary-color)]">My Enquiries</h1>
                <p className="mb-0 mt-1 text-sm text-[#62748E]">Properties you asked about using &ldquo;Enquire Now&rdquo;.</p>
            </div>

            {/* Counts */}
            {summary && enquiries.length > 0 && (
                <div className="mb-[16px] grid grid-cols-2 gap-[12px] sm:max-w-md">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-[14px] shadow-sm">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[var(--primary-color)]">
                            <FiHome size={18} />
                        </span>
                        <div>
                            <p className="mb-0 text-xl font-extrabold leading-none text-[var(--secondary-color)]">{summary.properties_count}</p>
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">{summary.properties_count === 1 ? "Property" : "Properties"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-[14px] shadow-sm">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FB] text-[var(--secondary-color)]">
                            <FiSend size={17} />
                        </span>
                        <div>
                            <p className="mb-0 text-xl font-extrabold leading-none text-[var(--secondary-color)]">{summary.total_enquiries}</p>
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">{summary.total_enquiries === 1 ? "Enquiry sent" : "Enquiries sent"}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-[12px]">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-[120px] animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-[20px] text-red-600">{error}</div>
            ) : enquiries.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-[20px] py-[56px] text-center shadow-sm">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[var(--primary-color)]">
                        <FiMessageSquare size={24} />
                    </span>
                    <p className="mb-0 mt-3 text-lg font-bold text-[var(--secondary-color)]">No enquiries yet</p>
                    <p className="mb-0 mt-1 max-w-sm text-sm text-[#62748E]">
                        Open a property and use &ldquo;Enquire Now&rdquo; to ask the owner about price, visit or details.
                    </p>
                    <NextLink
                        href="/web/property/searchProperties"
                        className="mt-4 rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:opacity-90"
                    >
                        Browse Properties
                    </NextLink>
                </div>
            ) : (
                <div className="space-y-[12px]">
                    {enquiries.map((enquiry) => {
                        const property = enquiry.property;
                        const place = [property?.location, property?.city].filter(Boolean).join(", ");
                        const canOpen = property?.is_active && property?.slug;
                        const details = [
                            enquiry.interested_in && ["Interested in", enquiry.interested_in],
                            enquiry.budget && ["Budget", enquiry.budget],
                        ].filter(Boolean);

                        const Wrapper = canOpen ? NextLink : "div";
                        const wrapperProps = canOpen
                            ? { href: `/web/propertyDetail/${property.slug}`, className: "no-underline" }
                            : {};

                        return (
                            <div key={enquiry.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                <div className="flex flex-col gap-[14px] p-[14px] sm:flex-row">
                                    <Wrapper {...wrapperProps}>
                                        <img
                                            src={property?.main_image || FALLBACK_IMAGE}
                                            onError={imageFallback(FALLBACK_IMAGE)}
                                            alt={enquiry.property_title || "Property"}
                                            loading="lazy"
                                            className="h-[150px] w-full shrink-0 rounded-lg bg-gray-100 object-cover sm:h-[110px] sm:w-[160px]"
                                        />
                                    </Wrapper>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                {canOpen ? (
                                                    <NextLink
                                                        href={`/web/propertyDetail/${property.slug}`}
                                                        className="line-clamp-1 text-[16px] font-bold text-[var(--secondary-color)] no-underline hover:text-[var(--primary-color)]"
                                                    >
                                                        {enquiry.property_title || "General enquiry"}
                                                    </NextLink>
                                                ) : (
                                                    <p className="mb-0 line-clamp-1 text-[16px] font-bold text-[var(--secondary-color)]">
                                                        {enquiry.property_title || "General enquiry"}
                                                    </p>
                                                )}
                                                {place && (
                                                    <p className="mb-0 mt-0.5 flex items-center gap-1 text-[13px] text-[#62748E]">
                                                        <FiMapPin size={12} className="shrink-0" /> <span className="line-clamp-1">{place}</span>
                                                    </p>
                                                )}
                                            </div>
                                            {property?.price && (
                                                <p className="mb-0 shrink-0 text-[17px] font-bold text-[var(--primary-color)]">
                                                    {formatPropertyPrice(property.price)}
                                                </p>
                                            )}
                                        </div>

                                        {property && !property.is_active && (
                                            <span className="mt-1.5 inline-block rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                                No longer listed
                                            </span>
                                        )}

                                        {details.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {details.map(([label, value]) => (
                                                    <span key={label} className="rounded-full bg-[#EEF4FB] px-2.5 py-0.5 text-[12px] text-[var(--secondary-color)]">
                                                        {label}: <b>{value}</b>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {enquiry.message && (
                                            <p className="mb-0 mt-2 line-clamp-2 text-[13px] italic text-[#3B4A63]" title={enquiry.message}>
                                                &ldquo;{enquiry.message}&rdquo;
                                            </p>
                                        )}

                                        <p className="mb-0 mt-2 text-[12px] text-[#94A3B8]">Sent on {formatDate(enquiry.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
