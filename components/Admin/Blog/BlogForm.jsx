"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner } from "@heroui/react";
import { getAdminBlogDetail, saveBlog } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { buildBlogSeo } from "../../../utils/seo";
import SeoFields from "../SeoFields";
import "react-quill/dist/quill.snow.css";

// Quill uses window -> load only in browser
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "link"],
        ["clean"],
    ],
};

const initialForm = {
    title: "",
    category: "",
    author_name: "",
    published_at: "",
    read_time: "",
    excerpt: "",
    content: "",
    is_active: true,
    slug: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
};

const categoryOptions = [
    "Buying Guide",
    "Market Trends",
    "Investment",
    "Legal & RERA",
    "Home Loan",
    "Interior & Lifestyle",
    "News",
];

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// ISO -> YYYY-MM-DD (local) for <input type="date">
const toDateInput = (value) => {
    if (!value) return "";

    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date - offset).toISOString().slice(0, 10);
};

export default function BlogForm({ blogId = null }) {
    const router = useRouter();
    const isEdit = !!blogId;

    const [form, setForm] = useState(initialForm);
    const [currentReadTime, setCurrentReadTime] = useState(null);
    const [savedSlug, setSavedSlug] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // Prefill for update
    useEffect(() => {
        if (!isEdit) return;

        const fetchBlog = async () => {
            setLoading(true);

            try {
                const res = await getAdminBlogDetail(blogId);
                const blog = res?.data?.blog;

                if (!blog) throw new Error("Blog not found.");

                setForm({
                    title: blog.title ?? "",
                    category: blog.category ?? "",
                    author_name: blog.author_name ?? "",
                    published_at: toDateInput(blog.published_at),
                    // Empty = recalculated from content on save
                    read_time: "",
                    excerpt: blog.excerpt ?? "",
                    content: blog.content ?? "",
                    is_active: !!blog.is_active,
                    slug: blog.slug ?? "",
                    meta_title: blog.meta_title ?? "",
                    meta_description: blog.meta_description ?? "",
                    meta_keywords: blog.meta_keywords ?? "",
                });
                setSavedSlug(blog.slug ?? "");
                setCurrentReadTime(blog.read_time);
                setImagePreview(blog.image ?? "");
            } catch (error) {
                setMessage(error?.message || "Failed to load blog.");
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [blogId, isEdit]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);

        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Quill empty content is "<p><br></p>"
    const contentText = form.content.replace(/<[^>]*>/g, "").trim();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.title.trim()) {
            setMessage("Blog title is required.");
            setMessageType("error");
            return;
        }

        if (!contentText) {
            setMessage("Blog content is required.");
            setMessageType("error");
            return;
        }

        setSaving(true);
        setMessage("");
        setMessageType("");

        try {
            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (key === "is_active") {
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, value ?? "");
                }
            });

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const res = await saveBlog(formData, blogId);

            showToast(
                res?.message ||
                    (isEdit ? "Blog updated successfully." : "Blog created successfully.")
            );

            if (isEdit) {
                setCurrentReadTime(res?.data?.blog?.read_time ?? currentReadTime);
                // Backend may change the slug (made from title, or -1 if already taken)
                const slug = res?.data?.blog?.slug ?? form.slug;
                setSavedSlug(slug);
                setForm((previous) => ({ ...previous, read_time: "", slug }));
                setImageFile(null);
            } else {
                router.push("/admin/blog/blogList");
            }
        } catch (error) {
            setMessage(error?.message || "Something went wrong while saving the blog.");
            setMessageType("error");
            showToast(error?.message || "Something went wrong while saving the blog.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Blogs", path: "/admin/blog/blogList" },
                    { label: isEdit ? "Update" : "Create", active: true },
                ]}
                title={isEdit ? "Update Blog" : "Create Blog"}
            />

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {message && (
                    <div
                        role={messageType === "error" ? "alert" : "status"}
                        className={`mx-5 mt-5 rounded-lg border px-4 py-3 text-sm sm:mx-7 ${
                            messageType === "success"
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className={labelClass}>
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Top 10 Tips for First-Time Home Buyers in 2025"
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label htmlFor="category" className={labelClass}>Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="">Select Category</option>
                                    {categoryOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                    {form.category && !categoryOptions.includes(form.category) && (
                                        <option value={form.category}>{form.category}</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="author_name" className={labelClass}>Author</label>
                                <input
                                    id="author_name"
                                    name="author_name"
                                    value={form.author_name}
                                    onChange={handleChange}
                                    placeholder="Default: your name"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label htmlFor="published_at" className={labelClass}>Publish Date</label>
                                <input
                                    id="published_at"
                                    name="published_at"
                                    type="date"
                                    value={form.published_at}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-[#62748E]">
                                    Empty = today. Future date = scheduled.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="read_time" className={labelClass}>Read Time (min)</label>
                                <input
                                    id="read_time"
                                    name="read_time"
                                    type="number"
                                    min="1"
                                    value={form.read_time}
                                    onChange={handleChange}
                                    placeholder={currentReadTime ? `Auto (now ${currentReadTime} min)` : "Auto"}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-[#62748E]">
                                    Leave empty to calculate from content.
                                </p>
                            </div>
                        </div>

                        {/* Image */}
                        <div>
                            <label htmlFor="blog_image" className={labelClass}>Cover Image</label>
                            <div className="mt-1.5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px] sm:items-start">
                                <div>
                                    <input
                                        id="blog_image"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleImageChange}
                                        className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]"
                                    />
                                    <p className="mt-1 text-xs text-[#62748E]">JPG, PNG or WEBP, max 5 MB.</p>
                                </div>

                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Blog cover preview"
                                        className="h-36 w-full rounded-lg border object-cover"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label htmlFor="excerpt" className={labelClass}>Short Summary</label>
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                rows={2}
                                maxLength={1000}
                                value={form.excerpt}
                                onChange={handleChange}
                                placeholder="Leave empty to use the first lines of the content"
                                className={inputClass}
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className={labelClass}>
                                Content <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1.5 [&_.ql-container]:min-h-[260px] [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg">
                                <ReactQuill
                                    theme="snow"
                                    value={form.content}
                                    onChange={(value) =>
                                        setForm((previous) => ({ ...previous, content: value }))
                                    }
                                    modules={quillModules}
                                    placeholder="Write the blog content..."
                                />
                            </div>
                        </div>

                        <SeoFields
                            values={form}
                            onChange={(patch) =>
                                setForm((previous) => ({ ...previous, ...patch }))
                            }
                            seo={buildBlogSeo(form)}
                            urlPath="/web/blog/"
                            savedSlug={savedSlug}
                            titlePlaceholder="First-Time Home Buyer Tips for 2026"
                            keywordsPlaceholder="home buying tips, first home india"
                            inputClass={inputClass}
                            labelClass={labelClass}
                        />

                        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        is_active: event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 accent-[#E87722]"
                            />
                            Show on website (Active)
                        </label>

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => router.push("/admin/blog/blogList")}
                                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Back to List
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {saving ? (
                                    <>
                                        <Spinner size="sm" color="white" />
                                        Saving...
                                    </>
                                ) : isEdit ? (
                                    "Update Blog"
                                ) : (
                                    "Create Blog"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
