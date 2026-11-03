import React from "react";
import { META_DESCRIPTION_LIMIT, META_TITLE_LIMIT, slugify } from "../../utils/seo";

const CharCount = ({ length, limit }) => (
    <span className={`text-xs font-normal ${length > limit ? "text-amber-700" : "text-[#62748E]"}`}>
        {length}/{limit}
    </span>
);

// URL, meta title, description and keywords (+ Google result preview).
// seo: what the public page will output for the current values (utils/seo.js).
export default function SeoFields({
    values,
    onChange,
    seo,
    urlPath,
    savedSlug = "",
    titlePlaceholder = "",
    keywordsPlaceholder = "",
    inputClass,
    labelClass,
}) {
    const slug = slugify(values.slug) || slugify(values.title) || "page-url";

    const handleChange = (event) => {
        onChange({ [event.target.name]: event.target.value });
    };

    // While typing, keep the trailing hyphen so "3-bhk-" can become "3-bhk-flat"
    const handleSlugChange = (event) => {
        onChange({
            slug: event.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+/, ""),
        });
    };

    const handleSlugBlur = () => {
        onChange({ slug: slugify(values.slug) });
    };

    return (
        <section className="mb-8">
            <h3 className="mb-2 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                SEO Settings
            </h3>

            <p className="mb-5 text-sm text-[#62748E]">
                Optional. Controls how this page appears on Google. Empty fields are filled automatically.
            </p>

            <div className="grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2">
                <div className="flex flex-col gap-5">
                    <div>
                        <label htmlFor="slug" className={labelClass}>URL Slug</label>
                        <input
                            id="slug"
                            name="slug"
                            type="text"
                            maxLength={255}
                            value={values.slug}
                            onChange={handleSlugChange}
                            onBlur={handleSlugBlur}
                            placeholder={slugify(values.title) || "page-url"}
                            className={inputClass}
                        />
                        {savedSlug && slugify(values.slug) !== savedSlug && (
                            <p className="mt-1.5 text-xs text-amber-700">
                                Old links to this page will stop working after you save a new URL.
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="meta_title" className={labelClass}>Meta Title</label>
                            <CharCount length={values.meta_title.length} limit={META_TITLE_LIMIT} />
                        </div>
                        <input
                            id="meta_title"
                            name="meta_title"
                            type="text"
                            maxLength={255}
                            value={values.meta_title}
                            onChange={handleChange}
                            placeholder={titlePlaceholder}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="meta_description" className={labelClass}>Meta Description</label>
                            <CharCount length={values.meta_description.length} limit={META_DESCRIPTION_LIMIT} />
                        </div>
                        <textarea
                            id="meta_description"
                            name="meta_description"
                            rows={3}
                            maxLength={500}
                            value={values.meta_description}
                            onChange={handleChange}
                            placeholder="Short summary shown under the title in search results"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="meta_keywords" className={labelClass}>Meta Keywords</label>
                        <input
                            id="meta_keywords"
                            name="meta_keywords"
                            type="text"
                            maxLength={500}
                            value={values.meta_keywords}
                            onChange={handleChange}
                            placeholder={keywordsPlaceholder}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <span className={labelClass}>Search Preview</span>
                    <div className="mt-1.5 rounded-lg border border-gray-200 bg-white p-4">
                        <p className="truncate text-xs text-[#62748E]">{urlPath}{slug}</p>
                        <p className="mt-1 line-clamp-2 break-words text-lg leading-snug text-[#1a0dab]">{seo.title}</p>
                        <p className="mt-1 line-clamp-3 break-words text-sm text-[#4d5156]">
                            {seo.description || "Add a description to see it here."}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
