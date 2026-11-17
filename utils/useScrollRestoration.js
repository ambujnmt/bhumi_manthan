import { useEffect } from "react";

const STORAGE_PREFIX = "bm_scroll:";
// Keep trying while lazy sections (sellers & brokers, events, blogs ...) load and the page grows
const RESTORE_FOR_MS = 4000;

// Next.js gives every history entry its own key; fallback = URL
const entryKey = () => {
    try {
        return window.history.state?.key || window.location.pathname + window.location.search;
    } catch (error) {
        return window.location.pathname + window.location.search;
    }
};

const savePosition = (key = entryKey()) => {
    try {
        sessionStorage.setItem(STORAGE_PREFIX + key, String(Math.round(window.scrollY)));
    } catch (error) {
        // storage blocked -> no restore for this page
    }
};

const savedPosition = (key) => {
    try {
        const value = Number(sessionStorage.getItem(STORAGE_PREFIX + key));
        return Number.isFinite(value) && value > 0 ? value : null;
    } catch (error) {
        return null;
    }
};

/**
 * Back / forward (and refresh) keep the scroll position.
 *
 * Browsers restore scroll right away, but many home sections load after that, so the page is
 * still short and ends up at the top. Here the saved position is applied again and again
 * until the page is tall enough (max 4 sec), and stops as soon as the visitor scrolls.
 * Normal link clicks still open the new page at the top.
 */
export default function useScrollRestoration(router) {
    useEffect(() => {
        if (typeof window === "undefined" || !("scrollRestoration" in window.history)) return;

        window.history.scrollRestoration = "manual";

        let stopRestore = null;
        let popKey = null;

        const restore = (key) => {
            stopRestore?.();

            const target = savedPosition(key);
            if (target === null) return;

            const startedAt = Date.now();
            let reachedAt = 0;
            let frame = 0;
            let stopped = false;

            const stop = () => {
                stopped = true;
                cancelAnimationFrame(frame);
                ["wheel", "touchstart", "keydown", "mousedown"].forEach((name) => window.removeEventListener(name, stop));
                stopRestore = null;
            };

            const step = () => {
                if (stopped) return;

                if (Math.abs(window.scrollY - target) >= 2) {
                    // "instant": a CSS smooth scroll would animate every try
                    window.scrollTo({ top: target, behavior: "instant" });
                    reachedAt = 0;
                } else if (!reachedAt) {
                    reachedAt = Date.now();
                }

                // Stayed in place for a moment (content above may still grow), or gave up
                if ((reachedAt && Date.now() - reachedAt > 600) || Date.now() - startedAt > RESTORE_FOR_MS) {
                    stop();
                    return;
                }

                frame = requestAnimationFrame(step);
            };

            // Visitor scrolls / clicks -> stop fighting them
            ["wheel", "touchstart", "keydown", "mousedown"].forEach((name) =>
                window.addEventListener(name, stop, { passive: true })
            );

            stopRestore = stop;
            frame = requestAnimationFrame(step);
        };

        // Leaving this page by a link -> remember where we were
        const onRouteStart = () => {
            if (popKey === null) savePosition();
        };

        // Back / forward: history already points to the entry we go to
        const onPopState = () => {
            clearTimeout(scrollTimer); // a pending save would land on the new entry
            popKey = entryKey();
        };

        const onRouteDone = () => {
            if (popKey !== null) {
                const key = popKey;
                popKey = null;
                restore(key);
            }
        };

        // Remember position while scrolling too (refresh / closing the tab)
        let scrollTimer = null;
        const onScroll = () => {
            // Going back / restoring: the page is changing size, don't overwrite the saved spot
            if (popKey !== null || stopRestore) return;

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => savePosition(), 150);
        };
        const onPageHide = () => savePosition();

        // First load after refresh or browser back from another site
        const navigation = performance.getEntriesByType?.("navigation")?.[0];
        if (navigation && ["reload", "back_forward"].includes(navigation.type)) {
            restore(entryKey());
        }

        window.addEventListener("popstate", onPopState);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("pagehide", onPageHide);
        router.events.on("routeChangeStart", onRouteStart);
        router.events.on("routeChangeComplete", onRouteDone);
        router.events.on("routeChangeError", onRouteDone);

        return () => {
            stopRestore?.();
            clearTimeout(scrollTimer);
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("pagehide", onPageHide);
            router.events.off("routeChangeStart", onRouteStart);
            router.events.off("routeChangeComplete", onRouteDone);
            router.events.off("routeChangeError", onRouteDone);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
