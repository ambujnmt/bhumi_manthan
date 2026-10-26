"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getUserProfile } from "../../utils/fetchApi";

import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaRegCalendarCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaUserAlt,
  FaPen,
} from "react-icons/fa";
import { Link, Spinner } from "@heroui/react";

export default function Profile() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(id);
        setUser(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">User not found</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 py-10 px-8">

      {/* Profile Header Card */}
      <div className=" mx-auto bg-white rounded-2xl overflow-hidden shadow-md">

        {/* Banner */}
        <div className="h-36 bg-[rgb(232,119,34)] from-indigo-500 to-blue-500"></div>

        <div className="p-6 relative">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                alt="avatar"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl border-4 border-white shadow-lg">
                <FaUserAlt className="text-gray-500" />
              </div>
            )}
          </div>

          <div className="mt-10 ml-2">
            <div className="flex justify-start items-center space-x-3">

            <h1 className="text-2xl font-bold text-gray-900 capitalize !mb-0">
              {user.first_name} {user.last_name}
            </h1>

            <Link href={`/user/profile/updateProfile/${user?.id}`}>
            <FaPen/>
            </Link>
            </div>

            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
              {user.role}
            </span>

          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className=" mx-auto mt-6">

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaEnvelope className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaPhone className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">
                  {user.phone || "Not provided"}
                </p>
              </div>
            </div>



            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaMapMarkerAlt className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p className="text-gray-900">{user.state || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaUserAlt className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="text-gray-900">
                  {user.company_name || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaEnvelope className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="text-gray-900">
                  {user.website || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FaRegCalendarCheck className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {user.status === "active" ? (
                <FaCheckCircle className="text-green-600" />
              ) : (
                <FaTimesCircle className="text-red-600" />
              )}

              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="text-gray-900 capitalize">
                  {user.status}
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
