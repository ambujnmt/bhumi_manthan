import { useEffect, useState } from "react";
import { detectLocation } from "./fetchApi";

const STORAGE_KEY = "bm_user_location";
const CACHE_MINUTES = 30;
const DETECT_TIMEOUT = 6000;

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

// One request per page load, shared by every component using the hook
let detectRequest = null;

const loadLocation = () => {
  if (!detectRequest) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DETECT_TIMEOUT);

    detectRequest = detectLocation(controller.signal)
      .then((data) => {
        const latitude = Number(data?.latitude);
        const longitude = Number(data?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
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
        detectRequest = null; // failed -> try again on next page
        return null;
      })
      .finally(() => clearTimeout(timer));
  }

  return detectRequest;
};

/**
 * Visitor location for nearby listings, from IP (GET /api/location/detect).
 * No browser "Allow location" popup.
 *
 * ready = false   -> still detecting
 * location = null -> not found (show normal lists)
 */
export default function useUserLocation() {
  const [state, setState] = useState({ ready: false, location: null });

  useEffect(() => {
    const cached = readCache();

    if (cached?.location) {
      setState({ ready: true, location: cached.location });
      return;
    }

    let active = true;

    loadLocation().then((location) => {
      if (active) setState({ ready: true, location });
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
