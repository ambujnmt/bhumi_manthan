import React from "react";
import Main from "../components/Home/Main/Main";
import { loadDefaultListings } from "../utils/useHomeListings";

export default function HomePage({ banners, listings }) {
  return (
      <Main banners={banners} listings={listings} />
  );
}

// Banners + home sections (featured, new projects, luxury) come with the HTML
// -> no empty / default content first, no blink.
// "Near you" lists replace them in the browser once location is known.
// Page is rebuilt at most every 60 sec, so admin changes show within a minute.
export async function getStaticProps() {
  let banners = null;
  let listings = null;

  const loadBanners = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}banners`, {
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data?.data?.banners)) {
        banners = data.data.banners;
      }
    } catch (error) {
      // API down at build time -> HeroCarousel loads banners in browser
      console.error("Home banners fetch error:", error?.message);
    }
  };

  const loadListings = async () => {
    try {
      const result = await loadDefaultListings();

      // All empty usually means API down -> let the browser load them
      const hasItems = ["featured", "luxury", "projects"].some(
        (key) => result?.[key]?.items?.length > 0
      );

      listings = hasItems ? result : null;
    } catch (error) {
      // API down at build time -> sections load in browser
      console.error("Home listings fetch error:", error?.message);
    }
  };

  await Promise.all([loadBanners(), loadListings()]);

  return {
    props: { banners, listings },
    revalidate: 60,
  };
}
