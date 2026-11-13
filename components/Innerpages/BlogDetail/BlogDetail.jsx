import { Link } from "@heroui/react";
import NextLink from "next/link";
import React from "react";
import {
    FaArrowLeft,
    FaArrowRight,
    FaUser,
    FaCalendarAlt,
    FaClock,
    FaTag,
    FaLightbulb,
    FaHome,
    FaChevronRight,
    FaNewspaper,
    FaFileAlt,
} from "react-icons/fa";
import "react-quill/dist/quill.snow.css";
import SideAds from "../../Common/Ads/SideAds";

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "";

export default function BlogDetail({ blog = null, moreBlogs = [] }) {
    if (!blog) {
        return (
            <section className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-[var(--text-color1)]">
                    Blog not found.
                </h1>
                <NextLink
                    href="/"
                    className="mt-4 inline-block font-semibold text-[var(--primary-color)]"
                >
                    Go to Home
                </NextLink>
            </section>
        );
    }

    return (
        <section className="blog-detail container pb-8 sm:pb-12">
            {/* Same width as the blog list page (container, no extra max width) */}
            <div className="w-full">

                {/* Breadcrumb (same look as property / project / event detail) */}
                <div className="flex flex-col gap-3 py-[40px] sm:flex-row sm:items-center sm:justify-between">
                    <nav aria-label="Breadcrumb" className="min-w-0">
                        <ol className="mb-0 flex flex-wrap items-center gap-1.5 pl-0 text-[13px]">
                            {/* Home */}
                            <li>
                                <NextLink
                                    href="/"
                                    className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                        <FaHome className="text-[10px]" />
                                    </span>
                                    Home
                                </NextLink>
                            </li>

                            <li aria-hidden="true">
                                <FaChevronRight className="text-[9px] text-gray-400" />
                            </li>

                            {/* Blogs */}
                            <li>
                                <NextLink
                                    href="/web/blog"
                                    className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-[#62748E] no-underline shadow-sm transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] transition group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)]">
                                        <FaNewspaper className="text-[10px]" />
                                    </span>
                                    Blogs
                                </NextLink>
                            </li>

                            <li aria-hidden="true">
                                <FaChevronRight className="text-[9px] text-gray-400" />
                            </li>

                            {/* Current Page (long titles cut with "...") */}
                            <li aria-current="page" className="min-w-0 max-w-full">
                                <span className="flex items-center gap-2 rounded-full bg-[var(--secondary-color)] px-3.5 py-1.5 font-semibold text-white shadow-md">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-white">
                                        <FaFileAlt className="text-[10px]" />
                                    </span>
                                    <span className="truncate sm:max-w-[420px]">{blog.title}</span>
                                </span>
                            </li>
                        </ol>
                    </nav>

                    {/* Back Button */}
                    <NextLink
                        href="/web/blog"
                        className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--primary-color)] px-4 py-1.5 text-[13px] font-semibold text-[var(--primary-color)] no-underline transition hover:bg-[var(--primary-color)] hover:text-white"
                    >
                        <FaArrowLeft className="text-[11px]" />
                        Back to Blogs
                    </NextLink>
                </div>

                {/* Accent line */}
                <div className="-mt-6 mb-8 h-[3px] w-full rounded-full bg-gradient-to-r from-[var(--primary-color)] via-[var(--primary-color)]/30 to-transparent" />

                {/* Blog heading */}
                <div className="mb-7">
                    <div>
                        {blog.category && (
                            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-color)]">
                                <span className="h-0.5 w-7 bg-[var(--primary-color)]" />
                                {blog.category}
                            </div>
                        )}

                        <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-[var(--text-color1)] sm:text-4xl lg:text-[44px]">
                            {blog.title}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--text-color2)]">
                            {blog.author_name && (
                                <span className="inline-flex items-center gap-2">
                                    <FaUser className="text-[var(--primary-color)]" />
                                    By {blog.author_name}
                                </span>
                            )}

                            {blog.published_at && (
                                <span className="inline-flex items-center gap-2">
                                    <FaCalendarAlt className="text-[var(--primary-color)]" />
                                    {formatDate(blog.published_at)}
                                </span>
                            )}

                            {blog.read_time && (
                                <span className="inline-flex items-center gap-2">
                                    <FaClock className="text-[var(--primary-color)]" />
                                    {blog.read_time} min read
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero image. Ads (Admin -> Ads, "Blog Detail") sit left / right of it;
                    article, Article Overview card and related blogs below keep the full width */}
                {blog.image && (
                    <SideAds page="blog_detail" sticky={false} railClass="lg:mt-0" wrapClass="">
                        <div className="group mb-10 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                            <img
                                src={blog.image}
                                alt={blog.title || "Blog cover"}
                                className="h-[240px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:h-[360px] lg:h-[430px]"
                            />
                        </div>
                    </SideAds>
                )}

                {/* Article and sidebar (a little space below the image / ads row) */}
                <div className="mt-4 grid grid-cols-1 items-start gap-8 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-10">

                    {/* Main article */}
                    <article className="min-w-0">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                            <div className="mb-7 h-1 w-14 rounded-full bg-[var(--primary-color)]" />

                            <div
                                className="blog-article-content ql-snow"
                            >
                                <div
                                    className="ql-editor !p-0"
                                    dangerouslySetInnerHTML={{
                                        __html: blog.content || "",
                                    }}
                                />
                            </div>

                            {/* Closing callout */}
                            <div
                                className="mt-8 flex items-start gap-4 rounded-xl border-l-4 p-5 sm:p-6"
                                style={{
                                    borderLeftColor: "var(--primary-color)",
                                    backgroundColor: "rgba(232, 119, 34, 0.07)",
                                }}
                            >
                                <FaLightbulb
                                    className="mt-1 shrink-0 text-[var(--primary-color)]"
                                    size={25}
                                />
                                <div>
                                    <h3 className="font-bold text-[var(--text-color1)]">
                                        Looking for better insights?
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-[var(--text-color2)]">
                                        Explore more articles, ideas and
                                        practical insights to help you make
                                        informed decisions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Article Overview sidebar */}
                    {/* top-28: stays below the fixed header while scrolling */}
                    <aside className="lg:sticky lg:top-28">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            {/* Title */}
                            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                                <span className="h-5 w-1 rounded-full bg-[var(--primary-color)]" />
                                <h2 className="mb-0 text-[17px] font-bold text-[var(--text-color1)]">
                                    Article Overview
                                </h2>
                            </div>

                            {/* Author */}
                            {blog.author_name && (
                                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-[16px] font-bold uppercase text-white">
                                        {String(blog.author_name).trim().charAt(0) || <FaUser size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-0 truncate text-[15px] font-bold text-[var(--text-color1)]">
                                            {blog.author_name}
                                        </p>
                                        <p className="mb-0 text-xs text-[var(--text-color2)]">Article Author</p>
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            {(blog.published_at || blog.read_time || blog.category) && (
                                <ul className="mb-0 divide-y divide-gray-100 px-5 py-1 pl-5">
                                    {[
                                        blog.published_at && { icon: FaCalendarAlt, label: "Published on", value: formatDate(blog.published_at) },
                                        blog.read_time && { icon: FaClock, label: "Reading time", value: `${blog.read_time} min read` },
                                        blog.category && { icon: FaTag, label: "Category", value: blog.category, accent: true },
                                    ]
                                        .filter(Boolean)
                                        .map(({ icon: Icon, label, value, accent }) => (
                                            <li key={label} className="flex items-center gap-3 py-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(232,119,34,0.10)] text-[var(--primary-color)]">
                                                    <Icon size={14} />
                                                </span>
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                                    <span className="text-[13px] text-[var(--text-color2)]">{label}</span>
                                                    <span className={`truncate text-right text-[13px] font-semibold ${accent ? "text-[var(--primary-color)]" : "text-[var(--text-color1)]"}`}>
                                                        {value}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            )}

                            {/* Explore more */}
                            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                                <p className="mb-3 text-[13px] leading-5 text-[var(--text-color2)]">
                                    Read the latest insights and discover ideas that matter to you.
                                </p>
                                <NextLink
                                    href="/web/blog"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 py-3 text-sm font-bold text-white no-underline transition-all hover:opacity-90"
                                >
                                    Explore More Blogs
                                    <FaArrowRight size={12} />
                                </NextLink>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Related articles */}
                {moreBlogs.length > 0 && (
                    <div className="mt-16 border-t border-gray-200 pt-9 sm:mt-20">
                        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-color)]">
                                    Keep Exploring
                                </p>
                                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-color1)] sm:text-3xl">
                                    More News & Insights
                                </h2>
                            </div>

                            <span className="text-sm text-[var(--text-color2)]">
                                Discover more stories
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {moreBlogs.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/web/blog/${item.slug}`}
                                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary-color)] hover:shadow-lg"
                                >
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={
                                                item.image ||
                                                "/assets/img/blog-img1.png"
                                            }
                                            alt={item.title || "Related blog"}
                                            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {item.category && (
                                            <span
                                                className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.95)",
                                                    color: "var(--primary-color)",
                                                }}
                                            >
                                                {item.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <p className="text-xs text-[var(--text-color2)]">
                                            {formatDate(item.published_at)}
                                        </p>

                                        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-[var(--text-color1)] transition-colors group-hover:text-[var(--primary-color)]">
                                            {item.title}
                                        </h3>

                                        <div className="mt-auto flex items-center justify-between pt-5">
                                            <span className="text-sm font-semibold text-[var(--primary-color)]">
                                                Read Article
                                            </span>
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white">
                                                <FaArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Rich text editor content styling */}
            <style jsx global>{`
                .blog-article-content .ql-editor {
                    color: var(--text-color1);
                    font-size: 16px;
                    line-height: 1.9;
                    overflow-wrap: anywhere;
                }

                .blog-article-content .ql-editor > * {
                    max-width: 100%;
                }

                .blog-article-content .ql-editor p {
                    margin-bottom: 1.25rem;
                }

                .blog-article-content .ql-editor h1,
                .blog-article-content .ql-editor h2,
                .blog-article-content .ql-editor h3,
                .blog-article-content .ql-editor h4 {
                    color: var(--text-color1);
                    font-weight: 800;
                    line-height: 1.35;
                    margin-top: 1.75rem;
                    margin-bottom: 0.85rem;
                }

                .blog-article-content .ql-editor h1 {
                    font-size: 2rem;
                }

                .blog-article-content .ql-editor h2 {
                    font-size: 1.6rem;
                }

                .blog-article-content .ql-editor h3 {
                    font-size: 1.3rem;
                }

                .blog-article-content .ql-editor a {
                    color: var(--primary-color);
                    text-decoration: none;
                }

                /* No underline on any link of this page (Bootstrap underlines "a") */
                .blog-detail a,
                .blog-detail a:hover,
                .blog-detail a:focus,
                .blog-detail a:active {
                    text-decoration: none;
                }

                .blog-article-content .ql-editor img {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    margin: 1.5rem auto;
                    border-radius: 12px;
                }

                .blog-article-content .ql-editor blockquote {
                    margin: 1.5rem 0;
                    padding: 1rem 1.25rem;
                    border-left: 4px solid var(--primary-color);
                    border-radius: 0 10px 10px 0;
                    background: rgba(232, 119, 34, 0.07);
                    color: var(--text-color1);
                    font-style: italic;
                }

                .blog-article-content .ql-editor ul,
                .blog-article-content .ql-editor ol {
                    padding-left: 1.5rem;
                    margin-bottom: 1.25rem;
                }

                .blog-article-content .ql-editor li {
                    padding-left: 0.25rem;
                    margin-bottom: 0.4rem;
                }

                .blog-article-content .ql-editor pre,
                .blog-article-content .ql-editor .ql-syntax {
                    max-width: 100%;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                }

                .blog-article-content .ql-editor iframe,
                .blog-article-content .ql-editor video {
                    max-width: 100%;
                }

                @media (max-width: 640px) {
                    .blog-article-content .ql-editor {
                        font-size: 15px;
                        line-height: 1.8;
                    }

                    .blog-article-content .ql-editor h1 {
                        font-size: 1.7rem;
                    }

                    .blog-article-content .ql-editor h2 {
                        font-size: 1.4rem;
                    }

                    .blog-article-content .ql-editor h3 {
                        font-size: 1.2rem;
                    }
                }
            `}</style>
        </section>
    );
}
