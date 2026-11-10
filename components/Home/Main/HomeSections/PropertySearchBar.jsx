"use client";

import NextLink from "next/link";
import SearchBar from "../../../Innerpages/SearchProperties/SearchBar";
import { SEARCH_PATH, useSearchOptions } from "../../../../utils/useSearchFilters";

/**
 * Home page search (same filter as search page / app):
 * Buy / Rent / Commercial -> City -> Locality (+ similar) -> Search page
 */
export default function PropertySearchBar() {
  const options = useSearchOptions();

  // Popular Searches: cities with most properties
  const popularCities = (options?.cities || [])
    .filter((city) => city.properties_count > 0)
    .slice(0, 5);

  // Row is there from the first paint (skeleton until options load) -> box does not jump
  const popularSearches = (!options || popularCities.length > 0) && (
    <div className="mt-4 sm:flex sm:min-h-[34px] sm:flex-wrap sm:items-center sm:gap-2">
      <span className="mb-2 block text-sm text-white/60 sm:mb-0 sm:mr-1">Popular Searches:</span>
      <div className="flex min-h-[34px] flex-wrap items-center gap-2 sm:contents">
      {!options
        ? [150, 140, 160, 160, 130].map((width, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="h-[34px] shrink-0 animate-pulse rounded-full bg-white/10"
              style={{ width }}
            />
          ))
        : popularCities.map((city) => (
            <NextLink
              key={city.name}
              href={{ pathname: SEARCH_PATH, query: { city: city.name } }}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 text-xs text-white/90 no-underline transition-colors hover:bg-white/10 hover:text-white sm:text-sm"
            >
              Properties in {city.name}
            </NextLink>
          ))}
      </div>
    </div>
  );

  return (
    <div className="container mt-6 lg:mt-8">
      <SearchBar mode="home" footer={popularSearches} />
    </div>
  );
}
