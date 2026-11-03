"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { getProfile } from "../../../utils/fetchApi";
import { subscribeChatUnread } from "../../../utils/firebaseChat";
import { clearPostLoginRedirect } from "../../../utils/postLoginRedirect";
import { FiAward, FiCalendar, FiCheckCircle, FiFileText, FiMail, FiPhone, FiShield, FiUser } from "react-icons/fi";
import ChatBox from "../../Admin/Chat/ChatBox";

const PILL_TONES = {
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-600",
  muted: "bg-gray-100 text-gray-600",
  brand: "bg-[#FFECD3] text-[var(--primary-color)]",
};

const Pill = ({ tone, children }) => (
  <span className={`inline-flex items-center rounded-full px-[10px] py-[3px] text-xs font-semibold capitalize ${PILL_TONES[tone]}`}>
    {children}
  </span>
);

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-[10px] transition-colors hover:bg-gray-50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-[#62748E]">{label}</div>
        <div className="break-words text-sm font-semibold text-[var(--secondary-color)]">{children}</div>
      </div>
    </div>
  );
}

function ProfileDetails({ profile }) {
  const role = profile.role === "super_admin" ? "Admin" : (profile.role || "-").replace(/_/g, " ");
  const isActive = profile.status === "active";
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";

  return (
    <div className="space-y-[20px]">
      {/* Identity */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-[96px] bg-gradient-to-r from-[var(--secondary-color)] to-[var(--primary-color)]" />
        <div className="flex flex-col gap-[12px] px-[20px] pb-[20px] sm:flex-row sm:items-end sm:gap-[20px] sm:px-[24px]">
          <span className="-mt-[44px] flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-[var(--primary-color)] text-[36px] font-bold text-white shadow-md" aria-hidden="true">
            {profile.name?.trim().charAt(0).toUpperCase() || "U"}
          </span>
          <div className="min-w-0 flex-1 sm:pt-[12px]">
            <h2 className="mb-[2px] break-words text-xl font-bold text-[var(--secondary-color)]">{profile.name || "-"}</h2>
            <div className="break-words text-sm text-[#62748E]">{profile.email || "-"}</div>
          </div>
          <div className="flex flex-wrap gap-2 sm:pb-[4px]">
            <Pill tone="brand">{role}</Pill>
            <Pill tone={isActive ? "good" : "bad"}>{profile.status || "-"}</Pill>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-2">
        {/* Personal details */}
        <section className="rounded-2xl border border-gray-100 bg-white p-[16px] shadow-sm sm:p-[20px]">
          <h3 className="mb-[12px] px-[10px] text-base font-bold text-[var(--secondary-color)]">Personal Information</h3>
          <div className="space-y-[4px]">
            <InfoRow icon={FiUser} label="Full Name">{profile.name || "-"}</InfoRow>
            <InfoRow icon={FiMail} label="Email Address">{profile.email || "-"}</InfoRow>
            <InfoRow icon={FiPhone} label="Phone Number">{profile.phone || "-"}</InfoRow>
            <InfoRow icon={FiCalendar} label="Member Since">{memberSince}</InfoRow>
          </div>
        </section>

        {/* Account state */}
        <section className="rounded-2xl border border-gray-100 bg-white p-[16px] shadow-sm sm:p-[20px]">
          <h3 className="mb-[12px] px-[10px] text-base font-bold text-[var(--secondary-color)]">Account Details</h3>
          <div className="space-y-[4px]">
            <InfoRow icon={FiAward} label="Role"><Pill tone="brand">{role}</Pill></InfoRow>
            <InfoRow icon={FiShield} label="Account Status">
              <Pill tone={isActive ? "good" : "bad"}>{profile.status || "-"}</Pill>
            </InfoRow>
            <InfoRow icon={FiCheckCircle} label="Email Verification">
              <Pill tone={profile.is_verified ? "good" : "warn"}>{profile.is_verified ? "Verified" : "Not Verified"}</Pill>
            </InfoRow>
            <InfoRow icon={FiFileText} label="Terms & Conditions">
              <Pill tone={profile.terms_accepted ? "good" : "muted"}>{profile.terms_accepted ? "Accepted" : "Not Accepted"}</Pill>
            </InfoRow>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Profile({ dashboard = false }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ?tab=chat opens Messages directly
  const router = useRouter();
  const tab = router.query.tab === "chat" ? "chat" : "profile";
  const [chatUnread, setChatUnread] = useState(0);

  // ?tab=chat&property=slug (Contact Seller) opens the chat with that property's owner
  const startPropertyId = tab === "chat" ? router.query.property : undefined;

  const handlePropertyChatDone = () => {
    const { property: _property, ...query } = router.query;

    clearPostLoginRedirect();
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

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
    <div className={dashboard ? (tab === "chat" ? "h-full" : "") : "container mx-auto px-4 py-10"}>

      {/* Page Heading */}
      {/* Dashboard: the sidebar already says which page this is */}
      {!dashboard && (
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
      )}

      {/* Tabs: Profile / Messages */}
      {!dashboard && <div className="mb-6 flex gap-2">
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
      </div>}

      {tab === "chat" ? (
        <ChatBox
          embedded
          fill={dashboard}
          isCustomer={profile?.role === "customer"}
          startPropertyId={startPropertyId}
          onPropertyChatDone={handlePropertyChatDone}
        />
      ) : (
      <ProfileDetails profile={profile} />
      )}
    </div>
  );
}
