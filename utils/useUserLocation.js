import { useEffect, useState } from "react";
import { detectLocation } from "./fetchApi";

const STORAGE_KEY = "bm_user_location";
// Saved location is only for an instant first paint; it is re-checked on every page
const CACHE_MINUTES = 30;
const DETECT_TIMEOUT = 6000;
// Components mounting together (home sections, header) share one detect request
const SHARE_MS = 60 * 1000;

const readCache = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");

    if (saved && Date.now() - saved.time < CACHE_MINUTES * 60 * 1000) {
      return saved;
    }
  } catch (error) {
    // storage blocked / bad JSON -> detect again
  }

  return null;
};

const writeCache = (value) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, time: Date.now() }));
  } catch (error) {
    // storage blocked -> location is detected again next page load
  }
};

let detectRequest = null;
let detectStartedAt = 0;

/**
 * Detect from IP. Resolves:
 *   { latitude, longitude, city, state } -> found
 *   null                                 -> IP has no location
 *   undefined                            -> request failed (keep what we have)
 */
const loadLocation = () => {
  if (detectRequest && Date.now() - detectStartedAt < SHARE_MS) {
    return detectRequest;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DETECT_TIMEOUT);

  detectStartedAt = Date.now();
  detectRequest = detectLocation(controller.signal)
    .then((data) => {
      const latitude = Number(data?.latitude);
      const longitude = Number(data?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        writeCache({ location: null }); // old saved location is no longer right
        return null;
      }

      const location = {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        city: data.city || null,
        state: data.state || null,
      };

      writeCache({ location });
      return location;
    })
    .catch(() => {
      detectRequest = null; // failed -> try again next time
      return undefined;
    })
    .finally(() => clearTimeout(timer));

  return detectRequest;
};

// Same place (about 1 km) -> keep the old object so lists don't reload
const samePlace = (a, b) =>
  (!a && !b) ||
  Boolean(a && b && Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01);

/**
 * Visitor location for nearby listings, from IP (GET /api/location/detect).
 * No browser "Allow location" popup.
 *
 * Saved location shows instantly, and is checked again in the background on every page:
 * IP changed (VPN / network) -> new location -> nearby lists reload right away.
 *
 * ready = false   -> still detecting
 * location = null -> not found (show normal lists)
 */
export default function useUserLocation() {
  const [state, setState] = useState({ ready: false, location: null });

  useEffect(() => {
    let active = true;

    const cached = readCache();

    if (cached?.location) {
      setState({ ready: true, location: cached.location });
    }

    loadLocation().then((location) => {
      if (!active) return;

      // Check failed -> keep saved location (or none)
      if (location === undefined) {
        if (!cached?.location) setState({ ready: true, location: null });
        return;
      }

      setState((previous) =>
        previous.ready && samePlace(previous.location, location) ? previous : { ready: true, location }
      );
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
