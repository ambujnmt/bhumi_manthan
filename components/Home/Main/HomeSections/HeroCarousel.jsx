import NextLink from "next/link";
import React, { useEffect, useState } from "react";
import { getBanners } from "../../../../utils/fetchApi";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

// Swiper CSS
import "swiper/css";
import "swiper/css/navigation";

// Banner size 1922 x 818 -> space is reserved before image loads (no layout jump)
const BANNER_RATIO = "1922 / 818";

// Used when admin has no active banner / API fails
const fallbackBanners = [
    { id: "default", image: "/assets/img/banner-img.jpg", title: "Bhoomi Manthan" },
];

const BannerImage = ({ banner, first }) => (
    <img
        src={banner.image}
        alt={banner.title || "Banner"}
        className="w-full h-full object-cover"
        // First banner is the most important image on the page
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : "low"}
        decoding="async"
    />
);

// initialBanners: from server (pages/index.jsx). null -> load in browser.
const HeroCarousel = ({ initialBanners = null }) => {
  const [banners, setBanners] = useState(() =>
    Array.isArray(initialBanners)
      ? initialBanners.length > 0 ? initialBanners : fallbackBanners
      : null
  );

  useEffect(() => {
    if (banners) return;

    getBanners()
      .then((res) => {
        const list = res?.data?.banners;
        setBanners(Array.isArray(list) && list.length > 0 ? list : fallbackBanners);
      })
      .catch((error) => {
        console.error("Failed to fetch banners:", error);
        setBanners(fallbackBanners);
      });
  }, [banners]);

  return (
    <>
        <section className="w-full bg-[#e9edf3]" style={{ aspectRatio: BANNER_RATIO }}>
            {/* Loading: same size placeholder */}
            {!banners && <div className="h-full w-full animate-pulse bg-[#e9edf3]" />}

            {banners && (
                <Swiper
                    navigation={banners.length > 1}
                    modules={[Navigation, Autoplay]}
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={banners.length > 1}
                    autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                    className="heroSwiper h-full"
                >
                    {banners.map((banner, index) => (
                        <SwiperSlide key={banner.id} className="h-full">
                            {banner.link ? (
                                <NextLink
                                    href={banner.link}
                                    className="block h-full"
                                    {...(/^https?:\/\//.test(banner.link)
                                        ? { target: "_blank", rel: "noopener noreferrer" }
                                        : {})}
                                >
                                    <BannerImage banner={banner} first={index === 0} />
                                </NextLink>
                            ) : (
                                <BannerImage banner={banner} first={index === 0} />
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </section>
    </>
  );
};

export default HeroCarousel;
