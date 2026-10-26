import NextLink from "next/link";
import { FiArrowRight, FiNavigation } from "react-icons/fi";
import { formatDistance, imageFallback } from "../../../../utils/formatPrice";
import SectionSkeleton from "./SectionSkeleton";
import { Link } from "@heroui/react";

// ₹2.45 Cr onwards / ₹42.00 Lakh onwards
const priceText = (project) => {
    if (project.price_label) return project.price_label;

    const price = Number(project.starting_price);

    if (!price) return "";
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr onwards`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh onwards`;

    return `₹${price.toLocaleString("en-IN")} onwards`;
};

// projects + nearby come from Body (useHomeListings)
export default function NewProjects({ loading = false, projects = [], nearby = false }) {
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
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-color1)]">
                        New Launch &amp; Premium Projects
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
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

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {projects.map((project) => {
                    const isExternal = /^https?:\/\//.test(project.link || "");
                    const distance = formatDistance(project.distance_km);

                    return (
<Link    key={project.id}
                            href={project.link || "#"}
                            {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className="group cursor-pointer">

                        <div
                         
                        >
                            
                            <div className="relative overflow-hidden rounded-lg mb-3">
                                <img
                                    src={project.image || "/assets/img/pro-1.png"}
                                    onError={imageFallback("/assets/img/pro-1.png")}
                                    alt={project.name}
                                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {distance && (
                                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                                        <FiNavigation size={10} /> {distance}
                                    </span>
                                )}
                            </div>
                            {project.builder_name && (
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-color2)] mb-1">
                                    {project.builder_name}
                                </p>
                            )}
                            <h3 className="text-[18px] font-bold text-[var(--text-color1)]">{project.name}</h3>
                            <p className="text-[13px] text-[var(--text-color2)] mt-0.5">
                                {[project.location, project.city].filter(Boolean).join(", ")}
                            </p>
                            {priceText(project) && (
                                <p className="text-[14px] font-bold text-[var(--primary-color)] mt-2">
                                    {priceText(project)}
                                </p>
                            )}
                            {project.configuration && (
                                <p className="text-[11px] text-[var(--text-color2)] mt-0.5">{project.configuration}</p>
                            )}
                        </div>
</Link>
                    );
                })}
            </div>
        </section>
    );
}
