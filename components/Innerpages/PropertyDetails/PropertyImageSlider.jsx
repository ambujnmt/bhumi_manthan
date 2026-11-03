"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { FaVideo } from "react-icons/fa";
import PropertyVideoPlayer from "./PropertyVideo";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export default function PropertyImageSlider({
  images = [],
  height = 350,
  mobileHeight = 280,
  video = null,
  title = "",
}) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [playing, setPlaying] = useState(false);
  const videoSrc = video?.src;

  // Opening another property (Similar Properties) goes back to its images
  useEffect(() => {
    setPlaying(false);
  }, [videoSrc]);

  const toCss = (value) =>
    typeof value === "number" ? `${value}px` : value;

  // Keep only valid, non-empty image URLs.
  const slides = images.filter(
    (image) => typeof image === "string" && image.trim() !== ""
  );

  useEffect(() => {
    return () => {
      if (thumbsSwiper && !thumbsSwiper.destroyed) {
        thumbsSwiper.destroy();
      }
    };
  }, [thumbsSwiper]);

  if (slides.length === 0 && !video) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
        style={{ height: toCss(mobileHeight) }}
      >
        No property images available
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`
        .property-main-slider {
          height: var(--slider-mobile-height);
        }

        @media (min-width: 640px) {
          .property-main-slider {
            height: var(--slider-height);
          }
        }

        .property-thumbs .swiper-slide {
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }

        /* Before Swiper init: same size as after init (warna full-width thumbs blink karte hain) */
        .property-main-slider:not(.swiper-initialized) .swiper-slide:not(:first-child) {
          display: none;
        }

        .property-thumbs:not(.swiper-initialized) .swiper-slide {
          width: calc((100% - 20px) / 3);
          margin-right: 10px;
        }

        @media (min-width: 640px) {
          .property-thumbs:not(.swiper-initialized) .swiper-slide {
            width: calc((100% - 30px) / 4);
          }
        }

        @media (min-width: 1024px) {
          .property-thumbs:not(.swiper-initialized) .swiper-slide {
            width: calc((100% - 40px) / 5);
          }
        }

        .property-thumbs .swiper-slide img {
          filter: blur(.4px) brightness(0.5);
          transition: filter 0.3s ease;
        }

        .property-thumbs .swiper-slide.swiper-slide-thumb-active img {
          filter: none;
        }
      `}</style>

      <div className="relative mb-3 w-full">
      {slides.length === 0 ? (
        <div
          className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
          style={{ height: toCss(mobileHeight) }}
        >
          No property images available
        </div>
      ) : (
      <Swiper
        style={{
          "--swiper-navigation-color": "#fff",
          "--swiper-pagination-color": "#fff",
          "--slider-height": toCss(height),
          "--slider-mobile-height": toCss(mobileHeight),
        }}
        loop={slides.length > 1}
        spaceBetween={10}
        navigation={slides.length > 1}
        thumbs={{
          swiper:
            thumbsSwiper && !thumbsSwiper.destroyed
              ? thumbsSwiper
              : null,
        }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="property-main-slider w-full overflow-hidden rounded-2xl"
      >
        {slides.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`}>
            <img
              src={src}
              alt={`Property image ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      )}

      {video && !playing && (
        video.type === "link" ? (
          <a
            href={video.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch video in a new tab"
            title="Watch video"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white no-underline transition-colors hover:bg-[var(--primary-color)] hover:text-white"
          >
            <FaVideo size={16} aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            aria-label="Play video"
            title="Play video"
            onClick={() => setPlaying(true)}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-[var(--primary-color)]"
          >
            <FaVideo size={16} aria-hidden="true" />
          </button>
        )
      )}

      {video && playing && (
        <PropertyVideoPlayer video={video} title={title} onClose={() => setPlaying(false)} />
      )}
      </div>

      {slides.length > 1 && (
        <div onClickCapture={() => setPlaying(false)}>
        <Swiper
          onSwiper={setThumbsSwiper}
          loop={slides.length > 1}
          spaceBetween={10}
          slidesPerView={3}
          breakpoints={{
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
          }}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="property-thumbs"
        >
          {slides.map((src, index) => (
            <SwiperSlide
              key={`${src}-thumb-${index}`}
              className="aspect-[4/3]"
            >
              <img
                src={src}
                alt={`Property thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      )}
    </div>
  );
}