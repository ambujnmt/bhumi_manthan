"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { useRouter } from "next/router";
import { getAdminRoles, getUserDetail, updateUser } from "../../../utils/adminFetchApi";
import { Spinner } from "@heroui/react";
import { showToast } from "../../../store/toast";
import { useUser } from "../../../context/UserContext";
import { getAdminPlans } from "../../../utils/fetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";

const initialForm = {
    name: "",
    email: "",
    phone: "",
    city: "",
    role: "customer",
    admin_role_id: "",
    status: "active",
    // Paid / free listing control (seller / broker)
    listing_access: "standard",
    plan_id: "",
    promo_expires_at: "",
    promo_note: "",
};

const LISTING_FIELDS = ["listing_access", "plan_id", "promo_expires_at", "promo_note"];

// Roles with a listing limit
const LISTING_ROLES = ["seller", "broker"];

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
    { name: "city", label: "City", placeholder: "e.g. Noida" },
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

// Page (/admin/user/userUpdate/[id]) or modal (User Management list):
// inModal -> no page title, no redirect; onSaved(user) after save, onCancel on Cancel
export default function Update({ userId = null, inModal = false, onSaved = null, onCancel = null }) {
    const router = useRouter();
    const id = userId ?? router.query.id;

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

    // Plan for free / unlimited free listings: super admin or staff with plans.edit
    const can = useAdminPermission();
    const canControlListings = isSuperAdmin || can("plans.edit");
    const [plans, setPlans] = useState([]);
    const [quota, setQuota] = useState(null);

    useEffect(() => {
        if (!canControlListings) return;

        getAdminPlans()
            .then((res) => setPlans(Array.isArray(res?.data?.plans) ? res.data.plans : []))
            .catch(() => setPlans([]));
    }, [canControlListings]);

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
                        city: user.city || "",
                        role: user.role || "customer",
                        admin_role_id: user.admin_role_id ? String(user.admin_role_id) : "",
                        status: user.status || "active",
                        listing_access: user.listing_quota?.listing_access || "standard",
                        plan_id: user.listing_quota?.plan_id ? String(user.listing_quota.plan_id) : "",
                        promo_expires_at: user.listing_quota?.promo_expires_at || "",
                        promo_note: user.listing_quota?.promo_note || "",
                    });
                    setQuota(user.listing_quota || null);
                    setInitialRole(user.role || "customer");
                    setLoaded(true);
                } else {
                    setMessage(res?.message || "User not found.");
                    setMessageType("error");
                }
            } catch (error) {
                // No console.error: it opens the Next dev error overlay
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

                // listing plan fields only for seller / broker, by allowed admin
                if (LISTING_FIELDS.includes(key) && (!canControlListings || !LISTING_ROLES.includes(form.role))) return;

                payload.append(key, value || "");
            });

            const res = await updateUser(id, payload);

            if (res?.status) {
                showToast(res.message || "User updated successfully.");

                if (inModal) {
                    onSaved?.(res.data?.user);
                } else {
                    setTimeout(() => {
                        router.push("/admin/user/userManagement");
                    }, 2000);
                }
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
        <div className={inModal ? "" : "min-h-screen"}>
            {!inModal && <PageTitle breadCrumbItems={breadCrumbItems} title="User Management" />}

            <div className={inModal ? "w-full" : "mx-auto mt-4 w-full"}>
                <div className={inModal ? "" : "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"}>

                    {message && (
                        <div
                            role={messageType === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`${inModal ? "mb-4" : "mx-5 mt-5 sm:mx-7"} rounded-lg border px-4 py-3 text-sm ${
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
                        <div className={`flex items-center justify-center ${inModal ? "min-h-[240px]" : "min-h-[300px]"}`}>
                            <Spinner size="lg" />
                        </div>
                    ) : loaded && (
                        <form onSubmit={handleSubmit} className={inModal ? "pt-1" : "p-5 sm:p-7"}>
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

                            {/* Paid / free listing control (seller / broker) */}
                            {canControlListings && LISTING_ROLES.includes(form.role) && (
                                <section className="mb-8">
                                    <h3 className="mb-5 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                                        Listing Plan &amp; Promotion
                                    </h3>

                                    {quota && LISTING_ROLES.includes(initialRole) && (
                                        <p className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-[#62748E]">
                                            Listings used: <strong className="text-[#001737]">{quota.used}</strong>
                                            {" / "}
                                            <strong className="text-[#001737]">{quota.unlimited ? "Unlimited" : quota.limit}</strong>
                                            {quota.source === "promotional" && " (Promotional free listings)"}
                                            {quota.source === "plan" && ` (Plan: ${quota.plan_name})`}
                                            {quota.source === "default" && " (Free listing rule)"}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="listing_access" className={labelClass}>
                                                Listing Access
                                            </label>
                                            <select
                                                id="listing_access"
                                                name="listing_access"
                                                value={form.listing_access}
                                                onChange={handleChange}
                                                className={inputClass}
                                            >
                                                <option value="standard">Standard (plan / free listing limit)</option>
                                                <option value="unlimited_free">Unlimited Free Listings (bypass paid listing)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="plan_id" className={labelClass}>
                                                Assign Plan (free, by admin)
                                            </label>
                                            <select
                                                id="plan_id"
                                                name="plan_id"
                                                value={form.plan_id}
                                                onChange={handleChange}
                                                className={inputClass}
                                            >
                                                <option value="">No plan</option>
                                                {plans.map((plan) => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name} ({plan.total_listings || Number(plan.paid_listings || 0) + Number(plan.free_listings || 0)} listings)
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mb-0 mt-1 text-xs text-[#62748E]">
                                                Plan&apos;s listings are given without payment.
                                            </p>
                                        </div>

                                        {form.listing_access === "unlimited_free" && (
                                            <div>
                                                <label htmlFor="promo_expires_at" className={labelClass}>
                                                    Promotion Valid Till
                                                </label>
                                                <input
                                                    id="promo_expires_at"
                                                    name="promo_expires_at"
                                                    type="date"
                                                    value={form.promo_expires_at}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                />
                                                <p className="mb-0 mt-1 text-xs text-[#62748E]">
                                                    Leave empty for no end date. After this date the plan / free limit applies again.
                                                </p>
                                            </div>
                                        )}

                                        <div className={form.listing_access === "unlimited_free" ? "" : "sm:col-span-2"}>
                                            <label htmlFor="promo_note" className={labelClass}>
                                                Promotion Note
                                            </label>
                                            <input
                                                id="promo_note"
                                                name="promo_note"
                                                type="text"
                                                maxLength={255}
                                                value={form.promo_note}
                                                onChange={handleChange}
                                                placeholder="e.g. Launch offer for new brokers"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => (inModal ? onCancel?.() : router.push("/admin/user/userManagement"))}
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
