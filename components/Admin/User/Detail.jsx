"use client";

import React, { useEffect, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { getUserDetail } from "../../../utils/adminFetchApi";

export default function Detail() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading(true);

      try {
        const res = await getUserDetail(id);

        console.log("User Detail API Response:", res);

        if (res?.status && res?.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user detail:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Format date
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

  // Format role
  const formatRole = (role) => {
    if (!role) return "-";

    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="min-h-screen">
      {/* Page Title */}
      <PageTitle
        breadCrumbItems={[
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "User Listing", path: "/admin/user/userManagement" },
          { label: "Detail", active: true },
        ]}
        title="User Detail"
      />

      <div className="mt-4">
        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" />
          </div>
        ) : !user ? (
          /* User Not Found */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">👤</div>

            <h3 className="text-lg font-semibold text-[#001737]">
              User Not Found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              The requested user could not be found.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-5">

            {/* ========================================================= */}
            {/* USER HEADER */}
            {/* ========================================================= */}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Orange Top Border */}
              <div className="h-1.5 bg-[#E87722]" />

              <div className="p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                  {/* User Identity */}
                  <div className="flex items-center gap-4">

                    {/* Initial Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#001737] flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {user.name
                          ? user.name.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        User Profile
                      </p>

                      <h2 className="text-xl sm:text-2xl font-bold text-[#001737]">
                        {user.name || "Unknown User"}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1 break-all">
                        {user.email || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Account Status
                    </span>

                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        user.status === "active"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.status === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />

                      {user.status
                        ? user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BASIC INFORMATION */}
            {/* ========================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Personal Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 sm:px-7 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                    <span className="text-[#E87722] text-lg">👤</span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#001737]">
                      Personal Information
                    </h3>

                    <p className="text-xs text-gray-400">
                      Basic user details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">

                  {/* Name */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Full Name
                    </p>

                    <p className="text-sm font-semibold text-gray-800">
                      {user.name || "-"}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Email Address
                    </p>

                    <p className="text-sm font-semibold text-gray-800 break-all">
                      {user.email || "-"}
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Phone Number
                    </p>

                    <p className="text-sm font-semibold text-gray-800">
                      {user.phone || "-"}
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      User Role
                    </p>

                    <span className="inline-flex px-3 py-1.5 rounded-lg bg-[#001737] text-white text-xs font-semibold">
                      {formatRole(user.role)}
                    </span>
                  </div>

                  {/* Created On */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Created On
                    </p>

                    <span className="text-sm font-semibold text-gray-800">
                      {formatDate(user.created_at)}
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Last Updated
                    </p>

                    <span className="text-sm font-semibold text-gray-800">
                      {formatDate(user.updated_at)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 sm:px-7 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                    <span className="text-[#E87722] text-lg">✓</span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#001737]">
                      Account Information
                    </h3>

                    <p className="text-xs text-gray-400">
                      Verification and account details
                    </p>
                  </div>
                </div>

                <div className="px-5 py-1 sm:px-7">

                  <div className="space-y-0">

                    {/* Email Verification */}
                    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Email Verification
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Email verification status
                        </p>
                      </div>

                      {user.is_verified ? (
                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                          ✕ Not Verified
                        </span>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Terms & Conditions
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Terms acceptance status
                        </p>
                      </div>

                      {user.terms_accepted ? (
                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                          ✓ Accepted
                        </span>
                      ) : (
                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                          ✕ Not Accepted
                        </span>
                      )}
                    </div>

                    {/* Account Status */}
                    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Account Status
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Current account state
                        </p>
                      </div>

                      <span
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {user.status
                          ? user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
