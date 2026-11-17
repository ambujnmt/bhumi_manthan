"use client";

import React, { useEffect, useState } from "react";
import { getPropertyCategories } from "@/utils/fetchApi";

/**
 * Category -> Sub Category (property form)
 * Options come from property categories (active only).
 * Backend saves the sub category name as property_type.
 *
 * values = { category_id, sub_category_id }
 * onChange(patch) -> merge into form
 * onSelection({ categorySlug, subSlug }) -> selected slugs (form shows fields for that type)
 */
export default function CategoryFields({ values, onChange, inputClass, labelClass, onSelection }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPropertyCategories()
            .then((res) => setCategories(res?.data?.categories || []))
            .catch(() => setCategories([]))
            .finally(() => setLoading(false));
    }, []);

    const selectedCategory = categories.find((c) => String(c.id) === String(values.category_id));
    const subCategories = selectedCategory?.children || [];
    const selectedSub = subCategories.find((c) => String(c.id) === String(values.sub_category_id));

    // Tell the form which category / type is selected (also after a saved property loads)
    const categorySlug = selectedCategory?.slug || "";
    const subSlug = selectedSub?.slug || "";

    useEffect(() => {
        onSelection?.({ categorySlug, subSlug });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categorySlug, subSlug]);

    return (
        <>
            {/* Category group */}
            <div>
                <label htmlFor="category_id" className={labelClass}>
                    Category<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                    id="category_id"
                    name="category_id"
                    value={selectedCategory ? String(selectedCategory.id) : ""}
                    onChange={(event) => onChange({ category_id: event.target.value, sub_category_id: "" })}
                    required
                    disabled={loading}
                    className={inputClass}
                >
                    <option value="">{loading ? "Loading..." : "Select Category"}</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {/* saved category deleted / inactive (e.g. edit) */}
                {values.category_id && !loading && !selectedCategory && (
                    <p className="mt-1 mb-0 text-xs text-amber-600">
                        Saved category is not available. Please select again.
                    </p>
                )}
            </div>

            {/* Sub category -> property_type */}
            <div>
                <label htmlFor="sub_category_id" className={labelClass}>
                    Property Type<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                    id="sub_category_id"
                    name="sub_category_id"
                    value={selectedSub ? String(selectedSub.id) : ""}
                    onChange={(event) => onChange({ sub_category_id: event.target.value })}
                    required
                    disabled={!selectedCategory}
                    className={inputClass}
                >
                    <option value="">
                        {selectedCategory ? "Select Property Type" : "Select category first"}
                    </option>
                    {subCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                            {sub.name}
                        </option>
                    ))}
                </select>
                {values.sub_category_id && selectedCategory && !selectedSub && (
                    <p className="mt-1 mb-0 text-xs text-amber-600">
                        Saved property type is not available. Please select again.
                    </p>
                )}
            </div>
        </>
    );
}
