"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiPlus, FiX } from "react-icons/fi";
import { getAdminFooter, getAdminLocations, saveFooter } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import footerDefaults, { mergeFooter } from "../../../utils/footerDefaults";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const smallInputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const socialFields = [
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourpage" },
    { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourpage" },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
];

const MAX_COLUMNS = 4;
const MAX_FOOTER_CITIES = 100;

// Card wrapper for each settings block
const Section = ({ title, hint, children }) => (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-[#001737]">{title}</h3>
            {hint && <p className="mt-1 text-xs text-[#62748E]">{hint}</p>}
        </div>
        {children}
    </section>
);

// Editable list of { title, href }
const LinkRows = ({ links, onChange, addLabel = "Add Link", max = 15 }) => {
    const update = (index, field, value) =>
        onChange(links.map((link, i) => (i === index ? { ...link, [field]: value } : link)));

    return (
        <div className="space-y-2">
            {links.map((link, index) => (
                <div key={index} className="grid grid-cols-[1fr_1.3fr_auto] gap-2">
                    <input
                        value={link.title}
                        onChange={(e) => update(index, "title", e.target.value)}
                        placeholder="Link title"
                        className={smallInputClass}
                    />
                    <input
                        value={link.href}
                        onChange={(e) => update(index, "href", e.target.value)}
                        placeholder="/web/blog or https://..."
                        className={smallInputClass}
                    />
                    <button
                        type="button"
                        onClick={() => onChange(links.filter((_, i) => i !== index))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove link"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            ))}

            {links.length < max && (
                <button
                    type="button"
                    onClick={() => onChange([...links, { title: "", href: "" }])}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E87722] hover:underline"
                >
                    <FiPlus size={14} /> {addLabel}
                </button>
            )}
        </div>
    );
};

// Pick which cities show in footer "Major Cities" (selected order = footer order)
const CityPicker = ({ allCities, selectedIds, onChange }) => {
    const [search, setSearch] = useState("");

    const byId = new Map(allCities.map((city) => [city.id, city]));
    const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean);

    const term = search.trim().toLowerCase();
    const filtered = allCities.filter(
        (city) =>
            !term ||
            city.name.toLowerCase().includes(term) ||
            (city.state?.name || "").toLowerCase().includes(term)
    );

    const toggle = (id) =>
        onChange(
            selectedIds.includes(id)
                ? selectedIds.filter((item) => item !== id)
                : selectedIds.length < MAX_FOOTER_CITIES
                    ? [...selectedIds, id]
                    : selectedIds
        );

    return (
        <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className={labelClass}>
                    Cities to show <span className="font-normal text-[#62748E]">({selected.length} selected)</span>
                </p>
                <div className="flex gap-3 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => onChange(allCities.filter((c) => c.is_active).map((c) => c.id).slice(0, MAX_FOOTER_CITIES))}
                        className="text-[#E87722] hover:underline"
                    >
                        Select all active
                    </button>
                    <button type="button" onClick={() => onChange([])} className="text-red-600 hover:underline">
                        Clear
                    </button>
                </div>
            </div>

            {/* Selected (footer order) */}
            <div className="mb-3 flex min-h-[44px] flex-wrap gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-2">
                {selected.length === 0 && (
                    <span className="px-1 py-1 text-xs text-[#62748E]">No city selected. Major Cities will be hidden in footer.</span>
                )}
                {selected.map((city) => (
                    <span
                        key={city.id}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            city.is_active ? "bg-orange-50 text-[#E87722]" : "bg-gray-100 text-gray-500"
                        }`}
                        title={city.is_active ? "" : "Inactive city - not shown on website"}
                    >
                        {city.name}
                        {!city.is_active && " (inactive)"}
                        <button type="button" onClick={() => toggle(city.id)} aria-label={`Remove ${city.name}`} className="hover:text-red-600">
                            <FiX size={12} />
                        </button>
                    </span>
                ))}
            </div>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or state..."
                className={smallInputClass}
            />

            <div className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.length === 0 && (
                    <p className="px-2 py-1 text-xs text-[#62748E]">No cities found. Add them in Admin → States & Cities.</p>
                )}
                {filtered.map((city) => (
                    <label
                        key={city.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#1A1F36] hover:bg-gray-50"
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(city.id)}
                            onChange={() => toggle(city.id)}
                            className="h-4 w-4 shrink-0 accent-[#E87722]"
                        />
                        <span className="truncate">
                            {city.name}
                            {city.state?.name && <span className="text-xs text-[#62748E]"> · {city.state.name}</span>}
                            {!city.is_active && <span className="text-xs text-gray-400"> (inactive)</span>}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default function FooterSettings() {
    const [footer, setFooter] = useState(() => mergeFooter(null));
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(footerDefaults.logo);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [hasSavedLogo, setHasSavedLogo] = useState(false);
    const [allCities, setAllCities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const applySaved = (saved) => {
        const merged = mergeFooter(saved);

        // Never saved -> start with the cities footer shows right now.
        // Reset to Default (saved = null) keeps the current city selection.
        setFooter((previous) => ({
            ...merged,
            city_ids: Array.isArray(merged.city_ids)
                ? merged.city_ids
                : saved
                    ? (saved.cities || []).map((city) => city.id)
                    : previous.city_ids || [],
        }));
        setLogoPreview(merged.logo);
        setHasSavedLogo(!!saved?.logo);
        setLogoFile(null);
        setRemoveLogo(false);
    };

    useEffect(() => {
        getAdminFooter()
            .then((res) => applySaved(res?.data?.footer))
            .catch((error) => {
                setMessage(error?.message || "Failed to load footer settings.");
                setMessageType("error");
            })
            .finally(() => setLoading(false));

        getAdminLocations("cities")
            .then((res) => setAllCities(res?.data?.cities ?? []))
            .catch((error) => console.error("Failed to fetch cities:", error));
    }, []);

    const setField = (field, value) =>
        setFooter((previous) => ({ ...previous, [field]: value }));

    const setNested = (group, field, value) =>
        setFooter((previous) => ({
            ...previous,
            [group]: { ...previous[group], [field]: value },
        }));

    const updateColumn = (index, changes) =>
        setField(
            "columns",
            footer.columns.map((column, i) => (i === index ? { ...column, ...changes } : column))
        );

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0] || null;

        if (!file) return;

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setRemoveLogo(false);
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(footerDefaults.logo);
        setRemoveLogo(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setMessage("");
        setMessageType("");

        try {
            // Logo is sent as file, everything else as JSON
            // "cities" is response only (built from city_ids)
            const { logo, cities, ...data } = footer;

            const formData = new FormData();
            formData.append("data", JSON.stringify(data));

            if (logoFile) {
                formData.append("logo", logoFile);
            } else if (removeLogo) {
                formData.append("remove_logo", "1");
            }

            const res = await saveFooter(formData);

            applySaved(res?.data?.footer);
            showToast(res?.message || "Footer updated successfully.");
        } catch (error) {
            setMessage(error?.message || "Something went wrong while saving.");
            setMessageType("error");
            showToast(error?.message || "Something went wrong while saving.", "error");
        } finally {
            setSaving(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
                <div
                    role={messageType === "error" ? "alert" : "status"}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        messageType === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {message}
                </div>
            )}

            {/* Logo & About */}
            <Section title="Logo & About">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr]">
                    <div>
                        <p className={labelClass}>Footer Logo</p>
                        <div className="mt-1.5 flex h-[110px] items-center justify-center rounded-xl bg-[#1A2340] p-4">
                            <img src={logoPreview} alt="Footer logo" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <label className="cursor-pointer rounded-lg border border-[#E87722] px-3 py-1.5 text-xs font-semibold text-[#E87722] hover:bg-orange-50">
                                Change Logo
                                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                            </label>
                            {(hasSavedLogo || logoFile) && !removeLogo && (
                                <button type="button" onClick={handleRemoveLogo} className="text-xs font-semibold text-red-600 hover:underline">
                                    Use default logo
                                </button>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-[#62748E]">PNG/JPG/WEBP, max 2 MB. Light logo for dark background.</p>
                    </div>

                    <div>
                        <label htmlFor="about_text" className={labelClass}>About Text</label>
                        <textarea
                            id="about_text"
                            rows={5}
                            maxLength={1000}
                            value={footer.about_text || ""}
                            onChange={(e) => setField("about_text", e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </Section>

            {/* Social */}
            <Section title="Social Media Links" hint="Only filled links are shown as icons in the footer.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {socialFields.map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label htmlFor={`social_${key}`} className={labelClass}>{label}</label>
                            <input
                                id={`social_${key}`}
                                value={footer.social?.[key] || ""}
                                onChange={(e) => setNested("social", key, e.target.value)}
                                placeholder={placeholder}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </Section>

            {/* Contact */}
            <Section title="Contact Details" hint="Also shown on the Contact Us page.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="contact_address" className={labelClass}>Address</label>
                        <input id="contact_address" value={footer.contact?.address || ""} onChange={(e) => setNested("contact", "address", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contact_phone" className={labelClass}>Phone</label>
                        <input id="contact_phone" value={footer.contact?.phone || ""} onChange={(e) => setNested("contact", "phone", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contact_email" className={labelClass}>Email</label>
                        <input id="contact_email" type="email" value={footer.contact?.email || ""} onChange={(e) => setNested("contact", "email", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contact_hours" className={labelClass}>Working Hours</label>
                        <input id="contact_hours" value={footer.contact?.hours || ""} onChange={(e) => setNested("contact", "hours", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="contact_map" className={labelClass}>Google Map Link (optional)</label>
                        <input
                            id="contact_map"
                            value={footer.contact?.map_url || ""}
                            onChange={(e) => setNested("contact", "map_url", e.target.value)}
                            placeholder="Empty = map from address"
                            className={inputClass}
                        />
                    </div>
                </div>
            </Section>

            {/* Link Columns */}
            <Section title="Footer Link Columns" hint={`Up to ${MAX_COLUMNS} columns. Use site paths like /web/blog or full https:// links.`}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {footer.columns.map((column, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <input
                                    value={column.title}
                                    onChange={(e) => updateColumn(index, { title: e.target.value })}
                                    placeholder="Column heading"
                                    className={`${smallInputClass} font-semibold`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setField("columns", footer.columns.filter((_, i) => i !== index))}
                                    className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                    Remove column
                                </button>
                            </div>

                            <LinkRows
                                links={column.links || []}
                                onChange={(links) => updateColumn(index, { links })}
                            />
                        </div>
                    ))}
                </div>

                {footer.columns.length < MAX_COLUMNS && (
                    <button
                        type="button"
                        onClick={() => setField("columns", [...footer.columns, { title: "", links: [{ title: "", href: "" }] }])}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-[#E87722] px-4 py-2 text-sm font-semibold text-[#E87722] hover:bg-orange-50"
                    >
                        <FiPlus size={16} /> Add Column
                    </button>
                )}
            </Section>

            {/* Cities */}
            <Section title="Major Cities" hint="Only the cities you select are shown in the footer, in the same order. Inactive cities are not shown on the website.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                        <label htmlFor="cities_title" className={labelClass}>Heading</label>
                        <input
                            id="cities_title"
                            value={footer.cities_title || ""}
                            onChange={(e) => setField("cities_title", e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 pb-2.5 text-sm font-medium text-[#1A1F36]">
                        <input
                            type="checkbox"
                            checked={!!footer.show_cities}
                            onChange={(e) => setField("show_cities", e.target.checked)}
                            className="h-4 w-4 accent-[#E87722]"
                        />
                        Show cities in footer
                    </label>
                </div>

                <CityPicker
                    allCities={allCities}
                    selectedIds={footer.city_ids || []}
                    onChange={(ids) => setField("city_ids", ids)}
                />
            </Section>

            {/* Bottom bar */}
            <Section title="Bottom Bar">
                <div>
                    <label htmlFor="copyright" className={labelClass}>Copyright Text</label>
                    <input
                        id="copyright"
                        value={footer.copyright || ""}
                        onChange={(e) => setField("copyright", e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-xs text-[#62748E]">
                        Write <code className="rounded bg-gray-100 px-1">{"{year}"}</code> to show the current year automatically.
                    </p>
                </div>

                <div className="mt-5">
                    <p className={`${labelClass} mb-2`}>Bottom Links</p>
                    <LinkRows
                        links={footer.bottom_links || []}
                        onChange={(links) => setField("bottom_links", links)}
                        max={6}
                    />
                </div>
            </Section>

            <div className=" -mx-4 flex justify-end gap-3 border-t border-gray-200 bg-[#f4f5fa]/95 px-4 py-4 backdrop-blur">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                        applySaved(null);
                        // Saved custom logo is also removed on save
                        setRemoveLogo(true);
                        setMessage("Default footer loaded. Click Save to apply it.");
                        setMessageType("success");
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#001737] hover:bg-gray-50 disabled:opacity-50"
                >
                    Reset to Default
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf681b] disabled:opacity-70"
                >
                    {saving ? (
                        <>
                            <Spinner size="sm" color="white" />
                            Saving...
                        </>
                    ) : (
                        "Save Footer"
                    )}
                </button>
            </div>
        </form>
    );
}
