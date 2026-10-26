"use client";

import { FaCheckCircle } from "react-icons/fa";
import { MdHomeWork } from "react-icons/md";

export default function PropertyDescription({ property }) {
    if (!property) return null;

    const location = [
        property.location,
        property.city,
        property.state,
    ]
        .filter(Boolean)
        .join(", ");

    const highlights = [
        location
            ? `Property located in ${location}`
            : null,

        property.configuration
            ? `Configuration: ${property.configuration}`
            : null,

        property.property_type
            ? `Property type: ${property.property_type}`
            : null,

        property.status
            ? `Property status: ${property.status}`
            : null,
    ].filter(Boolean);

    return (
        <section className="container mt-10">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">

                {/* Left: Heading + Description */}
                <div className="lg:col-span-7">
                    <div className="mb-3 flex items-center gap-2">
                        <MdHomeWork
                            className="text-[var(--primary-color)]"
                            size={20}
                        />

                        <h2 className="text-lg font-bold text-gray-900 mb-0">
                            Project Details
                        </h2>
                    </div>

                    <p className="text-[14px] leading-relaxed text-[var(--text-color1)] sm:text-[15px]">
                           {property.description?.replace(/<\/?p[^>]*>/gi, "").trim() }
                    </p>
                </div>

                {/* Right: Highlights List */}
                <div className="lg:col-span-5">
                    <ul className="space-y-3 rounded-lg border border-[#f3d9bf] bg-[#fdf3e7] p-4 sm:p-5">
                        {highlights.length > 0 ? (
                            highlights.map((highlight, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3"
                                >
                                    <FaCheckCircle
                                        className="mt-0.5 shrink-0 text-[var(--primary-color)]"
                                        size={16}
                                    />

                                    <span className="text-[14px] text-[var(--secondary-color)]">
                                        {highlight}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li className="text-[14px] text-[var(--secondary-color)]">
                                No property highlights available.
                            </li>
                        )}
                    </ul>
                </div>

            </div>
        </section>
    );
}
