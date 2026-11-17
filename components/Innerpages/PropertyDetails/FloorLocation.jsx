"use client";

import React from "react";
import { FaMapLocation } from "react-icons/fa6";
import {
    FaMapMarkerAlt,
    FaRoad,
    FaSubway,
    FaHospital,
    FaShoppingBag,
    FaBuilding,
    FaPlane,
} from "react-icons/fa";

export default function FloorLocation({ property }) {
    if (!property) return null;

    const latitude = property.latitude;
    const longitude = property.longitude;

    const hasCoordinates =
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined &&
        latitude !== "" &&
        longitude !== "";

    const mapUrl = hasCoordinates
        ? `https://www.google.com/maps?q=${encodeURIComponent(
              `${latitude},${longitude}`
          )}&output=embed`
        : `https://www.google.com/maps?q=${encodeURIComponent(
              [property.location, property.city, property.state]
                  .filter(Boolean)
                  .join(", ")
          )}&output=embed`;

    const nearbyLocations = [
        {
            name: "Rapid Metro",
            distance: property.rapid_metro_distance,
            Icon: FaSubway,
        },
        {
            name: "School",
            distance: property.school_distance,
            Icon: FaBuilding,
        },
        {
            name: "Hospital",
            distance: property.hospital_distance,
            Icon: FaHospital,
        },
    ].filter(
        (item) =>
            item.distance !== null &&
            item.distance !== undefined &&
            item.distance !== ""
    );

    const propertyAddress = [
        property.location,
        property.city,
        property.state,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <>
            {/* Location & Map */}
            <div className="mt-8 border-t border-gray-100 pt-8">
                {/* Heading */}
                <div className="mb-3 flex items-center gap-2">
                    <FaMapLocation
                        className="text-[var(--primary-color)]"
                        size={20}
                    />

                    <h2 className="mb-0 text-lg font-bold text-gray-900">
                        Location & Landmarks Near {property.project || property.title || "Property"}
                    </h2>
                </div>

                {/* Dynamic Google Map */}
                <div className="relative w-full overflow-hidden rounded-xl">
                    <iframe
                        src={mapUrl}
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map showing ${propertyAddress || "property location"}`}
                    />
                </div>

                {/* Property Address */}
                <p className="mt-3 text-sm text-gray-600">
                    <FaMapMarkerAlt className="mr-1 inline text-[var(--primary-color)]" />
                    {propertyAddress || "Location not available"}
                </p>

                {/* Nearby Locations */}
                <section className="mt-4 w-full">
                    <div className="mb-3 flex items-center gap-2">
                        <FaMapMarkerAlt
                            className="text-[var(--primary-color)]"
                            size={20}
                        />

                        <h2 className="mb-0 text-lg font-bold text-gray-900">
                            Nearby Locations
                        </h2>
                    </div>

                    {nearbyLocations.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-[#f4f6fb] p-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
                            {nearbyLocations.map(({ name, distance, Icon }) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-3 lg:border-r lg:border-gray-300 lg:px-3"
                                >
                                    <Icon
                                        className="shrink-0 text-[var(--primary-color)]"
                                        size={28}
                                    />

                                    <div>
                                        <p className="mb-2 text-xs leading-tight text-gray-600">
                                            {name}
                                        </p>

                                        <p className="mb-0 text-sm font-bold text-[var(--secondary-color)]">
                                            {distance}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-[#f4f6fb] p-4 text-sm text-gray-600">
                            Nearby landmark distances are not available for this property yet.
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
