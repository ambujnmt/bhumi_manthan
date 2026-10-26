"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { getHeader } from "../../../utils/fetchApi";
import { saveHeaderLogo } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { SITE_FAVICON_URL, refreshSiteLogo } from "../../../utils/useSiteLogo";

const labelClass = "block text-sm font-medium text-[#283A86]";

const MAX_ICON_KB = 512; // same as backend "favicon" max:512
const ALLOWED_TYPES = ["png", "ico", "jpg", "jpeg", "webp"];

// Show new icon in this browser tab right away (no reload needed)
const applyToBrowserTab = (url) => {
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
        link.href = url;
    });
};

/**
 * Site icon (favicon) shown in browser tab, bookmarks and phone home screen.
 * Saved in "header" setting (POST /api/admin/settings/header -> favicon / remove_favicon).
 */
export default function FaviconSettings() {
    const [savedIcon, setSavedIcon] = useState(null);
    const [iconFile, setIconFile] = useState(null);
    const [preview, setPreview] = useState(null); // null = no icon

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const applySaved = (icon) => {
        setSavedIcon(icon || null);
        setPreview(icon || null);
        setIconFile(null);
    };

    useEffect(() => {
        getHeader()
            .then((res) => applySaved(res?.data?.header?.favicon))
            .catch((error) => setMessage(error?.message || "Failed to load site icon."))
            .finally(() => setLoading(false));
    }, []);

    // Free old preview URL
    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFileChange = (event) => {
        const input = event.target;
        const file = input.files?.[0] || null;
        input.value = ""; // same file can be chosen again

        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();

        if (!ALLOWED_TYPES.includes(extension)) {
            showToast("Site icon must be a PNG, ICO, JPG or WEBP file.", "error");
            return;
        }

        if (file.size > MAX_ICON_KB * 1024) {
            showToast(
                `"${file.name}" is ${Math.ceil(file.size / 1024)} KB. Site icon must be ${MAX_ICON_KB} KB or smaller.`,
                "error"
            );
            return;
        }

        setIconFile(file);
        setPreview(URL.createObjectURL(file));
        setMessage("");
    };

    const submit = async (removeIcon = false) => {
        setSaving(true);
        setMessage("");

        try {
            const formData = new FormData();

            if (removeIcon) {
                formData.append("remove_favicon", "1");
            } else {
                formData.append("favicon", iconFile);
            }

            const res = await saveHeaderLogo(formData);
            const icon = res?.data?.header?.favicon;

            applySaved(icon);
            refreshSiteLogo();
            // new ?v -> browser loads the new icon (or none) right away
            applyToBrowserTab(`${SITE_FAVICON_URL}?v=${Date.now()}`);
            showToast(res?.message || "Site icon updated successfully.");
        } catch (error) {
            setMessage(error?.message || "Something went wrong while saving.");
            showToast(error?.message || "Something went wrong while saving.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-[#001737]">Site Icon (Favicon)</h3>
                <p className="mt-1 text-xs text-[#62748E]">
                    Shown in the browser tab, bookmarks and when the website is added to a phone home screen.
                </p>
            </div>

            {message && (
                <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:items-start">
                {/* Preview like a browser tab */}
                <div>
                    <p className={labelClass}>Preview</p>
                    <div className="mt-1.5 rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 p-4">
                        <div className="flex items-end gap-1">
                            <div className="flex w-[230px] max-w-full items-center gap-2 rounded-t-lg bg-white px-3 py-2 shadow-sm">
                                {preview ? (
                                    <img src={preview} alt="Site icon preview" className="h-4 w-4 shrink-0 object-contain" />
                                ) : (
                                    // no icon: browser shows nothing here
                                    <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                                )}
                                <span className="truncate text-xs text-[#1A1F36]">Bhumi Manthan</span>
                                <span className="ml-auto text-xs text-gray-400">×</span>
                            </div>
                            <span className="mb-2 text-sm text-gray-400">+</span>
                        </div>
                        <div className="rounded-b-lg rounded-tr-lg bg-white px-3 py-2 shadow-sm">
                            <span className="block h-5 rounded-full bg-gray-100" />
                        </div>

                        {/* Larger sizes (bookmarks / home screen) */}
                        <div className="mt-4 flex items-end gap-4">
                            {[16, 32, 64].map((size) => (
                                <div key={size} className="text-center">
                                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                                        {preview ? (
                                            <img
                                                src={preview}
                                                alt={`${size}px icon`}
                                                style={{ width: size, height: size }}
                                                className="object-contain"
                                            />
                                        ) : (
                                            <span
                                                style={{ width: size, height: size }}
                                                className="rounded border border-dashed border-gray-300"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                    <span className="mt-1 block text-[10px] text-gray-400">{size}px</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-[#62748E]">
                        {iconFile ? "New icon (not saved yet)" : savedIcon ? "Current site icon" : "No icon — browser tab shows no icon"}
                    </p>
                </div>

                {/* Upload */}
                <div>
                    <p className={labelClass}>Upload New Icon</p>
                    <label className="mt-1.5 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center transition hover:border-[#E87722]">
                        <span className="text-sm font-semibold text-[#E87722]">Click to choose icon</span>
                        <span className="mt-1 text-xs text-[#62748E]">
                            PNG, ICO, JPG or WEBP, max {MAX_ICON_KB} KB. Square image, 512 × 512 px (PNG) works best.
                        </span>
                        <input
                            type="file"
                            accept=".png,.ico,.jpg,.jpeg,.webp,image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {iconFile && (
                        <p className="mt-2 truncate text-xs text-green-700">Selected: {iconFile.name}</p>
                    )}

                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {savedIcon && !iconFile && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => submit(true)}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#001737] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Remove Icon
                            </button>
                        )}

                        {iconFile && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => applySaved(savedIcon)}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#001737] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={saving || !iconFile}
                            onClick={() => submit(false)}
                            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Saving...
                                </>
                            ) : (
                                "Save Icon"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
