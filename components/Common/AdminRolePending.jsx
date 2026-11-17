"use client";

import React from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiClock, FiHome, FiLogOut, FiRefreshCw, FiShield } from "react-icons/fi";
import { useUser } from "../../context/UserContext";

/**
 * Seller / broker / staff panel URL (/seller/dashboard ...) before super admin assigns an admin role.
 * After the role is assigned, a page refresh (UserContext reloads /profile)
 * moves them to the admin panel - no logout / login needed.
 */
export default function AdminRolePending() {
  const router = useRouter();
  const { user, logout } = useUser();
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="h-1.5 bg-[#E87722]" />

        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <FiShield className="h-8 w-8 text-[#E87722]" />
          </div>

          <p className="mb-0 mt-5 text-xs font-semibold uppercase tracking-wider text-[#62748E]">
            {roleLabel} Account
          </p>

          <h2 className="mb-0 mt-1 text-xl font-bold text-[#001737] sm:text-2xl">
            Hello {user?.name || roleLabel}, your dashboard is not active yet
          </h2>

          <p className="mb-0 mt-3 text-sm leading-6 text-[#62748E]">
            Your dashboard will be available once the admin assigns a role to your account.
            The menus and features you get depend on the role and permissions given by the admin.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-[#9a4a10]">
            <FiClock className="h-4 w-4 shrink-0" />
            Waiting for admin to assign a role. Refresh this page after it is assigned.
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
            >
              <FiRefreshCw size={15} />
              Check Again
            </button>

            <NextLink
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-5 text-sm font-semibold text-[#001737] no-underline transition hover:bg-gray-50"
            >
              <FiHome size={15} />
              Go to Website
            </NextLink>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <FiLogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
