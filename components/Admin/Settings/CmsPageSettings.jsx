"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { fetchPrivacyPolicies, fetchTerms } from "../../../utils/fetchApi";
import { savePageSetting } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import RichTextEditor from "../../RichTextEditor/RichTextEditor";

const pageConfig = {
    privacy_policy: { fetch: fetchPrivacyPolicies, url: "/user/cms/privacyPolicy" },
    terms_conditions: { fetch: fetchTerms, url: "/user/cms/termsAndCondition" },
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// Privacy Policy / Terms & Conditions editor
export default function CmsPageSettings({ pageKey }) {
    const config = pageConfig[pageKey];

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    useEffect(() => {
        setLoading(true);
        setMessage("");

        config.fetch()
            .then((res) => {
                setTitle(res?.data?.title || "");
                setContent(res?.data?.content || "");
            })
            .finally(() => setLoading(false));
    }, [pageKey]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setMessage("Page title is required.");
            setMessageType("error");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const res = await savePageSetting(pageKey, { title, content });

            showToast(res?.message || "Page updated successfully.");
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
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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

            <div>
                <label htmlFor={`${pageKey}_title`} className={labelClass}>
                    Page Title <span className="text-red-500">*</span>
                </label>
                <input
                    id={`${pageKey}_title`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                />
            </div>

            <div>
                <p className={`${labelClass} mb-1.5`}>Content</p>
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write the page content..."
                    minHeight={360}
                />
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">
                <a
                    href={config.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-semibold text-[#001737] hover:bg-gray-50"
                >
                    View Page
                </a>

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
                        "Save Page"
                    )}
                </button>
            </div>
        </form>
    );
}
