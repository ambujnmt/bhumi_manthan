"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { getProfile } from "../../../utils/fetchApi";
import { useUser } from "../../../context/UserContext";
import ProfilePhotoEditor from "../../Common/ProfilePhotoEditor";
import BusinessDetailsCard from "../../Common/BusinessDetailsCard";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: loggedInUser, updateUser } = useUser();

  // New photo / saved details: page + logged in user (header) update at once
  const handlePhotoUpdated = (user) => {
    if (!user) return;
    setProfile(user);
    updateUser({ ...(loggedInUser || {}), ...user });
  };

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-gray-600">
          Profile information not available.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#001737]">
          My Profile
        </h1>

        <p className="mt-2 text-[#62748E]">
          View your personal account information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-[#001737] px-6 py-8">
          <div className="flex items-center gap-5">

            {/* Avatar: photo (or first letter) + camera button to change it -> header too */}
            <ProfilePhotoEditor
              profile={profile}
              onProfileUpdated={handlePhotoUpdated}
              avatarClassName="h-20 w-20 bg-[#E87722] text-3xl text-white"
              removeClassName="text-white/70 hover:text-white"
            />

            <div>
              <h2 className="text-2xl font-bold text-white">
                {profile?.name}
              </h2>

              <p className="text-gray-300 mt-1">
                {profile?.email}
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

            {/* Name */}
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
                {profile?.is_verified ? "Verified" : "Not Verified"}
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
                {profile?.terms_accepted ? "Accepted" : "Not Accepted"}
              </span>
            </div>

            {/* Member Since */}
            <div>
              <p className="text-sm text-[#62748E] mb-1">
                Member Since
              </p>

              <p className="text-base font-semibold text-[#1A1F36]">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "-"}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Address + agency + RERA (edit here) */}
      <BusinessDetailsCard profile={profile} onSaved={handlePhotoUpdated} className="mt-6" />
    </div>
  );
}
