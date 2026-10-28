
"use client";

import React, { useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";

import PageTitle from "../../../components/Breadcrumb/PageTitle";
import { addAdminEvent } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import { useAdminPermission } from "../../../utils/adminPermissions";

const initialForm = {
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    is_active: true,
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

export default function Add() {
    const router = useRouter();
    const can = useAdminPermission();
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    
const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
        setFormError("Please enter an event title.");
        return;
    }

    if (!form.location.trim()) {
        setFormError("Please enter the event location.");
        return;
    }

    if (!form.event_date) {
        setFormError("Please select the event date.");
        return;
    }

    if (!form.start_time || !form.end_time) {
        setFormError("Please select both start and end times.");
        return;
    }

    if (form.end_time <= form.start_time) {
        setFormError("End time must be later than start time.");
        return;
    }

    if (!image) {
        setFormError("Please select an event image.");
        return;
    }

    setSaving(true);

    try {
        const payload = new FormData();

        payload.append("title", form.title.trim());
        payload.append("description", form.description.trim());
        payload.append("event_date", form.event_date);
        payload.append("start_time", `${form.start_time}:00`);
        payload.append("end_time", `${form.end_time}:00`);
        payload.append("location", form.location.trim());
        payload.append("is_active", form.is_active ? "1" : "0");
        payload.append("image", image);

        const result = await addAdminEvent(payload);

        showToast(result?.message);

        router.push("/admin/event/listing");
    } catch (error) {
        console.error("Failed to add event:", error);

        setFormError(error?.message);
        showToast(error?.message, "error");
    } finally {
        setSaving(false);
    }
};


    if (!can("events.create")) {
        return (
            <div className="rounded-xl bg-white p-6 text-sm text-red-600 shadow">
                You do not have permission to create events.
            </div>
        );
    }

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Events", path: "/admin/event/listing" },
                    { label: "Add Event", active: true },
                ]}
                title="Add Event"
            />

            <div className="mt-6 mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[#1A1F36]">
                    Event Information
                </h2>


            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-xl bg-white p-5 shadow sm:p-6"
            >
                {formError && (
                    <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className={labelClass}>
                            Event Title <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Property Launch Event"
                            className={inputClass}
                            required
                            maxLength={255}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label htmlFor="location" className={labelClass}>
                            Location <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Noida Sector 150"
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label htmlFor="event_date" className={labelClass}>
                            Event Date <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="event_date"
                            name="event_date"
                            type="date"
                            value={form.event_date}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Start time */}
                    <div>
                        <label htmlFor="start_time" className={labelClass}>
                            Start Time <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="start_time"
                            name="start_time"
                            type="time"
                            value={form.start_time}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* End time */}
                    <div>
                        <label htmlFor="end_time" className={labelClass}>
                            End Time <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="end_time"
                            name="end_time"
                            type="time"
                            value={form.end_time}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center pt-6">
                        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) =>
                                    setForm((previous) => ({
                                        ...previous,
                                        is_active: event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 accent-[#E87722]"
                            />
                            Active Event
                        </label>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className={labelClass}>
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the event..."
                            rows={4}
                            className={inputClass}
                        />
                    </div>
                </div>
                

<div className="mt-5">
    <label
        htmlFor="event-image"
        className={labelClass}
    >
        Event Image <span className="text-red-500">*</span>
    </label>

    <input
        id="event-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
                setImage(null);
                setImagePreview("");
                return;
            }

            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                setImage(null);
                setImagePreview("");
                event.target.value = "";
                setFormError("Please select a JPG, PNG, or WEBP image.");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setImage(null);
                setImagePreview("");
                event.target.value = "";
                setFormError("Image size must be less than 5 MB.");
                return;
            }

            setFormError("");
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }}
        className={inputClass}
    />

    {imagePreview && (
        <img
            src={imagePreview}
            alt="Event preview"
            className="mt-3 h-40 w-full rounded-lg border border-gray-200 object-cover sm:w-72"
        />
    )}
</div>


                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                    <Link
                        href="/admin/events"
                        className="flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-[#E87722] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" color="white" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave size={16} />
                                Save Event
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
