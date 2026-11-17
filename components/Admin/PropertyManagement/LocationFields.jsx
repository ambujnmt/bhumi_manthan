"use client";

import React, { useEffect, useState } from "react";
import { getAdminCitiesByState, getAdminLocations } from "@/utils/adminFetchApi";
import LocalityInput from "./LocalityInput";
import SearchableSelect from "./SearchableSelect";

/**
 * State -> City -> Locality / Sector (property form)
 * State & City dropdowns come from states / cities table.
 * Locality: saved localities of city + OpenStreetMap suggestions (<LocalityInput />);
 * a new one is saved to localities table by backend when the property is saved.
 *
 * values = { state, city, location } (names, same as property columns)
 * onChange(patch) -> merge into form
 */
export default function LocationFields({ values, onChange, inputClass, labelClass }) {
    const [states, setStates] = useState([]);
    const [statesLoading, setStatesLoading] = useState(true);
    const [cities, setCities] = useState([]);
    const [citiesLoading, setCitiesLoading] = useState(false);

    const selectedState = states.find((s) => s.name === values.state);
    const selectedCity = cities.find((c) => c.name === values.city);

    // States dropdown
    useEffect(() => {
        getAdminLocations("states")
            .then((res) => setStates(res?.data?.states || []))
            .catch(() => setStates([]))
            .finally(() => setStatesLoading(false));
    }, []);

    // Cities of selected state
    useEffect(() => {
        if (!selectedState) {
            setCities([]);
            return;
        }

        let cancelled = false;
        setCitiesLoading(true);

        getAdminCitiesByState(selectedState.id)
            .then((res) => !cancelled && setCities(res?.data?.cities || []))
            .catch(() => !cancelled && setCities([]))
            .finally(() => !cancelled && setCitiesLoading(false));

        return () => {
            cancelled = true;
        };
    }, [selectedState?.id]);

    return (
        <>
            {/* State */}
            <div>
                <label htmlFor="state" className={labelClass}>
                    State<span className="ml-1 text-red-500">*</span>
                </label>
                <SearchableSelect
                    id="state"
                    name="state"
                    value={values.state}
                    options={states.map((state) => ({ value: state.name, label: state.name }))}
                    onChange={(state) => {
                        if (state !== values.state) {
                            onChange({ state, city: "", location: "" });
                        }
                    }}
                    placeholder="Select State"
                    searchPlaceholder="Search state..."
                    emptyText="No state found"
                    loading={statesLoading}
                    required
                />
                {/* old value not in table (e.g. edit) */}
                {values.state && !statesLoading && !selectedState && (
                    <p className="mt-1 mb-0 text-xs text-amber-600">
                        "{values.state}" is not in states list. Please select again.
                    </p>
                )}
            </div>

            {/* City */}
            <div>
                <label htmlFor="city" className={labelClass}>
                    City<span className="ml-1 text-red-500">*</span>
                </label>
                <SearchableSelect
                    id="city"
                    name="city"
                    value={values.city}
                    options={cities.map((city) => ({ value: city.name, label: city.name }))}
                    onChange={(city) => {
                        if (city !== values.city) {
                            onChange({ city, location: "" });
                        }
                    }}
                    placeholder={
                        !values.state
                            ? "Select state first"
                            : !selectedState || cities.length
                                ? "Select City"
                                : "No city in this state"
                    }
                    searchPlaceholder="Search city..."
                    emptyText="No city found"
                    loading={citiesLoading}
                    disabled={!selectedState}
                    required
                />
                {values.city && selectedState && !citiesLoading && !selectedCity && (
                    <p className="mt-1 mb-0 text-xs text-amber-600">
                        "{values.city}" is not in {selectedState.name} cities. Please select again.
                    </p>
                )}
            </div>

            {/* Locality / Sector */}
            <div>
                <label htmlFor="location" className={labelClass}>
                    Locality / Sector<span className="ml-1 text-red-500">*</span>
                </label>
                <LocalityInput
                    city={selectedCity}
                    value={values.location}
                    onChange={(location) => onChange({ location })}
                    inputClass={inputClass}
                />
            </div>
        </>
    );
}
