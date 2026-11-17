import React from 'react'
import { Link } from "@heroui/react";
import { LuBuilding2 } from "react-icons/lu";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";
import WishlistButton from "../../Common/WishlistButton";

export default function SimilarProperties({ properties = [] }) {
    if (!properties.length) return null;

    return (
        <>
            <div className="mt-10">
                {/* Heading */}
                <div className="mb-3 flex items-center gap-2">
                    <LuBuilding2 className="text-[var(--primary-color)]" size={20} />
                    <h2 className="text-lg font-bold text-gray-900 mb-0">
                        Similar Properties
                    </h2>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {properties.map((property) => {
                        const place = [property.location, property.city].filter(Boolean).join(", ");
                        const area = property.super_area != null
                            ? `${Number(property.super_area).toLocaleString("en-IN")} sq. ft.`
                            : null;

                        return (
                            <div key={property.id} className="xl:col-span-3 lg:col-span-3 md:col-span-4 col-span-12">
                                <Link
                                    href={`/web/propertyDetail/${property.slug || property.id}`}
                                    className="block"
                                >
                                    <div className="relative">
                                        <img
                                            src={property.main_image || "/assets/img/similar-property1.png"}
                                            onError={imageFallback("/assets/img/similar-property1.png")}
                                            alt={property.title}
                                            className="h-40 w-full rounded-lg object-cover"
                                        />
                                        <WishlistButton propertyId={property.id} className="absolute top-[8px] right-[8px]" />
                                    </div>
                                    <div className="p-[10px]">
                                        <h5 className="text-[14px] text-[#202D47] font-medium">{formatPropertyPrice(property.price)}</h5>
                                        <h5 className="text-[14px] text-[#202D47] font-medium line-clamp-1">{property.title}</h5>
                                        <p className="text-[12px] text-[#768198] mb-0 line-clamp-1">
                                            {[place, area].filter(Boolean).join(" · ")}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    )
}
