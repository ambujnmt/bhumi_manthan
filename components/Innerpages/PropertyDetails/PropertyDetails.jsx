"use client";

import { Link } from '@heroui/react'
import { FaBed, FaBath, FaCar } from "react-icons/fa";
import FloorLocation from './FloorLocation';
import PropertyImageSlider from './PropertyImageSlider';
import SimilarProperties from './SimilarProperties';
import PropertySideForm from './PropertySideForm';
import AgentCard from './AgentCard';
import PropertySpecs, { priceInfo } from './PropertySpecs';
import TopAgents from '../../Home/Main/HomeSections/TopAgents';
import { resolveVideo } from './PropertyVideo';
import WishlistButton from '../../Common/WishlistButton';
import CompareButton from '../../Common/CompareButton';
import { FaCog, FaRulerCombined, FaCity, FaBuilding, } from "react-icons/fa";
import { FaVectorSquare, FaCompass, FaFileSignature, FaCouch } from "react-icons/fa";
import { FaHome, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import { MdRealEstateAgent, MdApartment } from "react-icons/md";
import { BsChatDotsFill } from "react-icons/bs";
import PropertyDescription from './PropertyDescription';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addRecentlyViewed, getPropertyDetails } from "@/utils/fetchApi";
import {
    clearPostLoginRedirect,
    isBookingAfterLogin,
    rememberBookingAfterLogin,
    rememberPostLoginRedirect,
} from "@/utils/postLoginRedirect";
import { showToast } from "@/store/toast";
import { useUser } from "@/context/UserContext";
import { BookAppointmentButton } from "@/modules/appointments";
import MetaTags from "../../Head/MetaTags";
import { buildPropertySeo } from "@/utils/seo";
import { FiCheck, FiCopy } from "react-icons/fi";
import SideAds from "../../Common/Ads/SideAds";

