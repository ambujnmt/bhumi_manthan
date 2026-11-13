import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdMedia from "./AdMedia";
import { fetchAd, peekAd, sideAdPage, sideAdPlacements } from "../../../utils/ads";

// Ads of a page right now, from the cache (no waiting): { left, right } (undefined = not loaded yet)
const knownAds = (pageKey) => {
  if (!pageKey) return { left: null, right: null };

  const keys = sideAdPlacements(pageKey);
  return { left: peekAd(keys.left), right: peekAd(keys.right) };
};

/**
 * Left / right ads of a page (Admin -> Ads) for a custom layout: { left, right } (null = none).
 * Uses the shared cache, so no blink. Example: blog detail puts them in its own grid.
 *
 *   const ads = useSideAds("blog_detail");
 *   {ads.left && <AdMedia ad={ads.left} />}
 */
export function useSideAds(page = null) {
  const router = useRouter();
  const pageKey = page || sideAdPage(router.pathname);
  const [ads, setAds] = useState(() => knownAds(pageKey));

  useEffect(() => {
    if (!pageKey) {
      setAds({ left: null, right: null });
      return;
    }

    let active = true;
    const keys = sideAdPlacements(pageKey);

    // Known already -> show at once; then make sure (same objects -> React skips the re-render)
    setAds((previous) => {
      const known = knownAds(pageKey);
      return previous.left === known.left && previous.right === known.right ? previous : known;
    });

    Promise.all([fetchAd(keys.left), fetchAd(keys.right)]).then(([left, right]) => {
      if (!active) return;
      setAds((previous) => (previous.left === left && previous.right === right ? previous : { left, right }));
    });

    return () => {
      active = false;
    };
  }, [pageKey]);

  return { left: ads.left || null, right: ads.right || null };
}

/**
 * Left / right ads beside the page content (same look as home "Featured Properties").
 * Admin -> Ads: tick the page's Left and / or Right checkbox.
 *
 *   <Header />
 *   <SideAds>
 *     ...page content...
 *   </SideAds>
 *   <Footer />
 *
 * page      : page key (backend App\Models\Ad::PAGES). Not given -> from the URL (utils/ads.js SIDE_AD_PAGES).
 * sticky    : ads stay in view while scrolling (default true). false = they stay next to the wrapped part.
 * top       : sticky offset (below the header)
 * railClass : extra classes on each ad column, e.g. "lg:mt-5" to line up with the wrapped section
 * wrapClass : side padding of the whole block when ads show ("" inside a container that has its own)
 * mobileGap : extra top space of the phone / tablet ad banners, e.g. "mt-6" (default: as before)
 * sides     : which ad columns this block shows, default ["left", "right"].
 *             ["left"] = only the left ad here, put the right one elsewhere with
 *             <AdSlot placement={sideAdPlacements(page).right} />
 *
 * Wrap only one section to put the ads beside it (e.g. project detail images):
 *   <SideAds page="project_detail" sticky={false} railClass="lg:mt-5"><section>...</section></SideAds>
 *
 * No active ad on a side -> no column there, the page looks exactly as before.
 * Phones / tablets (below lg): side columns hidden, so the page content keeps the full width.
 * An ad with a "Mobile Image" (Admin -> Ads) shows that image there instead, full width:
 * left ad above the wrapped part, right ad below it.
 *
 * No blink: the page content always sits in the same element (it is never re-mounted
 * when ads arrive), and ads already loaded on another page show on the first render.
 */
export default function SideAds({ page = null, children, top = "top-28", sticky = true, railClass = "lg:mt-6", wrapClass = "lg:px-[15px]", sides = ["left", "right"], mobileGap = "" }) {
  const ads = useSideAds(page);

  // Only the sides this block shows (the other side's ad may sit elsewhere on the page)
  const left = sides.includes("left") ? ads.left : null;
  const right = sides.includes("right") ? ads.right : null;
  const withAds = Boolean(left || right);

  // Same width as home: 1 of 12 columns, kept readable on big / small screens
  const rail = `hidden shrink-0 self-start lg:block lg:w-[8.333%] lg:min-w-[110px] lg:max-w-[180px] ${railClass} ${sticky ? `lg:sticky ${top}` : ""}`;

  // Phones / tablets: mobile image as a banner, same width as the page content.
  // Around a whole page (wrapClass set) -> its own "container" (same as the content inside);
  // inside a container (wrapClass "") -> already that width.
  const mobileBanner = `lg:hidden ${wrapClass ? "container" : ""}`;

  // Same elements with or without ads (only classes change) -> page content is never re-mounted
  return (
    <div className={withAds ? `lg:flex lg:items-start lg:gap-4 ${wrapClass}` : undefined}>
      {left && (
        <aside aria-label="Advertisement" className={rail}>
          <AdMedia ad={left} />
        </aside>
      )}

      {/* Phones / tablets: mobile image of the left ad, above the content */}
      {left?.mobile_image && (
        <aside aria-label="Advertisement" className={`${mobileBanner} mb-4 ${mobileGap || (wrapClass ? "mt-4" : "")}`}>
          <AdMedia ad={left} />
        </aside>
      )}

      <div className={withAds ? "min-w-0 flex-1" : undefined}>{children}</div>

      {/* Phones / tablets: mobile image of the right ad, below the content */}
      {right?.mobile_image && (
        <aside aria-label="Advertisement" className={`${mobileBanner} ${mobileGap || "mt-4"} ${wrapClass ? "mb-6" : ""}`}>
          <AdMedia ad={right} />
        </aside>
      )}

      {right && (
        <aside aria-label="Advertisement" className={rail}>
          <AdMedia ad={right} />
        </aside>
      )}
    </div>
  );
}
