import NextLink from "next/link";
import React, { useEffect, useState } from 'react'
import { FiArrowRight } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa";
import { getBlogs } from "../../../../utils/fetchApi";

// Jan 12, 2025
const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "";

export default function Blogs() {
    const [blogs, setBlogs] = useState([]);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await getBlogs(3);

                if (res?.status && Array.isArray(res?.data?.blogs)) {
                    setBlogs(res.data.blogs);
                }
            } catch (error) {
                console.error("Failed to fetch blogs:", error);
            }
        };

        fetchBlogs();
    }, []);

    // Hide section until admin publishes a blog
    if (blogs.length === 0) {
        return null;
    }

    return (
        <section className="container mt-[60px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Real Estate News & Insights
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Stay ahead with smart property trends, regulatory updates and investment advice
                    </p>
                </div>
                <NextLink
                    href="/web/blog"
                    className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 shrink-0 whitespace-nowrap"
                >
                    View All News Blogs
                    <FiArrowRight className="text-base" />
                </NextLink>
            </div>


            <div className="grid grid-cols-12 gap-4 mt-[30px]">
                {blogs.map((blog) => (
                    <div key={blog.id} className="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
                        <div className="max-w-sm w-full bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 mx-auto">
                            {/* Image */}
                            <NextLink href={`/web/blog/${blog.slug}`}>
                                <img
                                    src={blog.image || "/assets/img/blog-img1.png"}
                                    alt={blog.title}
                                    className="w-full h-44 object-cover"
                                />
                            </NextLink>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-center justify-between text-[11px] text-[var(--text-color2)]">
                                    <span>{formatDate(blog.published_at)}</span>
                                    {blog.read_time && <span>{blog.read_time} min read</span>}
                                </div>

                                <h2 className="text-[18px] font-bold text-[var(--text-color1)] mt-2 leading-snug line-clamp-1">
                                    {blog.title}
                                </h2>

                                <NextLink
                                    href={`/web/blog/${blog.slug}`}
                                    className="flex items-center gap-1.5 text-[var(--primary-color)] text-[13px] font-semibold mt-3 hover:gap-2.5 transition-all"
                                >
                                    Read More <FaArrowRight size={12} />
                                </NextLink>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
