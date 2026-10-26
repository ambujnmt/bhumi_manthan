"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { getHeader } from "../../../utils/fetchApi";
import { saveHeaderLogo } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { DEFAULT_HEADER_LOGO, refreshSiteLogo } from "../../../utils/useSiteLogo";

const labelClass = "block text-sm font-medium text-[#283A86]";

export default function HeaderSettings() {
    const [savedLogo, setSavedLogo] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [preview, setPreview] = useState(DEFAULT_HEADER_LOGO);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const applySaved = (logo) => {
        setSavedLogo(logo || null);
        setPreview(logo || DEFAULT_HEADER_LOGO);
        setLogoFile(null);
    };

    useEffect(() => {
        getHeader()
            .then((res) => applySaved(res?.data?.header?.logo))
            .catch((error) => {
                setMessage(error?.message || "Failed to load header settings.");
                setMessageType("error");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;

        if (!file) return;

        setLogoFile(file);
        setPreview(URL.createObjectURL(file));
        setMessage("");
    };

    const submit = async (removeLogo = false) => {
        setSaving(true);
        setMessage("");

        try {
            const formData = new FormData();

            if (removeLogo) {
                formData.append("remove_logo", "1");
            } else {
                formData.append("logo", logoFile);
            }

            const res = await saveHeaderLogo(formData);

            applySaved(res?.data?.header?.logo);
            refreshSiteLogo();
            showToast(res?.message || "Header logo updated successfully.");
        } catch (error) {
            setMessage(error?.message || "Something went wrong while saving.");
            setMessageType("error");
            showToast(error?.message || "Something went wrong while saving.", "error");
        } finally {
            setSaving(false);
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
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-[#001737]">Header Logo</h3>
                <p className="mt-1 text-xs text-[#62748E]">
                    Shown in the website header and mobile menu.
                </p>
            </div>

            {message && (
                <div
                    role={messageType === "error" ? "alert" : "status"}
                    className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                        messageType === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr] md:items-start">
                {/* Preview like real header */}
                <div>
                    <p className={labelClass}>Preview</p>
                    <div className="mt-1.5 rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 p-4">
                        <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-sm">
                            <img
                                src={preview}
                                alt="Header logo preview"
                                className="h-auto max-h-[60px] w-[200px] object-contain object-left"
                            />
                            <div className="hidden gap-2 sm:flex">
                                <span className="h-2 w-10 rounded bg-gray-200" />
                                <span className="h-2 w-10 rounded bg-gray-200" />
                                <span className="h-2 w-10 rounded bg-gray-200" />
                            </div>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-[#62748E]">
                        {logoFile
                            ? "New logo (not saved yet)"
                            : savedLogo
                                ? "Current custom logo"
                                : "Default logo"}
                    </p>
                </div>

                {/* Upload */}
                <div>
                    <p className={labelClass}>Upload New Logo</p>
                    <label className="mt-1.5 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center transition hover:border-[#E87722]">
                        <span className="text-sm font-semibold text-[#E87722]">Click to choose image</span>
                        <span className="mt-1 text-xs text-[#62748E]">
                            PNG, JPG or WEBP, max 2 MB. Transparent PNG, about 400 × 120 px, works best.
                        </span>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {logoFile && (
                        <p className="mt-2 truncate text-xs text-green-700">Selected: {logoFile.name}</p>
                    )}

                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {savedLogo && !logoFile && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => submit(true)}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#001737] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Use Default Logo
                            </button>
                        )}

                        {logoFile && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => applySaved(savedLogo)}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#001737] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={saving || !logoFile}
                            onClick={() => submit(false)}
                            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Saving...
                                </>
                            ) : (
                                "Save Logo"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
