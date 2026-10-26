import { useEffect, useState } from "react";
import useUserLocation from "./useUserLocation";
import { getHomeSectionProperties, getNearbyHome, getProjects, getProperties } from "./fetchApi";

const list = (value) => (Array.isArray(value) ? value : []);

const CACHE_KEY = "bm_home_listings";

// Home shows only this many featured cards ("View All" shows the full list)
const FEATURED_ON_HOME = 4;

// Last shown listings -> shown instantly after page refresh
const readCache = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
  } catch (error) {
    return null;
  }
};

const writeCache = (value) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch (error) {
    // storage blocked -> no instant listings next refresh
  }
};

// Normal lists (no location): featured -> latest, luxury, projects
// Also used by pages/index.jsx (server) so sections come with the HTML.
export const loadDefaultListings = async () => {
  const pick = async (fallback) => ({
    items: list(await fallback().catch(() => [])),
    nearby: false,
  });

  const [featured, luxury, projects] = await Promise.all([
    pick(async () => {
      const featuredItems = list(
        (await getHomeSectionProperties("featured", FEATURED_ON_HOME))?.data?.properties
      );

      return featuredItems.length > 0
        ? featuredItems
        : list((await getProperties())?.data?.properties).slice(0, FEATURED_ON_HOME);
    }),

    pick(async () => (await getHomeSectionProperties("luxury", 3))?.data?.properties),

    pick(async () => (await getProjects(5))?.data?.projects),
  ]);

  return { location: null, featured, luxury, projects };
};

/**
 * Homepage listings, same API as mobile app (/nearby/home).
 *
 * 1. initialListings (loaded on server with the page) -> shown in the HTML
 * 2. Last listings from cache -> shown instantly on refresh
 * 3. Otherwise normal lists load right away (no waiting for location)
 * 4. IP location ready (/api/location/detect) -> nearest first ("near you")
 *
 * Section empty near user / no location -> normal list, so sections never go blank.
 *
 * Each section: { items: [], nearby: bool }
 */
export default function useHomeListings(initialListings = null) {
  const { ready, location } = useUserLocation();

  const [state, setState] = useState(() =>
    initialListings
      ? { ...initialListings, loading: false }
      : {
          loading: true,
          location: null,
          featured: { items: [], nearby: false },
          luxury: { items: [], nearby: false },
          projects: { items: [], nearby: false },
        }
  );

  // Instant: cached listings, otherwise normal lists while location is pending
  useEffect(() => {
    let active = true;

    const cached = readCache();

    if (cached) {
      setState({ ...cached, loading: false });
      return;
    }

    // Server already sent normal lists with the page
    if (initialListings) {
      return;
    }

    loadDefaultListings().then((listings) => {
      if (!active) return;

      // Nearby result may already be there -> do not overwrite it
      setState((previous) => (previous.loading ? { ...listings, loading: false } : previous));
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    let active = true;

    const load = async () => {
      const nearby = location
        ? await getNearbyHome(location).then((res) => res?.data).catch(() => null)
        : null;

      // Normal lists: from server if available, otherwise load once
      const defaults = (() => {
        let promise = initialListings ? Promise.resolve(initialListings) : null;
        return () => (promise ||= loadDefaultListings());
      })();

      // Nearby list first, otherwise normal list
      const pick = async (nearbyItems, key) =>
        list(nearbyItems).length > 0
          ? { items: nearbyItems, nearby: true }
          : (await defaults())[key];

      const [featured, luxury, projects] = await Promise.all([
        // Featured: nearby featured -> any property near user -> normal list
        pick(
          list(nearby?.featured_properties).length > 0
            ? nearby.featured_properties
            : nearby?.properties,
          "featured"
        ),
        pick(nearby?.luxury_properties, "luxury"),
        pick(nearby?.projects, "projects"),
      ]);

      const listings = {
        location: nearby?.location ?? null,
        featured,
        luxury,
        projects,
      };

      if (active) {
        writeCache(listings);
        setState({ ...listings, loading: false });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [ready, location]);

  return state;
}
