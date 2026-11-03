import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSearchOptions } from "./fetchApi";

/*
|--------------------------------------------------------------------------
| Property search filters live in the URL (share / refresh keeps them)
| /web/property/searchProperties?type=residential&city=Gurgaon&localities=Sector 50
|   &budget_min=..&budget_max=..&property_types=apartment&bedrooms=2,3
|   &furnishing=furnished&sort=price_low
|--------------------------------------------------------------------------
*/

export const SEARCH_PATH = "/web/property/searchProperties";

const LIST_KEYS = ["localities", "property_types", "bedrooms", "furnishing"];
const TEXT_KEYS = ["type", "city", "q", "budget_min", "budget_max", "sort"];

export const EMPTY_FILTERS = {
  type: "", // category group slug ("" = first tab)
  city: "",
  q: "",
  localities: [],
  budget_min: "",
  budget_max: "",
  property_types: [],
  bedrooms: [],
  furnishing: [],
  sort: "newest",
};

// Locality names can have commas ("Sector 54, Golf Course Road"), so they are
// repeated in the URL (?localities=a&localities=b), never comma joined.
const NAME_LIST_KEYS = ["localities"];

const toList = (value, splitComma = true) =>
  (Array.isArray(value) ? value : [value])
    .flatMap((item) => (splitComma ? String(item ?? "").split(",") : [String(item ?? "")]))
    .map((item) => item.trim())
    .filter(Boolean);

export const filtersFromQuery = (query = {}) => {
  const filters = { ...EMPTY_FILTERS };

  TEXT_KEYS.forEach((key) => {
    if (typeof query[key] === "string" && query[key] !== "") filters[key] = query[key];
  });

  LIST_KEYS.forEach((key) => {
    filters[key] = toList(query[key], !NAME_LIST_KEYS.includes(key));
  });

  return filters;
};

// Only non-default values go to the URL / API
export const filtersToQuery = (filters) => {
  const query = {};

  TEXT_KEYS.forEach((key) => {
    const value = filters[key];
    if (value !== "" && value !== undefined && value !== null && value !== EMPTY_FILTERS[key]) {
      query[key] = String(value);
    }
  });

  LIST_KEYS.forEach((key) => {
    if (filters[key]?.length) {
      query[key] = NAME_LIST_KEYS.includes(key) ? [...filters[key]] : filters[key].join(",");
    }
  });

  return query;
};

// Filters for count / properties API (no type -> backend uses first tab)
export const filtersToApi = (filters) => filtersToQuery(filters);

// Search tab = category group (Residential / Commercial / Rental) from search options.
// type = tab key or old key (buy / rent)
export const findTab = (options, type) =>
  (options?.tabs || []).find((tab) => tab.key === type || tab.aliases?.includes(type)) || null;

// Same, but unknown / "" type = first tab (like backend)
export const resolveTab = (options, type) => findTab(options, type) || options?.tabs?.[0] || null;

export const countActiveFilters = (filters) =>
  (filters.budget_min ? 1 : 0) +
  (filters.budget_max ? 1 : 0) +
  filters.property_types.length +
  filters.bedrooms.length +
  filters.furnishing.length;

/**
 * { filters, setFilters(patch), resetFilters(), isReady, isSearch }
 * isSearch = false for homepage "View All" (?featured=1 / ?luxury=1) lists
 */
export default function useSearchFilters() {
  const router = useRouter();

  const filters = useMemo(() => filtersFromQuery(router.query), [router.query]);

  const isSearch = router.query.featured !== "1" && router.query.luxury !== "1";

  const setFilters = useCallback(
    (patch) => {
      const next = { ...filtersFromQuery(router.query), ...patch };

      // drop ?featured / ?luxury when user starts filtering
      router.push({ pathname: SEARCH_PATH, query: filtersToQuery(next) }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router]
  );

  const resetFilters = useCallback(
    (keep = {}) => {
      router.push({ pathname: SEARCH_PATH, query: filtersToQuery({ ...EMPTY_FILTERS, ...keep }) }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router]
  );

  return { filters, setFilters, resetFilters, isReady: router.isReady, isSearch };
}

/*
| Search options (cities, budgets, types, BHK, furnishing) - one request per page load
*/
let optionsRequest = null;
let optionsData = null; // last loaded options (same page, no wait on next mount)

const OPTIONS_CACHE_KEY = "bm_search_options";

// sessionStorage helpers (blocked storage -> just no cache)
export const readSessionCache = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
};

export const writeSessionCache = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // storage full / blocked
  }
};

const loadOptions = () => {
  if (!optionsRequest) {
    optionsRequest = getSearchOptions()
      .then((data) => {
        optionsData = data;
        writeSessionCache(OPTIONS_CACHE_KEY, data);
        return data;
      })
      .catch((error) => {
        optionsRequest = null;
        throw error;
      });
  }

  return optionsRequest;
};

// Cached options show at once (refresh / next page), fresh ones replace them
export function useSearchOptions() {
  const [options, setOptions] = useState(optionsData);

  useEffect(() => {
    let active = true;

    if (!optionsData) {
      const cached = readSessionCache(OPTIONS_CACHE_KEY);
      if (cached) setOptions(cached);
    }

    loadOptions()
      .then((data) => active && setOptions(data))
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return options;
}

// 500000 -> "₹5 L", 15000000 -> "₹1.5 Cr"
export const budgetLabel = (options, type, value) => {
  if (!value) return "";

  const found = options?.budgets?.[type]?.find((b) => String(b.value) === String(value));

  if (found) return `₹${found.label}`;

  const amount = Number(value);
  if (amount >= 10000000) return `₹${+(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${+(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
};
