"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { useRouter } from "next/router";
import { getAdminRoles, getUserDetail, updateUser } from "../../../utils/adminFetchApi";
import { Spinner } from "@heroui/react";
import { showToast } from "../../../store/toast";
import { useUser } from "../../../context/UserContext";

const initialForm = {
    name: "",
    email: "",
    phone: "",
    role: "customer",
    admin_role_id: "",
    status: "active",
};

const USER_ROLES = [
    { value: "customer", label: "Customer" },
    { value: "seller", label: "Seller" },
    { value: "broker", label: "Broker" },
];

// Staff (admin panel access) only for super admin
const STAFF_ROLE = { value: "staff", label: "Staff (Admin Panel)" };

// Roles that can get admin panel access through an admin role (customer never)
const PANEL_ROLES = ["staff", "seller", "broker"];

const fields = [
    { name: "name", label: "Name", required: true, placeholder: "Enter name" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "Enter email" },
    { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "Enter phone" },
    {
        name: "status",
        label: "Status",
        type: "select",
        options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
        ],
    },
];

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const breadCrumbItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "User", path: "/admin/user/userManagement" },
    { label: "Update", active: true },
];

export default function Update() {
    const router = useRouter();
    const { id } = router.query;

    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    // Admin roles for "Staff" (super admin only)
    const { user: loggedInUser } = useUser();
    const isSuperAdmin = loggedInUser?.role === "super_admin";
    const [adminRoles, setAdminRoles] = useState([]);
    const [initialRole, setInitialRole] = useState("");

    const roleOptions = isSuperAdmin ? [...USER_ROLES, STAFF_ROLE] : USER_ROLES;

    useEffect(() => {
        if (!isSuperAdmin) return;

        getAdminRoles()
            .then((res) => setAdminRoles(res?.data?.roles || []))
            .catch(() => setAdminRoles([]));
    }, [isSuperAdmin]);

    /* =======================================================
       FETCH USER
    ======================================================= */

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            setLoading(true);

            try {
                const res = await getUserDetail(id);

                if (res?.status && res?.data?.user) {
                    const user = res.data.user;

                    setForm({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        role: user.role || "customer",
                        admin_role_id: user.admin_role_id ? String(user.admin_role_id) : "",
                        status: user.status || "active",
                    });
                    setInitialRole(user.role || "customer");
                    setLoaded(true);
                } else {
                    setMessage(res?.message || "User not found.");
                    setMessageType("error");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);

                setMessage(error?.message || "Failed to load user details.");
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    /* =======================================================
       HANDLE UPDATE
    ======================================================= */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (form.role === "staff" && !form.admin_role_id) {
            setMessage("Please select an admin role for staff.");
            setMessageType("error");
            return;
        }

        setSaving(true);
        setMessage("");
        setMessageType("");

        try {
            const payload = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                // admin_role_id only for staff
                if (key === "admin_role_id" && !PANEL_ROLES.includes(form.role)) return;

                payload.append(key, value || "");
            });

            const res = await updateUser(id, payload);

            if (res?.status) {
                showToast(res.message || "User updated successfully.");

                setTimeout(() => {
                    router.push("/admin/user/userManagement");
                }, 2000);
            } else {
                setMessage(res?.message || "Failed to update user.");
                setMessageType("error");
                showToast(res?.message || "Failed to update user.", "error");
            }
        } catch (error) {
            setMessage(error?.message || "Something went wrong.");
            setMessageType("error");
            showToast(error?.message || "Something went wrong.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen">
            <PageTitle breadCrumbItems={breadCrumbItems} title="User Management" />

            <div className="mx-auto mt-4 w-full">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                    {message && (
                        <div
                            role={messageType === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`mx-5 mt-5 rounded-lg border px-4 py-3 text-sm sm:mx-7 ${
                                messageType === "success"
                                    ? " text-green-800"
                                    : " text-red-700"
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <span className="font-bold">
                                    {messageType === "success" ? "✓" : "!"}
                                </span>
                                <p>{message}</p>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <Spinner size="lg" />
                        </div>
                    ) : loaded && (
                        <form onSubmit={handleSubmit} className="p-5 sm:p-7">
                            <section className="mb-8">
                                <h3 className="mb-5 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                                    User Information
                                </h3>

                                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                                    {fields.map((field) => (
                                        <div key={field.name}>
                                            <label htmlFor={field.name} className={labelClass}>
                                                {field.label}
                                                {field.required && (
                                                    <span className="ml-1 text-red-500">*</span>
                                                )}
                                            </label>

                                            {field.type === "select" ? (
                                                <select
                                                    id={field.name}
                                                    name={field.name}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                >
                                                    {field.options.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type={field.type || "text"}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    className={inputClass}
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {/* Role */}
                                    <div>
                                        <label htmlFor="role" className={labelClass}>
                                            Role<span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <select
                                            id="role"
                                            name="role"
                                            value={form.role}
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            {roleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Admin role (permissions) for staff */}
                                    {PANEL_ROLES.includes(form.role) && (
                                        <div>
                                            <label htmlFor="admin_role_id" className={labelClass}>
                                                Admin Role (Dashboard Access){form.role === "staff" && <span className="ml-1 text-red-500">*</span>}
                                            </label>
                                            <select
                                                id="admin_role_id"
                                                name="admin_role_id"
                                                value={form.admin_role_id}
                                                onChange={handleChange}
                                                className={inputClass}
                                            >
                                                <option value="">{form.role === "staff" ? "Select admin role" : "Not assigned (dashboard locked)"}</option>
                                                {adminRoles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}{role.is_active ? "" : " (inactive)"}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mb-0 mt-1 text-xs text-[#62748E]">
                                                {adminRoles.length === 0
                                                    ? "No admin role yet. Create one in Roles & Permissions."
                                                    : "Staff can open only the admin pages allowed in this role."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {form.role !== initialRole && (
                                    <p className="mb-0 mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9a4a10]">
                                        User stays logged in. The new dashboard and menus open on their next page refresh.
                                    </p>
                                )}
                            </section>

                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => router.push("/admin/user/userManagement")}
                                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex min-w-[175px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {saving ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    className="opacity-25"
                                                />
                                                <path
                                                    d="M21 12a9 9 0 0 0-9-9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    className="opacity-90"
                                                />
                                            </svg>
                                            Updating User...
                                        </>
                                    ) : (
                                        "Update User"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
