import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Link } from "@heroui/react";
import {
    FiArrowLeft,
    FiMapPin,
    FiNavigation,
    FiCheckCircle,
    FiHome,
    FiCalendar,
    FiTag,
    FiImage,
    FiChevronRight,
} from "react-icons/fi";
import { getProjectDetails } from "../../../utils/fetchApi";
import { FaArrowLeft, FaBuilding, FaChevronRight, FaHome } from "react-icons/fa";
import { MdApartment } from "react-icons/md";
import SideAds from "../../Common/Ads/SideAds";
import PropertySideForm from "../PropertyDetails/PropertySideForm";

const FALLBACK_IMAGE = "/assets/img/pro-1.png";

// Format starting price
const formatPrice = (project) => {
    if (project.price_label) {
        return project.price_label;
    }

    const price = Number(project.starting_price);

    if (!price) return "Price on Request";

    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(2)} Crore onwards`;
    }

    if (price >= 100000) {
        return `₹${(price / 100000).toFixed(2)} Lakh onwards`;
    }

    return `₹${price.toLocaleString("en-IN")} onwards`;
};

// Format image paths returned by the API
const getImageUrl = (image) => {
    if (typeof image === "string") {
        return image;
    }

    if (image && typeof image === "object") {
        return image.url || image.image || image.image_url || "";
    }

    return "";
};

// Format launch status
const getStatusClass = (status) => {
    const value = (status || "").toLowerCase();

    if (value.includes("ready")) {
        return "bg-green-100 text-green-700";
    }

    if (value.includes("construction")) {
        return "bg-orange-100 text-orange-700";
    }

    if (value.includes("launch")) {
        return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
};

export default function ProjectDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeImage, setActiveImage] = useState("");

    useEffect(() => {
        if (!router.isReady || !id) return;

        let cancelled = false;

        const fetchProject = async () => {
            try {
                setLoading(true);
                setError("");
                setProject(null);

                const slug = Array.isArray(id) ? id[0] : id;
                const data = await getProjectDetails(slug);

                if (cancelled) return;

                setProject(data);
                setActiveImage(data.image || FALLBACK_IMAGE);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProject();

        return () => {
            cancelled = true;
        };
    }, [router.isReady, id]);

    if (!router.isReady || loading) {
        return (
            <main className="container py-12">
                <div className="animate-pulse">
                    <div className="h-5 w-36 rounded bg-gray-200 mb-6" />
                    <div className="h-[320px] md:h-[480px] rounded-2xl bg-gray-200" />
                    <div className="h-8 w-2/3 rounded bg-gray-200 mt-8" />
                    <div className="h-5 w-1/3 rounded bg-gray-200 mt-4" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-24 rounded-xl bg-gray-200"
                            />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    if (error || !project) {
        return (
            <main className="container py-20 text-center">
                <div className="max-w-lg mx-auto rounded-2xl border border-gray-200 p-8">
                    <FiHome className="mx-auto text-4xl text-gray-400 mb-4" />

                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Not Found
                    </h1>

                    <p className="text-gray-500 mt-3">
                        {error || "We couldn't find this project."}
                    </p>

                    <Link
                        href="/web/property/searchProperties"
                        className="inline-flex items-center gap-2 mt-6 text-blue-700 font-semibold"
                    >
                        <FiArrowLeft />
                        Explore Properties
                    </Link>
                </div>
            </main>
        );
    }

    const gallery = [
        project.image,
        ...(Array.isArray(project.gallery_images)
            ? project.gallery_images.map(getImageUrl)
            : []),
    ].filter(Boolean);

    const images = [...new Set(gallery)];

    const description = project.description
        ? project.description.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        : "";

    return (
        <main className="min-h-screen bg-gray-50 pb-10 sm:pb-16">
            {/* Breadcrumb (same look as property detail) */}
            <div className="container">
                <div className="py-[40px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <nav aria-label="Breadcrumb" className="min-w-0">
                        <ol className="mb-0 flex flex-wrap items-center gap-1.5 pl-0 text-[13px]">
                            {/* Home */}
                            <li>
                                <Link
                                    href="/"
                                    className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
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

                            {/* Projects */}
                            <li>
                                <Link
                                    href="/web/project"
                                    className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                        <FaBuilding className="text-[11px]" />
                                    </span>
                                    Projects
                                </Link>
                            </li>

                            <li aria-hidden="true">
                                <FaChevronRight className="text-[9px] text-gray-400" />
                            </li>

                            {/* Current Page */}
                            <li aria-current="page" className="min-w-0">
                                <span className="flex items-center gap-2 rounded-full bg-[var(--secondary-color)] px-3.5 py-1.5 font-semibold text-white shadow-md">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-white">
                                        <MdApartment className="text-[12px]" />
                                    </span>
                                    <span className="truncate">{project.name}</span>
                                </span>
                            </li>
                        </ol>
                    </nav>

                    {/* Back Button */}
                    <Link
                        href="/web/project"
                        className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--primary-color)] px-4 py-1.5 text-[13px] font-semibold text-[var(--primary-color)] no-underline transition hover:bg-[var(--primary-color)] hover:text-white"
                    >
                        <FaArrowLeft className="text-[11px]" />
                        Back to Projects
                    </Link>
                </div>

                {/* Accent line */}
                <div className="-mt-6 mb-6 h-[3px] w-full rounded-full bg-gradient-to-r from-[var(--primary-color)] via-[var(--primary-color)]/30 to-transparent" />
            </div>

            {/* Project Hero (images + price card). Ads (Admin -> Ads, "Project Detail") sit left / right of it */}
            <SideAds page="project_detail" sticky={false} railClass="lg:mt-5">
            <section className="container">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_340px]">
                    {/* Images */}
                    <div className="min-w-0">
                        <div className="relative h-[260px] sm:h-[400px] lg:h-[480px] overflow-hidden rounded-2xl bg-gray-200">
                            <img
                                src={activeImage || FALLBACK_IMAGE}
                                alt={project.name}
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = FALLBACK_IMAGE;
                                }}
                                className="w-full h-full object-cover"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

                            <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                                        project.launch_status
                                    )}`}
                                >
                                    <FiCheckCircle />
                                    {project.launch_status || "Project Details"}
                                </span>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-5 sm:left-5 sm:right-5">
                                <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-white/80">
                                    {project.builder_name || "Real Estate Project"}
                                </p>

                                <h1 className="mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-4xl">
                                    {project.name}
                                </h1>

                                <p className="mt-2 flex items-start gap-2 text-[13px] text-white/90 sm:mt-3 sm:items-center sm:text-base">
                                    <FiMapPin className="mt-0.5 shrink-0 sm:mt-0" />
                                    {[project.location, project.city, project.state]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            </div>

                            {images.length > 1 && (
                                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-white sm:right-4 sm:top-4 sm:px-3 sm:py-2">
                                    <FiImage />
                                    {images.length} Photos
                                </div>
                            )}
                        </div>

                        {/* Gallery thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto py-3 sm:gap-3 sm:py-4">
                                {images.map((image, index) => (
                                    <button
                                        type="button"
                                        key={`${image}-${index}`}
                                        onClick={() => setActiveImage(image)}
                                        aria-label={`View project image ${index + 1}`}
                                        className={`shrink-0 h-16 w-20 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-24 ${
                                            activeImage === image
                                                ? "border-blue-600"
                                                : "border-transparent"
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${project.name} ${index + 1}`}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = FALLBACK_IMAGE;
                                            }}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Starting price + key details (below the images) */}
                        <aside className={`${images.length > 1 ? "mt-1" : "mt-4"} rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5`}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
                                <div className="sm:col-span-2 lg:col-span-1 lg:border-r lg:border-gray-100 lg:pr-4">
                                    <p className="mb-0 text-sm text-gray-500">Starting Price</p>
                                    <h2 className="mb-0 mt-1 text-xl font-bold text-[var(--primary-color)] sm:text-2xl">
                                        {formatPrice(project)}
                                    </h2>
                                </div>

                                {[
                                    { icon: FiHome, color: "bg-orange-50 text-orange-600", label: "Configuration", value: project.configuration },
                                    { icon: FiMapPin, color: "bg-blue-50 text-blue-600", label: "Location", value: [project.location, project.city].filter(Boolean).join(", ") },
                                    { icon: FiCalendar, color: "bg-green-50 text-green-600", label: "Project Status", value: project.launch_status },
                                ].map(({ icon: Icon, color, label, value }) => (
                                    <div key={label} className="flex min-w-0 items-start gap-3">
                                        <div className={`shrink-0 rounded-lg p-3 ${color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="mb-0 text-xs text-gray-500">{label}</p>
                                            <p className="mb-0 mt-1 break-words text-sm font-semibold text-gray-900">
                                                {value || "Contact for details"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mb-0 mt-4 text-center text-xs text-gray-400 lg:text-left">
                                Prices and availability are subject to confirmation.
                            </p>
                        </aside>
                    </div>

                    {/* Enquire Now (same form as property detail) -> Admin -> Property Enquiries (with project name) */}
                    <div className="h-fit lg:sticky lg:top-28">
                        <PropertySideForm projectSlug={project.slug || project.id} />
                    </div>
                </div>
            </section>
            </SideAds>

            {/* Project Overview */}
            <section className="container mt-6 sm:mt-8">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8">
                    <div className="mb-4 sm:mb-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-color)] sm:text-sm">
                            Discover the Project
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-gray-900 sm:mt-2 sm:text-2xl">
                            Project Overview
                        </h2>

                        <p className="text-gray-500 text-sm mt-2">
                            Explore the key details of {project.name}.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                            <FiTag className="text-xl text-[var(--primary-color)]" />

                            <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                                Builder
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-gray-900 sm:text-base">
                                {project.builder_name || "Not specified"}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                            <FiMapPin className="text-xl text-[var(--primary-color)]" />

                            <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                                City
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-gray-900 sm:text-base">
                                {project.city || "Not specified"}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                            <FiNavigation className="text-xl text-[var(--primary-color)]" />

                            <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                                State
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-gray-900 sm:text-base">
                                {project.state || "Not specified"}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                            <FiHome className="text-xl text-[var(--primary-color)]" />

                            <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                                Configuration
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-gray-900 sm:text-base">
                                {project.configuration || "Not specified"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Description */}
            <section className="container mt-4 sm:mt-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        About {project.name}
                    </h2>

                    {description ? (
                        <div
                            className="mt-4 break-words text-sm leading-7 text-gray-600 sm:mt-5 sm:text-base [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_table]:block [&_table]:overflow-x-auto [&_iframe]:max-w-full [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold [&_strong]:text-gray-900"
                            dangerouslySetInnerHTML={{
                                __html: description,
                            }}
                        />
                    ) : (
                        <p className="mt-4 text-gray-500 leading-7">
                            Detailed information about this project will be
                            available soon. Please contact us for more details.
                        </p>
                    )}
                </div>
            </section>

            {/* Location */}
            <section className="container mt-4 sm:mt-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        Project Location
                    </h2>

                    <p className="flex items-start gap-3 mt-4 text-gray-600 leading-7">
                        <FiMapPin className="mt-1 shrink-0 text-xl text-[var(--primary-color)]" />

                        <span>
                            {[
                                project.location,
                                project.city,
                                project.state,
                            ]
                                .filter(Boolean)
                                .join(", ") || "Location details unavailable"}
                        </span>
                    </p>

                    {project.latitude && project.longitude && (
                        <a
                            href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-blue-700 no-underline hover:bg-blue-50 sm:mt-5 sm:inline-flex sm:w-auto"
                        >
                            <FiNavigation />
                            View on Google Maps
                        </a>
                    )}
                </div>
            </section>
        </main>
    );
}
