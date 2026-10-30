"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { getProfile } from "../../../utils/fetchApi";
import { subscribeChatUnread } from "../../../utils/firebaseChat";
import ChatBox from "../../Admin/Chat/ChatBox";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ?tab=chat opens Messages directly
  const router = useRouter();
  const tab = router.query.tab === "chat" ? "chat" : "profile";
  const [chatUnread, setChatUnread] = useState(0);

  const changeTab = (key) => {
    const { tab: _tab, ...query } = router.query;

    router.replace(
      { pathname: router.pathname, query: key === "chat" ? { ...query, tab: "chat" } : query },
      undefined,
      { shallow: true }
    );
  };

  // Unread chat count (Messages tab badge)
  useEffect(() => {
    if (!profile) return;

    // Live from Firestore
    return subscribeChatUnread(setChatUnread);
  }, [profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProfile();

        if (response?.status) {
          setProfile(response?.data?.user);
        } else {
          setError(response?.message || "Unable to fetch profile.");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner
          size="lg"
          color="warning"
          labelColor="warning"
        />
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  /* ================= NO PROFILE ================= */

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-gray-600">
          Profile information not available.
        </div>
      </div>
    );
  }

  /* ================= PROFILE ================= */

  return (
    <div className="container mx-auto px-4 py-10">

      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#001737]">
          My Profile
        </h1>

        <p className="mt-2 text-[#62748E]">
          {tab === "chat"
            ? "Chat with admin, brokers and sellers."
            : "View your personal account information."}
        </p>
      </div>

      {/* Tabs: Profile / Messages */}
      <div className="mb-6 flex gap-2">
        {[
          ["profile", "Profile"],
          ["chat", "Messages"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => changeTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-[#E87722] text-white"
                : "border border-gray-200 bg-white text-[#62748E] hover:text-[#E87722]"
            }`}
          >
            {label}
            {key === "chat" && chatUnread > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${tab === key ? "bg-white text-[#E87722]" : "bg-[#E87722] text-white"}`}>
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <ChatBox embedded isCustomer={profile?.role === "customer"} />
      ) : (
      <>
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Profile Header */}
        <div className="bg-[#001737] px-6 py-8">
          <div className="flex items-center gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#E87722] flex items-center justify-center shrink-0">
              <span className="text-white text-3xl font-bold">
                {profile?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>

            {/* Name & Email */}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {profile?.name || "-"}
              </h2>

              <p className="text-gray-300 mt-1">
                {profile?.email || "-"}
              </p>
            </div>

          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">

          <h3 className="text-xl font-semibold text-[#001737] mb-6">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Full Name */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Full Name
              </p>

              <p className="text-base font-semibold text-[#1A1F36]">
                {profile?.name || "-"}
              </p>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Email Address
              </p>

              <p className="text-base font-semibold text-[#1A1F36]">
                {profile?.email || "-"}
              </p>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Phone Number
              </p>

              <p className="text-base font-semibold text-[#1A1F36]">
                {profile?.phone || "-"}
              </p>
            </div>

            {/* Role */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Role
              </p>

              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-[#E87722] text-sm font-semibold capitalize">
                {profile?.role || "-"}
              </span>
            </div>

            {/* Account Status */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Account Status
              </p>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                  profile?.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {profile?.status || "-"}
              </span>
            </div>

            {/* Email Verification */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Email Verification
              </p>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  profile?.is_verified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {profile?.is_verified
                  ? "Verified"
                  : "Not Verified"}
              </span>
            </div>

            {/* Terms Accepted */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Terms & Conditions
              </p>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  profile?.terms_accepted
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {profile?.terms_accepted
                  ? "Accepted"
                  : "Not Accepted"}
              </span>
            </div>

            {/* Member Since */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Member Since
              </p>

              <p className="text-base font-semibold text-[#1A1F36]">
                {profile?.created_at
                  ? new Date(
                      profile.created_at
                    ).toLocaleDateString()
                  : "-"}
              </p>
            </div>

          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
