"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiCheck, FiEdit2, FiMail, FiPhone, FiShield, FiUser } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import { getMyPlanOrders, getProfile, updateProfile } from "../../../utils/fetchApi";
import { useUser } from "../../../context/UserContext";
import { showToast } from "../../../store/toast";
import MyPlanCard from "./MyPlanCard";

// Same module keys as backend AdminRole::MODULES
const MODULE_LABELS = {
  dashboard: "Dashboard",
  users: "User Management",
  properties: "Property Management",
  projects: "Projects",
  blogs: "Blogs",
  locations: "States & Cities",
  banners: "Banners",
  contact_messages: "Contact Messages",
  enquiries: "Property Enquiries",
  settings: "Site Settings",
};

const ACTION_ORDER = ["view", "create", "edit", "delete"];

const cardClass = "rounded-xl border border-gray-200 bg-white shadow-sm";

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRole = (role) =>
  role ? role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "-";

// ["users.view", "users.edit"] -> [{ module: "users", label, actions: ["view", "edit"] }]
const groupPermissions = (permissions = []) => {
  const groups = {};

  permissions.forEach((permission) => {
    const [module, action] = permission.split(".");
    (groups[module] ||= []).push(action);
  });

  return Object.keys(MODULE_LABELS)
    .filter((module) => groups[module])
    .map((module) => ({
      module,
      label: MODULE_LABELS[module],
      actions: ACTION_ORDER.filter((action) => groups[module].includes(action)),
    }));
};

