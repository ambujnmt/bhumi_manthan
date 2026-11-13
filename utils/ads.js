// Website ads: page keys, placement keys + loading ads from the API.
// Admin -> Ads: admin ticks, per page, Left and / or Right. The ad shows beside the page
// content on that side (same as home "Featured Properties").
//
// New page:
//   1. backend  App\Models\Ad::PAGES -> 'xyz' => 'Xyz'
//   2. here     SIDE_AD_PAGES        -> "/web/xyz": "xyz"
//   3. page     wrap the content between <Header /> and <Footer /> in <SideAds>...</SideAds>
// The admin checkbox list comes from the API, so the new page shows there on its own.

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Same keys as backend App\Models\Ad::placementKey()
export const AD_PLACEMENTS = {
  HOME_FEATURED_LEFT: "home_featured_left",
  HOME_FEATURED_RIGHT: "home_featured_right",
};

// Page URL (Next.js route, router.pathname) -> page key (backend App\Models\Ad::PAGES).
// Home is not here: its ads sit inside the Featured Properties section (AD_PLACEMENTS).
export const SIDE_AD_PAGES = {
  "/web/property/searchProperties": "search_properties",
  "/web/propertyDetail/[id]": "property_detail",
  "/web/project": "projects",
  "/web/project/projectDetail/[id]": "project_detail",
  "/web/events": "events",
  "/web/events/[slug]": "event_detail",
  "/web/blog": "blog",
  "/web/blog/[slug]": "blog_detail",
  "/web/videoTour": "video_tour",
  "/web/plans": "plans",
  "/web/compare": "compare",
  "/user/cms/contactUs": "cms",
  "/user/cms/faqs": "cms",
  "/user/cms/privacyPolicy": "cms",
  "/user/cms/termsAndCondition": "cms",
};

export const sideAdPage = (pathname) => SIDE_AD_PAGES[pathname] || null;

// Page key -> its left / right placement keys
export const sideAdPlacements = (page) => ({
  left: `page_${page}_left`,
  right: `page_${page}_right`,
});

// placement -> { promise: Promise<ad | null>, at } (reused for 5 min while moving between pages)
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();
// placements asked for in the same moment -> one API call
let pending = new Map();
let timer = null;

const flush = async () => {
  const batch = pending;
  pending = new Map();
  timer = null;

  let ads = {};

  try {
    const query = encodeURIComponent([...batch.keys()].join(","));
    const response = await fetch(`${BASE_URL}ads?placements=${query}`, { headers: { Accept: "application/json" } });
    const data = await response.json();

    if (response.ok && data?.status) ads = data.data?.ads || {};
  } catch {
    // API down -> no ads, pages show their fallback
  }

  batch.forEach((resolve, placement) => {
    const ad = ads[placement] || null;
    resolved.set(placement, ad);
    resolve(ad);
  });
};

// placement -> ad | null, once known (read synchronously -> first render already right, no blink)
const resolved = new Map();

/**
 * Ad already known for this placement, without waiting:
 * ad | null (known, none set) | undefined (not loaded yet)
 */
export const peekAd = (placement) => {
  const saved = cache.get(placement);
  if (!saved || Date.now() - saved.at >= CACHE_MS) return undefined;

  return resolved.has(placement) ? resolved.get(placement) : undefined;
};

/**
 * Ads loaded on the server (getStaticProps) -> cache, so the browser does not ask again.
 * ads = { placement: ad | null }
 */
export const primeAds = (ads) => {
  if (!ads || typeof ads !== "object") return;

  // Server data is the newest -> always replaces (same data on server render + browser, no mismatch)
  Object.entries(ads).forEach(([placement, ad]) => {
    const current = resolved.get(placement);

    // Same ad as cached -> keep the cached object (components compare by reference, no re-render)
    if (current && ad && current.id === ad.id && JSON.stringify(current) === JSON.stringify(ad)) return;

    resolved.set(placement, ad || null);
    cache.set(placement, { promise: Promise.resolve(ad || null), at: Date.now() });
  });
};

/**
 * Server side (getStaticProps): ads of these placements -> { placement: ad | null }, null if API down
 */
export const loadAdsOnServer = async (placements) => {
  try {
    const query = encodeURIComponent(placements.join(","));
    const response = await fetch(`${BASE_URL}ads?placements=${query}`, { headers: { Accept: "application/json" } });
    const data = await response.json();

    return response.ok && data?.status ? data.data?.ads || {} : null;
  } catch {
    return null;
  }
};

/**
 * Ad of one placement (first active ad, lowest display order) or null.
 * All AdSlots on a page share a single request.
 */
export const fetchAd = (placement) => {
  if (!placement) return Promise.resolve(null);

  const saved = cache.get(placement);
  if (saved && Date.now() - saved.at < CACHE_MS) return saved.promise;

  const promise = new Promise((resolve) => {
    pending.set(placement, resolve);
    if (!timer) timer = setTimeout(flush, 0);
  });

  cache.set(placement, { promise, at: Date.now() });
  return promise;
};

// After admin changes an ad (or for a fresh load): forget saved ads
export const clearAdCache = () => {
  cache.clear();
  resolved.clear();
};
