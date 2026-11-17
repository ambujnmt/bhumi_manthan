import NextLink from "next/link";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FaArrowRight } from "react-icons/fa";
import { getBlogs } from "../../../utils/fetchApi";

// Jan 12, 2025
const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "";

export default function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await getBlogs(50);
                setBlogs(res?.data?.blogs ?? []);
            } catch (error) {
                console.error("Failed to fetch blogs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    return (
        <section className="container py-10">
            <h1 className="text-[28px] font-bold text-[var(--text-color1)]">Real Estate News & Insights</h1>
            <p className="mt-1 text-[16px] text-[var(--text-color2)]">
                Stay ahead with smart property trends, regulatory updates and investment advice
            </p>

            {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : blogs.length === 0 ? (
                <p className="py-16 text-center text-[var(--text-color2)]">No blogs published yet.</p>
            ) : (
                <div className="mt-8 grid grid-cols-12 gap-4">
                    {blogs.map((blog) => (
                        <div key={blog.id} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                            <div className="h-full bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                                <NextLink href={`/web/blog/${blog.slug}`}>
                                    <img
                                        src={blog.image || "/assets/img/blog-img1.png"}
                                        alt={blog.title}
                                        className="w-full h-44 object-cover"
                                    />
                                </NextLink>

                                <div className="p-4">
                                    <div className="flex items-center justify-between text-[11px] text-[var(--text-color2)]">
                                        <span>{formatDate(blog.published_at)}</span>
                                        {blog.read_time && <span>{blog.read_time} min read</span>}
                                    </div>

                                    <h2 className="text-[18px] font-bold text-[var(--text-color1)] mt-2 leading-snug line-clamp-2">
                                        {blog.title}
                                    </h2>

                                    {blog.excerpt && (
                                        <p className="mt-2 text-[13px] text-[var(--text-color2)] line-clamp-3">
                                            {blog.excerpt}
                                        </p>
                                    )}

                                    <NextLink
                                        href={`/web/blog/${blog.slug}`}
                                        className="flex items-center gap-1.5 text-[var(--primary-color)] text-[13px] font-semibold mt-3 no-underline hover:no-underline hover:gap-2.5 transition-all"
                                    >
                                        Read More <FaArrowRight size={12} />
                                    </NextLink>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