// Grey blocks in the page's shape while profile + plan load (one loader, no jump)
function ProfileSkeleton({ showPlan }) {
  const line = "rounded bg-gray-200";

  return (
    <div className="w-full animate-pulse space-y-5" aria-busy="true" aria-label="Loading profile">
      {/* Header */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="h-1.5 bg-gray-200" />
        <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 sm:h-20 sm:w-20" />
            <div className="space-y-2.5">
              <div className={`${line} h-3 w-20`} />
              <div className={`${line} h-5 w-44`} />
              <div className={`${line} h-5 w-24`} />
            </div>
          </div>
          <div className="h-8 w-24 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Personal + account */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className={cardClass}>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-7">
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className={`${line} h-3.5 w-36`} />
                <div className={`${line} h-2.5 w-48`} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className={`${line} h-2.5 w-16`} />
                  <div className={`${line} h-4 w-32`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* My plan */}
      {showPlan && (
        <div className={cardClass}>
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-7">
            <div className="h-9 w-9 rounded-lg bg-gray-200" />
            <div className="space-y-2">
              <div className={`${line} h-3.5 w-24`} />
              <div className={`${line} h-2.5 w-56`} />
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-7">
            <div className="h-20 rounded-xl bg-gray-100" />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className={`${line} h-2.5 w-16`} />
                  <div className={`${line} h-4 w-24`} />
                </div>
              ))}
            </div>
            <div className={`${line} h-2 w-full`} />
          </div>
        </div>
      )}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, action = null }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-7">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
        <Icon className="h-[18px] w-[18px] text-[#E87722]" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-0 text-sm font-bold text-[#001737] sm:text-base">{title}</h3>
        <p className="mb-0 text-xs text-gray-400">{subtitle}</p>
      </div>

      {action}
    </div>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const labelClass = "mb-0 block text-xs font-medium uppercase tracking-wide text-gray-400";

const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

// Edit name + phone (email is verified with OTP, so it stays read only)
function EditProfileForm({ profile, onCancel, onSaved }) {
  const [form, setForm] = useState({ name: profile.name || "", phone: profile.phone || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();
    const nextErrors = {};

    if (!name) nextErrors.name = "Please enter your name.";
    if (!phone) nextErrors.phone = "Please enter your phone number.";
    else if (!PHONE_PATTERN.test(phone)) nextErrors.phone = "Please enter a valid phone number.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      const res = await updateProfile({ name, phone });
      showToast(res?.message || "Profile updated successfully.");
      onSaved(res?.data?.user);
    } catch (error) {
      const fieldErrors = Object.fromEntries(
        Object.entries(error?.errors || {}).map(([key, messages]) => [key, [].concat(messages)[0]])
      );

      setErrors(fieldErrors);
      showToast(error?.message || "Unable to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <div>
        <label htmlFor="admin_profile_name" className={labelClass}>
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="admin_profile_name"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={255}
          autoComplete="name"
          className={inputClass}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="mb-0 mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="admin_profile_phone" className={labelClass}>
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          id="admin_profile_phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          maxLength={20}
          autoComplete="tel"
          className={inputClass}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <p className="mb-0 mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="admin_profile_email" className={labelClass}>
          Email Address
        </label>
        <input id="admin_profile_email" value={profile.email || ""} disabled className={inputClass} />
        <p className="mb-0 mt-1 text-xs text-gray-400">Email is verified with OTP and can&apos;t be changed here.</p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#E87722] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Spinner size="sm" color="white" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ ok, okText, noText }) {
  return (
    <span
      className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
        ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {ok ? `✓ ${okText}` : `✕ ${noText}`}
    </span>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const { user: loggedInUser, updateUser } = useUser();

  // Saved profile: page + logged in user (header name) update at once
  const handleSaved = (user) => {
    if (user) {
      setProfile(user);
      updateUser({ ...(loggedInUser || {}), ...user });
    }

    setEditing(false);
  };

  // My Plan card data (seller / broker / staff), loaded together with the profile
  const [planData, setPlanData] = useState(null);
  const [planError, setPlanError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      // Profile + plan in parallel: one loader for the whole page
      const wantsPlan = ["seller", "broker", "staff"].includes(loggedInUser?.role);

      const [profileResult, planResult] = await Promise.allSettled([
        getProfile(),
        wantsPlan ? getMyPlanOrders() : Promise.resolve(null),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value?.status) {
        setProfile(profileResult.value.data?.user);
      } else {
        // No console.error: it opens the Next dev error overlay
        setError(profileResult.reason?.message || profileResult.value?.message || "Profile could not be loaded.");
      }

      if (planResult.status === "fulfilled") {
        setPlanData(planResult.value?.data ?? null);
      } else {
        setPlanError(planResult.reason?.message || "Plan details could not be loaded.");
      }

      setLoading(false);
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuperAdmin = profile?.role === "super_admin";
  const permissionGroups = groupPermissions(profile?.permissions);

  return (
    <div className="min-h-screen">
      <PageTitle
        breadCrumbItems={[
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "My Profile", active: true },
        ]}
        title="My Profile"
      />

      <div className="mt-4">
        {loading ? (
          <ProfileSkeleton showPlan={["seller", "broker", "staff"].includes(loggedInUser?.role)} />
        ) : error || !profile ? (
          <div className={`${cardClass} p-10 text-center`}>
            <h3 className="mb-0 text-lg font-semibold text-[#001737]">Profile not available</h3>
            <p className="mb-0 mt-1 text-sm text-gray-500">
              {error || "Profile information could not be loaded."}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-5">

            {/* ========================================================= */}
            {/* PROFILE HEADER */}
            {/* ========================================================= */}

            <div className={`${cardClass} overflow-hidden`}>
              <div className="h-1.5 bg-[#E87722]" />

              <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <div className="flex min-w-0 items-center gap-4">
                  {/* First letter avatar */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#001737] sm:h-20 sm:w-20">
                    <span className="text-2xl font-bold uppercase text-white sm:text-3xl">
                      {(profile.name || profile.email || "U").trim().charAt(0)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                      My Account
                    </p>

                    <h2 className="mb-0 truncate text-xl font-bold text-[#001737] sm:text-2xl">
                      {profile.name || "-"}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-[#001737] px-2.5 py-1 text-xs font-semibold text-white">
                        {formatRole(profile.role)}
                      </span>

                      {profile.admin_role && (
                        <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#E87722]">
                          <FiShield size={12} />
                          {profile.admin_role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Account Status</span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold capitalize ${
                      profile.status === "active"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${profile.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                    {profile.status || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PERSONAL + ACCOUNT INFORMATION */}
            {/* ========================================================= */}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {/* Personal Information */}
              <div className={cardClass}>
                <CardHeader
                  icon={FiUser}
                  title={editing ? "Edit Personal Information" : "Personal Information"}
                  subtitle={editing ? "Update your name and phone number" : "Basic account details"}
                  action={
                    !editing && (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E87722] px-3 py-1.5 text-xs font-semibold text-[#E87722] transition hover:bg-[#E87722] hover:text-white"
                      >
                        <FiEdit2 size={13} />
                        Edit
                      </button>
                    )
                  }
                />

                {editing ? (
                  <EditProfileForm profile={profile} onCancel={() => setEditing(false)} onSaved={handleSaved} />
                ) : (
                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  {[
                    { label: "Full Name", value: profile.name },
                    { label: "Phone Number", value: profile.phone, icon: FiPhone },
                    { label: "Email Address", value: profile.email, icon: FiMail, full: true },
                    { label: "Member Since", value: formatDate(profile.created_at) },
                    { label: "Last Updated", value: formatDate(profile.updated_at) },
                  ].map((field) => (
                    <div key={field.label} className={field.full ? "sm:col-span-2" : ""}>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                        {field.label}
                      </p>

                      <p className="mb-0 flex items-center gap-1.5 break-all text-sm font-semibold text-gray-800">
                        {field.icon && <field.icon className="h-3.5 w-3.5 flex-shrink-0 text-[#62748E]" />}
                        {field.value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Account Information */}
              <div className={cardClass}>
                <CardHeader icon={FiCheck} title="Account Information" subtitle="Verification and account details" />

                <div className="px-5 py-1 sm:px-7">
                  {[
                    {
                      title: "Email Verification",
                      subtitle: "Email verification status",
                      badge: <StatusBadge ok={profile.is_verified} okText="Verified" noText="Not Verified" />,
                    },
                    {
                      title: "Terms & Conditions",
                      subtitle: "Terms acceptance status",
                      badge: <StatusBadge ok={profile.terms_accepted} okText="Accepted" noText="Not Accepted" />,
                    },
                    {
                      title: "Account Status",
                      subtitle: "Current account state",
                      badge: <StatusBadge ok={profile.status === "active"} okText="Active" noText="Inactive" />,
                    },
                  ].map((row) => (
                    <div
                      key={row.title}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0"
                    >
                      <div>
                        <p className="mb-0 text-sm font-semibold text-gray-800">{row.title}</p>
                        <p className="mb-0 mt-1 text-xs text-gray-400">{row.subtitle}</p>
                      </div>

                      {row.badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* MY PLAN (seller / broker / staff) */}
            {/* ========================================================= */}

            {["seller", "broker", "staff"].includes(profile.role) && (
              <MyPlanCard cardClass={cardClass} CardHeader={CardHeader} data={planData} error={planError} />
            )}

            {/* ========================================================= */}
            {/* ACCESS & PERMISSIONS */}
            {/* ========================================================= */}

            <div className={cardClass}>
              <CardHeader
                icon={FiShield}
                title="Access & Permissions"
                subtitle={
                  isSuperAdmin
                    ? "Super Admin has full access to every module"
                    : profile.admin_role
                      ? `Given by admin role "${profile.admin_role}"`
                      : "No admin role assigned"
                }
              />

              <div className="p-5 sm:p-7">
                {isSuperAdmin ? (
                  <p className="mb-0 flex items-center gap-2 text-sm font-semibold text-green-700">
                    <FiCheck /> Full access, including Roles & Permissions.
                  </p>
                ) : permissionGroups.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {permissionGroups.map((group) => (
                      <div key={group.module} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="mb-0 text-sm font-semibold text-[#1A1F36]">{group.label}</p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.actions.map((action) => (
                            <span
                              key={action}
                              className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-[#E87722] ring-1 ring-orange-100"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0 text-sm text-[#62748E]">
                    {profile.admin_role
                      ? "Your admin role is inactive or has no permissions. Please contact the admin."
                      : "Admin panel access will be available once the admin assigns a role to your account."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
