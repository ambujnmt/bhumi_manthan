// Admin properties loaded on the listing page (same data as the detail API),
// so the detail page opens right away without a loader.
const CACHE_KEY = "admin_properties";

let cache = null;

const readCache = () => {
    if (cache) return cache;

    try {
        cache = JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
    } catch (e) {
        cache = {};
    }

    return cache;
};

const writeCache = () => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { }
};

export const saveCachedProperties = (properties = []) => {
    readCache();

    properties.forEach((property) => {
        if (property?.id) cache[property.id] = property;
    });

    writeCache();
};

export const saveCachedProperty = (property) => saveCachedProperties([property]);

export const getCachedProperty = (id) => (id ? readCache()[id] || null : null);
