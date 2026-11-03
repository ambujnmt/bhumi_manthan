"use client";
import { Link } from '@heroui/react'
import React from 'react'
import SearchBar from './SearchBar';
import SearchPropertiesLeftCol from './SearchPropertiesLeftCol';
import SearchPropertiesRightCol from './SearchPropertiesRightCol';
import useSearchFilters, { resolveTab, useSearchOptions } from '../../../utils/useSearchFilters';
import HeroCarousel from '../../Home/Main/HomeSections/HeroCarousel'
/**
 * Property search page
 * Search bar: tab -> city -> localities (+ similar)
 * Sidebar: budget / type / BHK / furnishing -> "Show N Properties"
 * All filters are in the URL (see utils/useSearchFilters.js)
 */
export default function SearchProperties() {
    const { filters } = useSearchFilters();
    // Heading from selected category group (Residential Properties ...)
    const tab = resolveTab(useSearchOptions(), filters.type);
    const heading = tab ? `${tab.label} Properties` : "Properties";

    return (
        <>
            <section>
                <div>
                    <HeroCarousel/>
                </div>
              <div className="bg-[#eaeff5] py-10">
                <div className="container">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12">
                            <div className="flex mb-4">
                                <Link href="/" className="text-[14px] text-[var(--text-color2)]">Home </Link>
                                <p className="text-[14px] text-[var(--text-color2)] mb-0">&nbsp; / &nbsp;{heading}</p>
                            </div>
                            <h2 className="text-[28px] font-bold text-[var(--text-color1)]">
                                {heading} in {filters.city || "India"}
                            </h2>
                            <p className="text-[16px] text-[var(--text-color2)] mb-4">
                                Discover verified homes from trusted owners, builders and agents.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div className="container xl:mt-0 lg:mt-0 mt-[50px]">
                    <SearchBar />
                </div>
              </div>

                <div className="min-h-screen mt-5">
                  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      {/* Sidebar Filters */}
                      <SearchPropertiesLeftCol />

                      {/* Results */}
                      <SearchPropertiesRightCol />
                    </div>
                  </div>
                </div>
            </section>
        </>
    )
}
