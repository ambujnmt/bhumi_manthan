"use client";
import NextLink from "next/link";

import React, { useEffect, useRef, useState } from "react";
import {
  FiMapPin,
  FiGrid,
  FiList,
  FiChevronDown,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { Link } from "@heroui/react";
import { useRouter } from "next/router";

import { getHomeSectionProperties, searchProperties } from "../../../utils/fetchApi";
import useUserLocation from "../../../utils/useUserLocation";
import useSearchFilters, {
  SEARCH_PATH,
  filtersToApi,
  resolveTab,
  useSearchOptions,
} from "../../../utils/useSearchFilters";
import { formatDistance } from "../../../utils/formatPrice";
import WishlistButton from "../../Common/WishlistButton";
import Pagination from "../../Common/Pagination";
import { cardSpecs, priceInfo } from "../PropertyDetails/PropertySpecs";

// 15 properties per page (search, featured and luxury lists)
const PER_PAGE = 15;

export default function SearchPropertiesRightCol() {
  const router = useRouter();
  const { filters, setFilters, isReady, isSearch } = useSearchFilters();
  const tabLabel = resolveTab(useSearchOptions(), filters.type)?.label; // category group

  // ?featured=1 / ?luxury=1 (homepage "View All" buttons) -> only that section
  const featuredOnly = router.query.featured === "1";
  const luxuryOnly = !featuredOnly && router.query.luxury === "1";
  const sectionFilter = featuredOnly ? "featured" : luxuryOnly ? "luxury" : "";
  const sectionLabel = featuredOnly ? "Featured " : luxuryOnly ? "Luxury " : "";

  // IP location (same as home page, cached) -> Featured / Luxury "Near You", sort "Nearest"
  const { ready: locationReady, location: userLocation } = useUserLocation();
  const [nearby, setNearby] = useState(false);

  const [viewMode, setViewMode] = useState("grid");

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listTopRef = useRef(null);

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const sortOptions = [
    { key: "newest", label: "Newest" },
    { key: "price_low", label: "Price: Low to High" },
    { key: "price_high", label: "Price: High to Low" },
    ...(userLocation ? [{ key: "nearest", label: "Nearest First" }] : []),
  ];
  const sortLabel = sortOptions.find((o) => o.key === filters.sort)?.label || "Newest";

  // Search API params (same filters as sidebar count)
  const searchParams = {
    ...filtersToApi(filters),
    ...(filters.sort === "nearest" && userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : {}),
    per_page: PER_PAGE,
  };
  const searchKey = JSON.stringify(searchParams);

  // Current page belongs to one list: filters / section / sort / location change -> back to page 1
  // (kept together with its list key, so a filter change never fetches the old page first)
  const listKey = `${searchKey}|${sectionFilter}|${userLocation?.latitude ?? ""},${userLocation?.longitude ?? ""}`;
  const [pageState, setPageState] = useState({ key: listKey, page: 1 });
  const page = pageState.key === listKey ? pageState.page : 1;

  const goToPage = (value) => {
    setPageState({ key: listKey, page: value });

    // Back to the top of the list (below the fixed header)
    const top = listTopRef.current?.getBoundingClientRect().top;
    if (top !== undefined) {
      window.scrollTo({ top: window.scrollY + top - 130, behavior: "smooth" });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Properties
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isReady) return;

    // Featured / Luxury: wait for location (cached from home page -> instant)
    if (!isSearch && !locationReady) return;
    // Nearest sort needs location
    if (isSearch && filters.sort === "nearest" && !locationReady) return;

    const controller = new AbortController();

    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");

        if (isSearch) {
          // GET /api/search/properties (filters, sort, page)
          const data = await searchProperties({ ...JSON.parse(searchKey), page }, controller.signal);

          setProperties(data.properties || []);
          setPagination(data.pagination || null);
          setNearby(false);
          return;
        }

        let propertyList = [];
        let isNearby = false;

        // Nearest first when location is known
        if (userLocation) {
          const nearbyRes = await getHomeSectionProperties(sectionFilter, null, userLocation)
            .catch(() => null);

          propertyList = nearbyRes?.data?.properties || [];
          isNearby = propertyList.length > 0;
        }

        // Nothing near user / no location -> full list (no limit)
        if (!isNearby) {
          propertyList = (await getHomeSectionProperties(sectionFilter))?.data?.properties || [];
        }

        if (controller.signal.aborted) return;

        setProperties(propertyList);
        setPagination(null);
        setNearby(isNearby);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Property list error:", error);
        setError(error?.message || "Unable to fetch properties. Please try again.");
        setProperties([]);
        setPagination(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProperties();

    return () => controller.abort();
    // Search: each page comes from the API. Featured / Luxury: full list once, paged below.
  }, [isReady, isSearch, sectionFilter, locationReady, userLocation, searchKey, isSearch ? page : 0]);

  /*
  |--------------------------------------------------------------------------
  | Close sort dropdown when clicking outside
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const formatPrice = (price) => {
    if (!price) {
      return "Price on Request";
    }

    const amount = Number(price);

    if (Number.isNaN(amount)) {
      return price;
    }

    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }

    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lac`;
    }

    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatPostedDate = (date) => {
    if (!date) {
      return "Posted recently";
    }

    const createdDate = new Date(date);

    if (Number.isNaN(createdDate.getTime())) {
      return "Posted recently";
    }

    const now = new Date();

    const difference = now.getTime() - createdDate.getTime();

    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return "Posted just now";
    }

    if (minutes < 60) {
      return `Posted ${minutes} min ago`;
    }

    if (hours < 24) {
      return `Posted ${hours} hr ago`;
    }

    if (days === 1) {
      return "Posted yesterday";
    }

    if (days < 7) {
      return `Posted ${days} days ago`;
    }

    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `Posted ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }

    return `Posted ${createdDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const getPropertyTypeLabel = (property) => {
    if (property?.configuration && property?.property_type) {
      return `${property.configuration} ${property.property_type}`;
    }

    if (property?.configuration) {
      return property.configuration;
    }

    if (property?.property_type) {
      return property.property_type;
    }

    return "Property";
  };

  const getLocation = (property) => {
    const locationParts = [
      property?.location,
      property?.city,
      property?.state,
    ].filter(Boolean);

    return locationParts.length
      ? locationParts.join(", ")
      : "Location not available";
  };

  /*
  |--------------------------------------------------------------------------
  | List + sorting
  | Search: already filtered / sorted by API. Featured / Luxury: sort here.
  |--------------------------------------------------------------------------
  */

  const list = [...properties];

  if (!isSearch) {
    if (filters.sort === "price_low") {
      list.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (filters.sort === "price_high") {
      list.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    }
  }

  const total = isSearch ? pagination?.total ?? list.length : list.length;

  // Pages: search -> from API, featured / luxury -> 15 at a time from the full list
  const totalPages = isSearch
    ? pagination?.last_page || 1
    : Math.max(Math.ceil(list.length / PER_PAGE), 1);
  const currentPage = Math.min(page, totalPages);
  const shown = isSearch ? list : list.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const firstShown = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const lastShown = Math.min((currentPage - 1) * PER_PAGE + shown.length, total);

  const where = [
    filters.localities.length ? filters.localities.join(", ") : "",
    filters.city || (isSearch ? "India" : ""),
  ].filter(Boolean).join(", ");

  return (
    <>
      <main className="min-w-0 flex-1">

        {/* Header row */}

        <div ref={listTopRef} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {loading
                ? <span className="inline-block h-7 w-64 max-w-full animate-pulse rounded bg-gray-200 align-middle" aria-label="Loading properties" />
                : isSearch
                  ? `${total} ${tabLabel ? `${tabLabel} Properties` : "Properties"}${where ? ` in ${where}` : ""}`
                  : `${total} ${sectionLabel}Properties Found${nearby ? " Near You" : ""}`}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {featuredOnly
                ? nearby
                  ? "Handpicked featured listings closest to your current location"
                  : "Handpicked featured listings"
                : luxuryOnly
                  ? nearby
                    ? "Premium luxury listings closest to your current location"
                    : "Premium luxury listings"
                  : "Verified properties matching your search"}
              {!isSearch && (
                <>
                  {" · "}
                  <NextLink href={SEARCH_PATH} className="font-medium text-[#E87722] hover:underline">
                    Show all properties
                  </NextLink>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <span className="text-sm text-gray-500">
              Sort by
            </span>

            {/* Sort */}

            <div
              ref={sortRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              >
                {sortLabel}

                <FiChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">

                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setIsSortOpen(false);

                        if (isSearch) {
                          setFilters({ sort: option.key });
                        } else {
                          // Featured / Luxury: keep section, only change sort
                          router.replace({ pathname: router.pathname, query: { ...router.query, sort: option.key } }, undefined, { shallow: true, scroll: false });
                        }
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filters.sort === option.key
                          ? "font-semibold text-[var(--primary-color)]"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                </div>
              )}
            </div>

            {/* Grid/List */}

            <div className="flex overflow-hidden rounded-lg border border-gray-300">

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`flex h-9 w-9 items-center justify-center ${
                  viewMode === "grid"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FiGrid className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`flex h-9 w-9 items-center justify-center ${
                  viewMode === "list"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FiList className="h-4 w-4" />
              </button>

            </div>
          </div>
        </div>

        {/* Loading */}

        {/* Loading: grey cards in the same shape as the results (grid / list), so nothing jumps */}
        {loading && (
          <div
            aria-busy="true"
            aria-label="Loading properties"
            className={viewMode === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}
          >
            {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, index) =>
              viewMode === "grid" ? (
                <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="h-44 w-full bg-gray-200" />
                  <div className="space-y-2.5 px-2 py-3">
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="flex gap-3 pt-1">
                      <div className="h-3 w-12 rounded bg-gray-100" />
                      <div className="h-3 w-12 rounded bg-gray-100" />
                      <div className="h-3 w-16 rounded bg-gray-100" />
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      <div className="h-5 w-24 rounded bg-gray-200" />
                      <div className="h-8 w-24 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-gray-200 bg-white sm:flex-row">
                  <div className="h-48 w-full shrink-0 bg-gray-200 sm:h-auto sm:min-h-[176px] sm:w-64" />
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div className="space-y-2.5">
                      <div className="h-3 w-1/4 rounded bg-gray-200" />
                      <div className="h-5 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-1/3 rounded bg-gray-100" />
                      <div className="flex gap-4 pt-1">
                        <div className="h-3 w-14 rounded bg-gray-100" />
                        <div className="h-3 w-14 rounded bg-gray-100" />
                        <div className="h-3 w-20 rounded bg-gray-100" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="h-6 w-28 rounded bg-gray-200" />
                      <div className="h-9 w-28 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* No properties */}

        {!loading &&
          !error &&
          list.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
              <p className="text-sm text-gray-500">
                No properties found matching your search. Try removing a filter or choosing another locality.
              </p>
            </div>
          )}

        {/* ========================================================= */}
        {/* GRID VIEW */}
        {/* ========================================================= */}

        {!loading &&
          !error &&
          list.length > 0 &&
          viewMode === "grid" && (

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

              {shown.map((property) => {

                return (
                  <article
                    key={property.id || property.property_id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
                  >

                    {/* Image */}

                    <div className="relative h-44 w-full overflow-hidden">

                      {property.main_image ? (
                        <img
                          src={property.main_image}
                          alt={property.title || "Property"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-400">
                            No Image Available
                          </span>
                        </div>
                      )}

                      {/* Status */}

                      <span className="absolute left-3 top-3 rounded-md uppercase bg-[#009449] px-2 py-0.5 text-[11px] font-normal text-white">
                        {property.status || "Verified"}
                      </span>

                      {/* Heart */}

                      <WishlistButton propertyId={property.id} className="absolute right-3 top-3" />

                    </div>

                    {/* Content */}

                    <div className="px-2 py-3">

                      <div className="mb-1 flex items-center justify-between">

                        <span className="text-xs font-medium text-[var(--primary-color)]">
                          {getPropertyTypeLabel(property)}
                        </span>

                        {property.agent_verified && (
                          <MdVerified className="h-4 w-4 text-[#009449]" />
                        )}

                      </div>

                      <h3 className="mb-1 text-sm font-semibold text-gray-900">
                        {property.title || "Property"}
                      </h3>

                      <p className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                        <FiMapPin className="h-3.5 w-3.5" />

                        {getLocation(property)}
                        {formatDistance(property.distance_km) && (
                          <span className="ml-1 font-medium text-[#E87722]">
                            · {formatDistance(property.distance_km)}
                          </span>
                        )}
                      </p>

                      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                        {/* Facts by property type: beds / baths / area, plot area, washrooms, PG sharing ... */}
                        {cardSpecs(property).map(({ icon: Icon, text }) => (
                          <span key={text} className="flex items-center gap-1">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {text}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">

                        <div>

                          <p className="text-base font-bold text-[var(--primary-color)]">
                            {formatPrice(property.price)}
                            {property.price && priceInfo(property).perMonth && <span className="text-xs font-medium text-gray-500"> / month</span>}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {formatPostedDate(
                              property.created_at
                            )}
                          </p>

                        </div>

                        <Link
                          href={`/web/propertyDetail/${property.slug || property.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400"
                        >
                          View Details
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        {/* ========================================================= */}
        {/* LIST VIEW */}
        {/* ========================================================= */}

        {!loading &&
          !error &&
          list.length > 0 &&
          viewMode === "list" && (

            <div className="flex flex-col gap-3">

              {shown.map((property) => {

                return (
                  <article
                    key={property.id || property.property_id}
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md sm:flex-row"
                  >

                    {/* Image */}

                    <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-64">

                      {property.main_image ? (
                        <img
                          src={property.main_image}
                          alt={property.title || "Property"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-400">
                            No Image Available
                          </span>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-md uppercase bg-[#009449] px-2 py-0.5 text-[11px] font-normal text-white">
                        {property.status || "Verified"}
                      </span>

                    </div>

                    {/* Content */}

                    <div className="flex flex-1 flex-col justify-between p-4">

                      <div>

                        <div className="mb-1 flex items-center justify-between">

                          <span className="text-xs font-medium text-[var(--primary-color)]">
                            {getPropertyTypeLabel(property)}
                          </span>

                          <div className="flex items-center gap-2">

                            {property.agent_verified && (
                              <MdVerified className="h-4 w-4 text-[#009449]" />
                            )}

                            <WishlistButton propertyId={property.id} />

                          </div>

                        </div>

                        <h3 className="mb-1 text-sm font-semibold text-gray-900">
                          {property.title || "Property"}
                        </h3>

                        <p className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                          <FiMapPin className="h-3.5 w-3.5" />

                          {getLocation(property)}
                        {formatDistance(property.distance_km) && (
                          <span className="ml-1 font-medium text-[#E87722]">
                            · {formatDistance(property.distance_km)}
                          </span>
                        )}
                        </p>

                        <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                          {/* Facts by property type: beds / baths / area, plot area, washrooms, PG sharing ... */}
                          {cardSpecs(property).map(({ icon: Icon, text }) => (
                            <span key={text} className="flex items-center gap-1">
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                              {text}
                            </span>
                          ))}
                        </div>

                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">

                        <div>

                          <p className="text-base font-bold text-[var(--primary-color)]">
                            {formatPrice(property.price)}
                            {property.price && priceInfo(property).perMonth && <span className="text-xs font-medium text-gray-500"> / month</span>}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {formatPostedDate(
                              property.created_at
                            )}
                          </p>

                        </div>

                        <Link
                          href={`/web/propertyDetail/${property.slug || property.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400"
                        >
                          View Details
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        {/* Pagination: 15 per page (search, featured, luxury) */}

        {!loading && !error && list.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
            <p className="mb-0 text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{firstShown}–{lastShown}</span> of{" "}
              <span className="font-semibold text-gray-800">{total}</span> properties
            </p>

            <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} label="Property pages" />
          </div>
        )}

      </main>
    </>
  );
}
