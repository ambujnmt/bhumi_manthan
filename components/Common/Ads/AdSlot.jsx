import { useEffect, useState } from "react";
import AdMedia from "./AdMedia";
import { fetchAd, peekAd } from "../../../utils/ads";

/**
 * Ad spot for any page. Shows the active ad of this placement (Admin -> Ads).
 *
 *   <AdSlot placement={AD_PLACEMENTS.HOME_FEATURED_LEFT} />
 *   <AdSlot placement="..." fallback={<MyDefaultBanner />} className="mt-4" />
 *
 * placement : key from utils/ads.js
 * fallback  : shown while loading and when no ad is active (default: nothing)
 * shape     : "tall" (side column, default) | "wide" (banner) -> size of video embeds
 * wrapper   : (adElement) => element, only used when there is an ad (e.g. spacing box)
 * className : extra classes on the ad (image / video / embed)
 *
 * No blink: an ad already loaded (other page / server) shows on the first render.
 */
export default function AdSlot({ placement, fallback = null, shape = "tall", wrapper = null, className = "", alt = "Advertisement" }) {
  const [ad, setAd] = useState(() => peekAd(placement) || null);

  useEffect(() => {
    let active = true;

    setAd((previous) => {
      const known = peekAd(placement);
      return known === undefined || known === previous ? previous : known;
    });

    fetchAd(placement).then((result) => {
      if (active) setAd((previous) => (previous === result ? previous : result));
    });

    return () => {
      active = false;
    };
  }, [placement]);

  if (!ad) return fallback;

  const element = <AdMedia ad={ad} alt={alt} shape={shape} className={className} />;

  return wrapper ? wrapper(element) : element;
}
