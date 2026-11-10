
"use client";

import { useEffect, useState } from "react";
import { FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import PropertyVideoPlayer, {
  resolveVideo,
} from "../../../Innerpages/PropertyDetails/PropertyVideo";

import { getYoutuberVideos } from "../../../../utils/fetchApi";

const YOUTUBE_EMBED =
  /youtube-nocookie\.com\/embed\/([\w-]+)/;

// Admin thumbnail or YouTube thumbnail
const thumbnailOf = (item, video) => {
  if (item.thumbnail) return item.thumbnail;

  const youtubeId = video?.src.match(YOUTUBE_EMBED)?.[1];

  return youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;
};

export const VideoCard = ({ item, playing, onPlay, onClose }) => {
  const video = resolveVideo(item);
  const thumbnail = thumbnailOf(item, video);
  const label = item.title || `Video by ${item.youtuber_name}`;

  if (!video) return null;

  const cover = (
    <>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : video.type === "file" ? (
        <video
          src={`${video.src}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : null}

      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-color)] text-white shadow-lg transition-transform group-hover:scale-110">
          <FaPlay size={18} className="ml-1" />
        </span>
      </span>
    </>
  );

  const coverClass =
    "group absolute inset-0 block h-full w-full overflow-hidden";

  return (
    <article className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-900">
        {playing ? (
          <PropertyVideoPlayer
            video={video}
            title={label}
            onClose={onClose}
          />
        ) : video.type === "link" ? (
          <a
            href={video.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch ${label}`}
            className={coverClass}
          >
            {cover}
          </a>
        ) : (
          <button
            type="button"
            aria-label={`Play ${label}`}
            onClick={onPlay}
            className={coverClass}
          >
            {cover}
          </button>
        )}
      </div>

      <div className="p-[14px]">
        {item.title && (
          <h3 className="mb-[4px] line-clamp-2 text-[15px] font-semibold text-[var(--text-color1)]">
            {item.title}
          </h3>
        )}

        <p className="mb-0 text-[13px] font-medium text-[var(--text-color2)]">
          {item.youtuber_name}
        </p>
      </div>
    </article>
  );
};

export default function YoutuberVideos({ initialVideos = null }) {
  const [videos, setVideos] = useState(initialVideos || []);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (initialVideos) return;

    getYoutuberVideos()
      .then((res) => setVideos(res?.data?.videos || []))
      .catch((error) =>
        console.error("YouTuber videos fetch error:", error?.message)
      );
  }, [initialVideos]);

  if (videos.length === 0) return null;

  return (
    <section
      className="w-full py-14"
      aria-labelledby="youtuber-videos-title"
    >
      <div className="container">
        <div className="mb-6 text-center">
          <h2
            id="youtuber-videos-title"
            className="text-[28px] font-bold text-[var(--text-color1)]"
          >
            Watch What YouTubers Say About Us
          </h2>

          <p className="mb-0 text-[16px] text-[var(--text-color2)]">
            Property tours and reviews by popular creators
          </p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={{
              prevEl: ".youtube-prev",
              nextEl: ".youtube-next",
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="youtuber-swiper !pb-12"
          >
            {videos.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <VideoCard
                  item={item}
                  playing={playingId === item.id}
                  onPlay={() => setPlayingId(item.id)}
                  onClose={() => setPlayingId(null)}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Previous Button */}
          <button
            type="button"
            className="youtube-prev absolute left-[-15px] top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-[var(--primary-color)] hover:text-white"
            aria-label="Previous videos"
          >
            <FaChevronLeft />
          </button>

          {/* Next Button */}
          <button
            type="button"
            className="youtube-next absolute right-[-15px] top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-[var(--primary-color)] hover:text-white"
            aria-label="Next videos"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .youtuber-swiper .swiper-pagination-bullet-active {
          background: var(--primary-color);
        }

        .youtuber-swiper .swiper-pagination {
          bottom: 5px;
        }
      `}</style>
    </section>
  );
}
