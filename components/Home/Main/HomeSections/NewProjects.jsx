import { FiArrowRight, FiNavigation } from "react-icons/fi";
import { formatDistance, imageFallback } from "../../../../utils/formatPrice";
import SectionSkeleton from "./SectionSkeleton";
import { Link } from "@heroui/react";

// ₹2.45 Cr onwards / ₹42.00 Lakh onwards
const priceText = (project) => {
    if (project.price_label) return project.price_label;

    const price = Number(project.starting_price);

    if (!price) return "";

    if (price >= 10000000) {
        return `₹${(price / 10000000).toFixed(2)} Cr onwards`;
    }

    if (price >= 100000) {
        return `₹${(price / 100000).toFixed(2)} Lakh onwards`;
    }

    return `₹${price.toLocaleString("en-IN")} onwards`;
};

// projects + nearby come from Body (useHomeListings)
export default function NewProjects({
    loading = false,
    projects = [],
    nearby = false,
}) {
    if (loading) {
        return (
            <SectionSkeleton
                cards={5}
                gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
                colClass=""
                imageHeight="h-40"
            />
        );
    }

    // Hide section until admin adds an active project
    if (projects.length === 0) {
        return null;
    }

    return (
        <section className="container mt-[60px] py-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="mb-0 text-xl sm:text-2xl font-bold text-[var(--text-color1)]">
                        New Launch &amp; Premium Projects
                    </h2>

                    <p className="mb-0 mt-1 text-sm text-gray-500">
                        {nearby
                            ? "Newly launched projects closest to your location"
                            : "Explore newly introduced landmark developments from India's most trusted real estate builders"}
                    </p>
                </div>

                <Link
                    href="/web/property/searchProperties"
                    className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 shrink-0 whitespace-nowrap"
                >
                    Explore New Projects
                    <FiArrowRight className="text-base" />
                </Link>
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {projects.map((project) => {
                    const distance = formatDistance(project.distance_km);

                    return (
                        <Link
                            key={project.slug}
                            href={`/web/project/projectDetail/${project.slug}`}
                            className="group block w-full min-w-0 cursor-pointer"
                            aria-label={`View details for ${project.name}`}
                        >
                            <div className="h-full">
                                {/* Project Image */}
                                <div className="relative overflow-hidden rounded-lg mb-3">
                                    <img
                                        src={
                                            project.image ||
                                            "/assets/img/pro-1.png"
                                        }
                                        onError={imageFallback(
                                            "/assets/img/pro-1.png"
                                        )}
                                        alt={project.name || "Project"}
                                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {distance && (
                                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                                            <FiNavigation size={10} />
                                            {distance}
                                        </span>
                                    )}
                                </div>

                                {/* Builder Name */}
                                {project.builder_name && (
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-color2)] mb-0.5">
                                        {project.builder_name}
                                    </p>
                                )}

                                {/* Project Name */}
                                <h3 className="mb-0 text-[18px] font-bold text-[var(--text-color1)] group-hover:text-[var(--primary-color)] transition-colors">
                                    {project.name}
                                </h3>

                                {/* Location */}
                                <p className="mb-0 mt-0.5 text-[13px] text-[var(--text-color2)]">
                                    {[
                                        project.location,
                                        project.city,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>

                                {/* Starting Price */}
                                {priceText(project) && (
                                    <p className="mb-0 mt-1.5 text-[14px] font-bold text-[var(--primary-color)]">
                                        {priceText(project)}
                                    </p>
                                )}

                                {/* Configuration */}
                                {project.configuration && (
                                    <p className="mb-0 mt-0.5 text-[11px] text-[var(--text-color2)]">
                                        {project.configuration}
                                    </p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
