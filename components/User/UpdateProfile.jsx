"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getUserProfile } from "../../utils/fetchApi";
import { updateUser } from "../../utils/adminFetchApi";

import {
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaUserAlt,
    FaPen,
} from "react-icons/fa";
import { State } from "country-state-city";
import Select from "react-select";
import { Spinner } from "@heroui/react";

export default function UpdateProfile() {
    const router = useRouter();
    const { id } = router.query;
    const usStates = State.getStatesOfCountry("US").map((state) => ({
        label: state.name,
        value: state.name,
    }))
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState(null); // 👈 NEW

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        state: "",
        company_name: "",
        website: "",
        avatar: null,
    });

    const [preview, setPreview] = useState(null);

    // FETCH USER
    useEffect(() => {
        if (!id) return;

        const fetchProfile = async () => {
            try {
                const data = await getUserProfile(id);

                setForm({
                    first_name: data?.first_name || "",
                    last_name: data?.last_name || "",
                    email: data?.email || "",
                    phone: data?.phone || "",
                    state: data?.state || "",
                    company_name: data?.company_name || "",
                    website: data?.website || "",
                    avatar: null,
                });

                setPreview(data?.avatar || null);
            } catch (err) {
                setMessage({
                    type: "error",
                    text: "Failed to load profile",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setForm({ ...form, avatar: file });
        setPreview(URL.createObjectURL(file));
    };

    // SUBMIT UPDATE
 const handleSubmit = async () => {
    if (!id) return;

    setSaving(true);
    setMessage(null);

    try {
        const payload = new FormData();

        payload.append("first_name", form.first_name || "");
        payload.append("last_name", form.last_name || "");
        payload.append("email", form.email || "");
        payload.append("phone", form.phone || "");
        payload.append("state", form.state || "");
        payload.append("company_name", form.company_name || "");
        payload.append("website", form.website || "");

        if (form.avatar) {
            payload.append("avatar", form.avatar);
        }

        const res = await updateUser(id, payload);

        if (res?.status) {
            setMessage({
                type: "success",
                text: res?.message,
            });

            setTimeout(() => {
                router.push(`/user/profile/${id}`);
            }, 1200);
        } else {
            setMessage({
                type: "error",
                text: res?.message,
            });
        }

    } catch (err) {
        // 🔥 THIS is the important fix
        setMessage({
            type: "error",
            text: err?.message,
        });
    } finally {
        setSaving(false);
    }
};

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-8">

            {/* 👇 MESSAGE BANNER */}
            {message && (
                <div
                    className={`mx-auto mb-4 text-sm font-medium ${message.type === "success"
                            ? " text-green-700"
                            : " text-red-700"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* HEADER */}
            <div className="mx-auto bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="h-36 bg-[rgb(232,119,34)]"></div>

                <div className="p-6 relative">

                    {/* AVATAR */}
                    <div className="absolute -top-12 left-6">
                        {preview ? (
                            <img
                                src={preview}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                                <FaUserAlt className="text-gray-500 text-3xl" />
                            </div>
                        )}

                        <input
                            type="file"
                            className="mt-2 text-xs"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* NAME */}
               {/* NAME SECTION */}
<div className="mt-16  space-y-4">

  {/* First Name */}
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-600">
      First Name
    </label>
    <input
      name="first_name"
      value={form.first_name}
      onChange={handleChange}
      placeholder="First Name"
      className=" text-lg font-semibold text-center border-b border-gray-300 focus:border-blue-600 outline-none bg-transparent pb-1"
    />
  </div>

  {/* Last Name */}
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-600">
      Last Name
    </label>
    <input
      name="last_name"
      value={form.last_name}
      onChange={handleChange}
      placeholder="Last Name"
      className="text-lg font-semibold text-center border-b border-gray-300 focus:border-blue-600 outline-none bg-transparent pb-1"
    />
  </div>

</div>

                </div>
            </div>

            {/* FORM GRID */}
            <div className="mx-auto mt-6 bg-white rounded-2xl shadow p-6">

                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaPen /> Update Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                            Email
                        </label>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FaEnvelope className="text-blue-600" />
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">

                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FaPhone className="text-blue-600" />
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">

                        <label className="text-sm font-medium text-gray-600">State (USA)</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FaMapMarkerAlt className="text-blue-600" />

                            <div className="w-full">
                                <Select
                                    options={usStates}
                                    value={
                                        usStates.find((s) => s.value === form.state) || null
                                    }
                                    onChange={(selected) =>
                                        setForm({ ...form, state: selected?.value || "" })
                                    }
                                    placeholder="Select state"
                                    isSearchable={false}
                                    isClearable
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">

                        <label className="text-sm font-medium text-gray-600">Company Name</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FaUserAlt className="text-blue-600" />
                            <input
                                name="company_name"
                                value={form.company_name}
                                onChange={handleChange}
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">

                        <label className="text-sm font-medium text-gray-600">Website URL</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                            <input
                                name="website"
                                value={form.website}
                                onChange={handleChange}
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>

                </div>

                {/* BUTTON */}
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                    {saving ? "Updating..." : "Update Profile"}
                </button>

            </div>
        </div>
    );
}