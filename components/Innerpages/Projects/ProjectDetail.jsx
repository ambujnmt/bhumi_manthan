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
    FiPhone,
    FiImage,
    FiChevronRight,
} from "react-icons/fi";
import { getProjectDetails } from "../../../utils/fetchApi";

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
    const [enquiryOpen, setEnquiryOpen] = useState(false);

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
            <main className="container mx-auto px-4 py-12">
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
            <main className="container mx-auto px-4 py-20 text-center">
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
        <main className="min-h-screen bg-gray-50 pb-16">
            {/* Breadcrumb */}
            <div className="container mx-auto px-4 pt-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-blue-700"
                    >
                        Home
                    </Link>

                    <FiChevronRight />

                    <Link
                        href="/web/property/searchProperties"
                        className="text-gray-500 hover:text-blue-700"
                    >
                        Projects
                    </Link>

                    <FiChevronRight />

                    <span className="font-medium text-gray-900">
                        {project.name}
                    </span>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-gray-600 hover:text-blue-700"
                >
                    <FiArrowLeft />
                    Back to Projects
                </Link>
            </div>

            {/* Project Hero */}
            <section className="container mx-auto px-4 mt-5">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    {/* Images */}
                    <div className="min-w-0">
                        <div className="relative h-[280px] sm:h-[400px] lg:h-[480px] overflow-hidden rounded-2xl bg-gray-200">
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

                            <div className="absolute top-4 left-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                                        project.launch_status
                                    )}`}
                                >
                                    <FiCheckCircle />
                                    {project.launch_status || "Project Details"}
                                </span>
                            </div>

                            <div className="absolute bottom-5 left-5 right-5 text-white">
                                <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-white/80">
                                    {project.builder_name || "Real Estate Project"}
                                </p>

                                <h1 className="text-2xl sm:text-4xl font-bold mt-2">
                                    {project.name}
                                </h1>

                                <p className="flex items-center gap-2 mt-3 text-sm sm:text-base text-white/90">
                                    <FiMapPin className="shrink-0" />
                                    {[project.location, project.city, project.state]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            </div>

                            {images.length > 1 && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">
                                    <FiImage />
                                    {images.length} Photos
                                </div>
                            )}
                        </div>

                        {/* Gallery thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto py-4">
                                {images.map((image, index) => (
                                    <button
                                        type="button"
                                        key={`${image}-${index}`}
                                        onClick={() => setActiveImage(image)}
                                        aria-label={`View project image ${index + 1}`}
                                        className={`shrink-0 w-24 h-20 overflow-hidden rounded-lg border-2 ${
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
                    </div>

                    {/* Price and enquiry card */}
                    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Starting Price
                        </p>

                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary-color)] mt-2">
                            {formatPrice(project)}
                        </h2>

                        <div className="h-px bg-gray-100 my-3" />

                        <div className="space-y-5">
                            <div className="flex gap-3 items-start">
                                <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
                                    <FiHome size={20} />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Configuration
                                    </p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {project.configuration || "Contact for details"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                                    <FiMapPin size={20} />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Location
                                    </p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {[project.location, project.city]
                                            .filter(Boolean)
                                            .join(", ") || "Contact for details"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="rounded-lg bg-green-50 p-3 text-green-600">
                                    <FiCalendar size={20} />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500">
                                        Project Status
                                    </p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {project.launch_status || "Contact for details"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setEnquiryOpen(!enquiryOpen)}
                            className="mt-7 w-full rounded-lg bg-[var(--primary-color)] px-5 py-3.5 font-semibold text-white transition hover:opacity-90"
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                <FiPhone />
                                Enquire About This Project
                            </span>
                        </button>

                        {enquiryOpen && (
                            <div className="mt-4 rounded-xl bg-gray-50 p-4">
                                <p className="font-semibold text-gray-900">
                                    Interested in {project.name}?
                                </p>

                                <p className="text-sm text-gray-600 mt-2">
                                    Contact our team to learn more about pricing,
                                    availability, and site visits.
                                </p>

                                <Link
                                    href="/user/cms/contactUs"
                                    className="inline-flex items-center gap-2 mt-3 font-semibold text-blue-700"
                                >
                                    Contact Us
                                    <FiChevronRight />
                                </Link>
                            </div>
                        )}

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Prices and availability are subject to confirmation.
                        </p>
                    </aside>
                </div>
            </section>

            {/* Project Overview */}
            <section className="container mx-auto px-4 mt-8">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
                    <div className="mb-6">
                        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary-color)]">
                            Discover the Project
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-2">
                            Project Overview
                        </h2>

                        <p className="text-gray-500 text-sm mt-2">
                            Explore the key details of {project.name}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <FiTag className="text-xl text-[var(--primary-color)]" />

                            <p className="text-xs text-gray-500 mt-3">
                                Builder
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {project.builder_name || "Not specified"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <FiMapPin className="text-xl text-[var(--primary-color)]" />

                            <p className="text-xs text-gray-500 mt-3">
                                City
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {project.city || "Not specified"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <FiNavigation className="text-xl text-[var(--primary-color)]" />

                            <p className="text-xs text-gray-500 mt-3">
                                State
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {project.state || "Not specified"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <FiHome className="text-xl text-[var(--primary-color)]" />

                            <p className="text-xs text-gray-500 mt-3">
                                Configuration
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {project.configuration || "Not specified"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Description */}
            <section className="container mx-auto px-4 mt-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        About {project.name}
                    </h2>

                    {description ? (
                        <div
                            className="mt-5 text-sm sm:text-base leading-7 text-gray-600 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold [&_strong]:text-gray-900"
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
            <section className="container mx-auto px-4 mt-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900">
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
                            className="inline-flex items-center gap-2 mt-5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
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
