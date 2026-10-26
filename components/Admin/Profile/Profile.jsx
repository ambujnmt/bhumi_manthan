"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiCheck, FiMail, FiPhone, FiShield, FiUser } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import { getProfile } from "../../../utils/fetchApi";

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

function CardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-7">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
        <Icon className="h-[18px] w-[18px] text-[#E87722]" />
      </div>

      <div>
        <h3 className="mb-0 text-sm font-bold text-[#001737] sm:text-base">{title}</h3>
        <p className="mb-0 text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProfile();

        if (response?.status) {
          setProfile(response?.data?.user);
        } else {
          setError(response?.message);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
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
                <CardHeader icon={FiUser} title="Personal Information" subtitle="Basic account details" />

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
