import { useEffect, useMemo, useState } from "react";
import { getEvents } from "./fetchApi";
import useNow from "./useNow";
import useUserLocation from "./useUserLocation";
import { isEventLive } from "../components/Innerpages/Events/eventUtils";

const CACHE_KEY = "bm_live_events";
// Short cache: an event edited in admin shows up within a minute
const CACHE_MINUTES = 1;

// Cache / request key: nearby list is per place, "all" when location is unknown
const placeKey = (location) =>
    location ? `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}` : "all";

const readCache = (key) => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        return saved && saved.key === key && Date.now() - saved.time < CACHE_MINUTES * 60 * 1000 ? saved.events : null;
    } catch (error) {
        return null;
    }
};

const writeCache = (key, events) => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, events, time: Date.now() }));
    } catch (error) {
        // storage blocked -> fetched again next page
    }
};

// One request per page load (per place), shared by header (desktop + mobile)
const requests = {};

const loadEvents = (location) => {
    const key = placeKey(location);
    const cached = readCache(key);
    if (cached) return Promise.resolve(cached);

    if (!requests[key]) {
        // With location: only events within 50 km, nearest first (backend)
        requests[key] = getEvents(50, location)
            .then((res) => {
                const events = Array.isArray(res?.data?.events) ? res.data.events : [];
                writeCache(key, events);
                return events;
            })
            .catch(() => [])
            .finally(() => {
                delete requests[key];
            });
    }

    return requests[key];
};

/**
 * Events that are LIVE right now (started, not ended), rechecked every 30 sec.
 * Visitor location known (IP) -> only live events near them, nearest first.
 * Location not found -> all live events (as before).
 * [] on the server / first render / while location is being detected.
 */
export default function useLiveEvents() {
    const [events, setEvents] = useState([]);
    const now = useNow(30000);
    const { ready, location } = useUserLocation();

    // Load once location is known, reload every 2 min (new / edited events while the page is open)
    useEffect(() => {
        if (!ready) return;

        let active = true;

        const load = () => loadEvents(location).then((list) => active && setEvents(list));

        load();
        const timer = setInterval(load, 2 * 60 * 1000);

        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [ready, location]);

    return useMemo(() => (now ? events.filter((event) => isEventLive(event, now)) : []), [events, now]);
}
