"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaChevronRight, FaHome, FaPlay } from "react-icons/fa";
import { VideoCard } from "../../Home/Main/HomeSections/YoutuberVideos";
import { getYoutuberVideos } from "../../../utils/fetchApi";

/**
 * Bhumi Manthan Video Tour page (footer -> Video Tour)
 * Videos are managed in Admin -> YouTuber Videos (videoList), only active ones are shown.
 */
export default function VideoTourList({ initialVideos = null }) {
    const [videos, setVideos] = useState(initialVideos || []);
    const [loading, setLoading] = useState(!initialVideos);
    const [error, setError] = useState("");
    const [playingId, setPlayingId] = useState(null);

    useEffect(() => {
        if (initialVideos) return;

        getYoutuberVideos()
            .then((res) => setVideos(res?.data?.videos || []))
            .catch((err) => setError(err?.message || "Unable to load videos."))
            .finally(() => setLoading(false));
    }, [initialVideos]);

    return (
        <section className="w-full pb-14">
            {/* Heading */}
            <div className="bg-[var(--secondary-color)] py-10 sm:py-14">
                <div className="container text-center">
                    <nav aria-label="Breadcrumb" className="mb-3 flex items-center justify-center gap-2 text-[13px] text-white/70">
                        <Link href="/" className="flex items-center gap-1.5 text-white/70 no-underline hover:text-white">
                            <FaHome size={12} /> Home
                        </Link>
                        <FaChevronRight size={9} />
                        <span className="font-semibold text-white">Video Tour</span>
                    </nav>

                    <h1 className="mb-2 text-[28px] font-bold text-white sm:text-[36px]">
                        Bhumi Manthan Video Tour
                    </h1>

                    <p className="mx-auto mb-0 max-w-2xl text-[15px] text-white/80 sm:text-[16px]">
                        Property tours, project walkthroughs and reviews — watch before you visit.
                    </p>
                </div>
            </div>

            <div className="container mt-10">
                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                        {[1, 2, 3].map((key) => (
                            <div key={key} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                <div className="aspect-video bg-gray-200" />
                                <div className="space-y-2 p-[14px]">
                                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                                    <div className="h-3 w-1/3 rounded bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <p className="rounded-2xl bg-white px-4 py-10 text-center text-red-600 shadow-sm">{error}</p>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-14 text-center">
                        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                            <FaPlay size={18} className="ml-1" />
                        </span>
                        <p className="mb-1 text-base font-semibold text-[var(--text-color1)]">No videos yet</p>
                        <p className="mb-0 text-sm text-[var(--text-color2)]">New video tours will appear here soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {videos.map((item) => (
                            <VideoCard
                                key={item.id}
                                item={item}
                                playing={playingId === item.id}
                                onPlay={() => setPlayingId(item.id)}
                                onClose={() => setPlayingId(null)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
