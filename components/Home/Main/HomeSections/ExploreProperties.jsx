import NextLink from "next/link";
import React, { useEffect, useState } from 'react'
import { getCities } from "../../../../utils/fetchApi";

export default function ExploreProperties() {
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await getCities({ popular: true, limit: 12 });

                if (res?.status && Array.isArray(res?.data?.cities)) {
                    setCities(res.data.cities);
                }
            } catch (error) {
                console.error("Failed to fetch cities:", error);
            }
        };

        fetchCities();
    }, []);

    // Hide section until admin marks a city as popular
    if (cities.length === 0) {
        return null;
    }

    return (
        <>
            <section className="w-full bg-[#F5F7FA] py-14">
                <div className="container">
                    <div className="grid grid-cols-12 mb-6">
                        <div className="col-span-12 text-center">
                            <h2 className="text-[28px] font-bold text-[var(--text-color1)]">
                                Explore Properties in Popular Indian Cities
                            </h2>
                            <p className="text-[16px] text-[var(--text-color2)] mb-4">
                                Invest or find your ideal dwelling in metropolitan hubs and high-growth cities
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {cities.map((city) => (
                            <NextLink
                                key={city.id}
                                href={`/web/property/searchProperties?city=${encodeURIComponent(city.name)}`}
                                className="group relative h-32 sm:h-36 rounded-xl overflow-hidden cursor-pointer bg-[var(--secondary-color)]"
                            >
                                {city.image && (
                                    <img
                                        src={city.image}
                                        alt={city.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/35" />
                                <span className="absolute inset-0 flex flex-col items-center justify-center text-white text-[20] sm:text-base font-medium">
                                    {city.name}
                                    {city.properties_count > 0 && (
                                        <span className="mt-0.5 text-[11px] font-normal text-white/85">
                                            {city.properties_count} {city.properties_count === 1 ? "Property" : "Properties"}
                                        </span>
                                    )}
                                </span>
                            </NextLink>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
