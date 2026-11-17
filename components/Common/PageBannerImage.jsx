"use client";

import { useEffect, useState } from "react";
import { getBanners } from "../../utils/fetchApi";

/**
 * Hero background image of an inner page (Events, Plans ...).
 * Image = first active banner of this type from Admin -> Banner (bannerList).
 * No banner -> no image (the page keeps its own background).
 *
 * initialBanner: banner from getStaticProps (undefined = load in browser)
 */
export default function PageBannerImage({ type, initialBanner, alt }) {
    const [banner, setBanner] = useState(initialBanner ?? null);

    useEffect(() => {
        if (initialBanner !== undefined) return;

        getBanners(type)
            .then((res) => setBanner(res?.data?.banners?.[0] || null))
            .catch(() => {});
    }, [type, initialBanner]);

    if (!banner?.image) return null;

    return (
        // Admin uploads come from the API host: plain img (next/image allows only listed hosts)
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={banner.image}
            alt={banner.title || alt}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
        />
    );
}

/**
 * For getStaticProps: first active banner of a type (null = none, undefined = API failed)
 */
export async function fetchPageBanner(type) {
    try {
        const res = await getBanners(type);
        return res?.data?.banners?.[0] || null;
    } catch (error) {
        console.error(`${type} banner fetch error:`, error?.message);
        return undefined;
    }
}
