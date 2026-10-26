"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Link, Spinner, Tooltip } from "@heroui/react";
import { deleteBlog, getAdminBlogs, saveBlog } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import Pagination from "../../Pagination/Pagination";
import { AiOutlineEye } from "react-icons/ai";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";

// Jan 12, 2025
export const formatBlogDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function Listing() {
    const can = useAdminPermission();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search
    const [search, setSearch] = useState("");

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch Blogs
    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);

            try {
                const res = await getAdminBlogs();

                setBlogs(
                    res?.status && Array.isArray(res?.data?.blogs)
                        ? res.data.blogs
                        : []
                );
            } catch (error) {
                console.error("Failed to fetch blogs:", error);
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    // Search Filter
    const filteredBlogs = useMemo(() => {
        if (!search) return blogs;

        return blogs.filter((blog) =>
            `${blog?.title ?? ""} ${blog?.category ?? ""} ${blog?.author_name ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [blogs, search]);

    // Pagination Calculation
    const pageCount = Math.ceil(filteredBlogs.length / pageSize);

    const currentPageBlogs = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredBlogs.slice(start, start + pageSize);
    }, [filteredBlogs, pageIndex, pageSize]);

    const tableProps = {
        pageCount,
        pageOptions: Array.from({ length: pageCount }),
        state: { pageIndex, pageSize },
        gotoPage: (page) => setPageIndex(page),
        setPageSize: (size) => {
            setPageSize(size);
            setPageIndex(0);
        },
    };

    const sizePerPageList = [
        { text: "10", value: 10 },
        { text: "25", value: 25 },
        { text: "50", value: 50 },
    ];

    // Scheduled = published in future
    const isScheduled = (blog) =>
        blog.published_at && new Date(blog.published_at) > new Date();

    // Toggle Active / Inactive
    const handleToggleActive = async (blog) => {
        try {
            const formData = new FormData();
            formData.append("is_active", blog.is_active ? "0" : "1");

            const res = await saveBlog(formData, blog.id);

            setBlogs((previous) =>
                previous.map((item) =>
                    item.id === blog.id
                        ? { ...item, is_active: !blog.is_active }
                        : item
                )
            );

            showToast(res?.message || "Blog status updated successfully.");
        } catch (error) {
            showToast(error?.message || "Failed to update blog status.", "error");
        }
    };

    // Delete
    const handleDeleteClick = (blog) => {
        setSelectedBlog(blog);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedBlog?.id) return;

        setDeleteLoading(true);

        try {
            const res = await deleteBlog(selectedBlog.id);

            setBlogs((previous) =>
                previous.filter((blog) => blog.id !== selectedBlog.id)
            );

            setDeleteModalOpen(false);
            setSelectedBlog(null);
            showToast(res?.message || "Blog deleted successfully.");
        } catch (error) {
            showToast(error?.message || "Something went wrong while deleting the blog.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Blogs", active: true },
                ]}
                title="Real Estate News & Insights"
            />

            {/* Search + Add */}
            <div className="flex justify-between items-center gap-3 mt-6 mb-4">
                <input
                    type="text"
                    placeholder="Search by title, category, author..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className="w-full sm:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(232,119,34)]"
                />

                {can('blogs.create') && (
                <Link
                    href="/admin/blog/createBlog"
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                >
                    <FiPlus size={16} />
                    <span className="hidden sm:inline">Add Blog</span>
                </Link>
                )}
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Blog</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Published</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4">
                                    <div className="flex justify-center items-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        ) : currentPageBlogs.length > 0 ? (
                            currentPageBlogs.map((blog) => (
                                <tr key={blog.id} className="border-t hover:bg-gray-50/60">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {blog.image ? (
                                                <img
                                                    src={blog.image}
                                                    alt={blog.title}
                                                    className="h-14 w-20 shrink-0 rounded-lg object-cover border"
                                                />
                                            ) : (
                                                <div className="h-14 w-20 shrink-0 rounded-lg border bg-gray-50" />
                                            )}
                                            <div className="min-w-0">
                                                {blog.category && (
                                                    <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#E87722]">
                                                        {blog.category}
                                                    </span>
                                                )}
                                                <div className="mt-0.5 font-semibold text-[#1A1F36] line-clamp-1 max-w-[420px]">
                                                    {blog.title}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[420px]">
                                                    {blog.author_name ? `By ${blog.author_name}` : "-"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span>{formatBlogDate(blog.published_at)}</span>
                                            {isScheduled(blog) && (
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                    Scheduled
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {blog.read_time ? `${blog.read_time} min read` : "-"}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Tooltip content={blog.is_active ? "Click to deactivate" : "Click to activate"}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(blog)}
                                                disabled={!can('blogs.edit')}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold
                                                ${blog.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {blog.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </Tooltip>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {blog.is_active && !isScheduled(blog) && (
                                                <Tooltip content="View on Website">
                                                    <a
                                                        href={`/web/blog/${blog.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={actionButtonClass}
                                                    >
                                                        <AiOutlineEye size={18} />
                                                    </a>
                                                </Tooltip>
                                            )}

                                            {can('blogs.edit') && (
                                            <Tooltip content="Update Blog">
                                                <Link
                                                    href={`/admin/blog/blogUpdate/${blog.id}`}
                                                    className={actionButtonClass}
                                                >
                                                    <FaPen size={13} />
                                                </Link>
                                            </Tooltip>
                                            )}

                                            {can('blogs.delete') && (
                                            <Tooltip content="Delete Blog">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(blog)}
                                                    className={actionButtonClass}
                                                >
                                                    <FaRegTrashCan size={14} />
                                                </button>
                                            </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-6 text-gray-500">
                                    {search ? "No blogs found" : 'No blogs yet. Click "Add Blog" to create one.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-3 border-t">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>
            </div>

            {/* Delete Modal */}
            <Tmodal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteModalOpen(false);
                        setSelectedBlog(null);
                    }
                }}
                title="Delete Blog"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedBlog(null);
                            }}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
                        >
                            {deleteLoading ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </button>
                    </div>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">
                        {selectedBlog?.title}
                    </span>
                    ?
                </p>
            </Tmodal>
        </div>
    );
}