// "ID: PROP-XXXX [copy]" pill. Clipboard API, with a fallback for http / older browsers.
// variant "crumb": small breadcrumb pill, whole pill copies on click.
function PropertyIdCopy({ id, variant = "default" }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2000);

        return () => clearTimeout(timer);
    }, [copied]);

    const copy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(id);
            } else {
                const field = document.createElement("textarea");
                field.value = id;
                field.setAttribute("readonly", "");
                field.style.position = "fixed";
                field.style.opacity = "0";
                document.body.appendChild(field);
                field.select();
                document.execCommand("copy");
                field.remove();
            }

            setCopied(true);
            showToast("Property ID copied.");
        } catch {
            showToast("Could not copy. Please copy the ID manually.", "error");
        }
    };

    if (variant === "crumb") {
        return (
            <button
                type="button"
                onClick={copy}
                title={copied ? "Copied" : "Click to copy Property ID"}
                aria-label={copied ? "Property ID copied" : `Property ID ${id}, click to copy`}
                className={`group flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-semibold shadow-sm transition ${
                    copied
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-[#f3d9bf] bg-[#fdf3e7] text-[var(--secondary-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                }`}
            >
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#62748E]">ID</span>
                <span className="tracking-wide">{id}</span>
                {copied ? (
                    <FiCheck size={13} aria-hidden="true" />
                ) : (
                    <FiCopy size={13} className="text-[var(--primary-color)] opacity-70 group-hover:opacity-100" aria-hidden="true" />
                )}
            </button>
        );
    }

    return (
        <div className="flex items-center overflow-hidden rounded-lg border border-[#f3d9bf] bg-white text-sm shadow-sm">
            <span className="whitespace-nowrap px-3 py-1.5 text-gray-500">
                Property ID:{" "}
                <span className="select-all font-bold tracking-wide text-[var(--secondary-color)]">{id}</span>
            </span>
            <button
                type="button"
                onClick={copy}
                aria-label={copied ? "Property ID copied" : `Copy Property ID ${id}`}
                title={copied ? "Copied" : "Copy Property ID"}
                className={`flex items-center gap-1.5 self-stretch border-l border-[#f3d9bf] px-3 text-xs font-semibold transition-colors ${
                    copied ? "bg-green-50 text-green-700" : "bg-[#fdf3e7] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white"
                }`}
            >
                {copied ? <FiCheck size={14} aria-hidden="true" /> : <FiCopy size={14} aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

export default function PropertyDetails({ clientSeo = false }) {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const { user } = useUser();

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

    // Logged in customer opened this property -> save in dashboard "Recent View" (once per property per page)
    const viewedId = property?.id;
    const isCustomer = user?.role === "customer";

    useEffect(() => {
        if (!viewedId || !isCustomer) return;

        addRecentlyViewed(viewedId);
    }, [viewedId, isCustomer]);

    // /web/profile ignores the id and always shows the logged in user, which isn't known yet before login
    const contactSeller = () => {
        const chatPath = `/web/profile/me?tab=chat&property=${encodeURIComponent(property.slug || property.id)}`;

        if (!user) {
            rememberPostLoginRedirect(chatPath);
            router.push("/login");
            return;
        }

        // The chat API lets sellers, brokers and admins message customers only
        if (user.role !== "customer") {
            showToast("Contact Seller is available for customer accounts only.", "error");
            return;
        }

        router.push(chatPath);
    };

    // Guest clicked Book Appointment: back here after login, with the booking window open
    const [openBooking, setOpenBooking] = useState(false);
    const listingKey = property?.slug || property?.id;

    const askLoginToBook = () => {
        rememberBookingAfterLogin(listingKey);
        rememberPostLoginRedirect(`/web/propertyDetail/${encodeURIComponent(listingKey)}`);
        router.push("/login");
    };

    useEffect(() => {
        if (!user || !listingKey || !isBookingAfterLogin(listingKey)) return;

        clearPostLoginRedirect();
        setOpenBooking(true);
    }, [user, listingKey]);

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
                <Link href="/web/property/searchProperties">
                    Back to Listings
                </Link>
            </div>
        );
    }
    return (
        <>
            {clientSeo && <MetaTags {...buildPropertySeo(property)} />}
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
                                        href="/web/property/searchProperties"
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

                                {/* Property ID (click to copy) */}
                                {property.property_id && (
                                    <>
                                        <li>
                                            <PropertyIdCopy id={property.property_id} variant="crumb" />
                                        </li>

                                        <li aria-hidden="true">
                                            <FaChevronRight className="text-[9px] text-gray-400" />
                                        </li>
                                    </>
                                )}

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
                            href="/web/property/searchProperties"
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


                {/* Overview Tab (image slider + enquiry form). Ads (Admin -> Ads, "Property Detail") sit left / right of it */}
                <SideAds page="property_detail" sticky={false} railClass="lg:mt-0">
                <div className="container">
                    <div className="grid grid-cols-12 gap-4">

                        {/* Slider section */}
                        <div className="xl:col-span-8 lg:col-span-8 md:col-span-8 col-span-12">
                            <PropertyImageSlider images={propertyImages} video={resolveVideo(property)} title={property.title} />

                            {/* highlights */}
                            <section className="w-full mt-[30px]">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FaCog className="text-[var(--primary-color)]" size={20} />
                                        <h2 className="text-lg font-bold text-gray-900 mb-0">
                                            Project Highlights
                                        </h2>
                                    </div>

                                    {/* Property ID + copy (same ID works in the home search "Property ID" tab) */}
                                    {property.property_id && <PropertyIdCopy id={property.property_id} />}
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
                            <div className="mx-auto mb-4 w-full max-w-sm">
                                <BookAppointmentButton
                                    bookableType="property"
                                    bookableKey={property.slug || property.id}
                                    title={property.title}
                                    user={user}
                                    onLoginRequired={askLoginToBook}
                                    autoOpen={openBooking}
                                    className="w-full"
                                />
                            </div>
                            <PropertySideForm propertyId={id} />
                        </div>
                        {/* // Form section */}
                    </div>
                </div>
                </SideAds>
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
                                <div className="flex items-start justify-between gap-3">
                                    <h1 className="text-[28px] font-bold text-[var(--text-color1)]">
                                        {property.title}
                                    </h1>
                                    <WishlistButton propertyId={property.id} className="h-10 w-10 border border-gray-200" />
                                </div>

                                {/* Price */}
                                <div className="mt-2">
                                    <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-[#768198]">{priceInfo(property).label}</p>
                                    <p className="text-3xl font-bold text-[var(--primary-color)]">    {property.price != null
                                        ? Number(property.price).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            maximumFractionDigits: 0,
                                        }) + (priceInfo(property).perMonth ? " / month" : "")
                                        : "Price on Request"}</p>
                                    <p className="mt-1 text-sm text-[#62748E]">
                                        {[property.location, property.city, property.state]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>

                                <CompareButton propertyId={property.id} />

                                {/* Specs: only the fields of this property type (same rules as admin form) */}
                                <PropertySpecs property={property} />

                                <AgentCard property={property} onChat={contactSeller} />


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

            {/* Sellers / brokers near this property (same slider as home page) */}
            <TopAgents
                near={{ latitude: property.latitude, longitude: property.longitude, city: property.city }}
                nearLabel={property.location || property.city || "This Property"}
                properties={[property, ...similarProperties]}
                propertiesNearby={false}
                className="mt-10"
            />

            {/* Floating chat button (same flow as Contact Seller) */}
            <button
                type="button"
                onClick={contactSeller}
                aria-label="Chat with seller"
                title="Chat with seller"
                className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-color)] text-white shadow-lg transition-colors hover:bg-[var(--secondary-color)]"
            >
                <BsChatDotsFill size={24} aria-hidden="true" />
            </button>
        </>
    )
}
