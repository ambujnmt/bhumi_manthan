
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaImage,
} from "react-icons/fa";

import PageTitle from "../../../components/Breadcrumb/PageTitle";
import {
    getAdminEventById,
    updateAdminEvent,
} from "../../../utils/fetchApi";

export default function Update() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [currentImage, setCurrentImage] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [imageFile, setImageFile] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        location: "",
        is_active: "1",
    });

    const fetchEvent = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError("");

        try {
            const result = await getAdminEventById(id);
            const event = result?.data;

            if (!event) {
                throw new Error("Event details not found.");
            }

            setFormData({
                title: event.title || "",
                description: event.description || "",
                event_date: event.event_date
                    ? event.event_date.slice(0, 10)
                    : "",
                start_time: event.start_time
                    ? event.start_time.slice(0, 5)
                    : "",
                end_time: event.end_time
                    ? event.end_time.slice(0, 5)
                    : "",
                location: event.location || "",
                is_active: event.is_active ? "1" : "0",
            });

            setCurrentImage(event.image || "");
            setImagePreview("");
            setImageFile(null);
        } catch (err) {
            setError(err?.message || "Unable to fetch event details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (router.isReady && id) {
            fetchEvent();
        }
    }, [router.isReady, id, fetchEvent]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (formData.end_time <= formData.start_time) {
            setError("End time must be later than start time.");
            return;
        }

        const data = new FormData();

        data.append("title", formData.title.trim());
        data.append("description", formData.description.trim());
        data.append("event_date", formData.event_date);
        data.append(
            "start_time",
            formData.start_time.length === 5
                ? `${formData.start_time}:00`
                : formData.start_time
        );

        data.append(
            "end_time",
            formData.end_time.length === 5
                ? `${formData.end_time}:00`
                : formData.end_time
        );
        data.append("location", formData.location.trim());
        data.append("is_active", formData.is_active);

        // Send an image only if the user selected a new one.
        if (imageFile) {
            data.append("image", imageFile);
        }

        setSubmitting(true);

        try {
            const result = await updateAdminEvent(id, data);

            setSuccess(result?.message);

            // Refresh the event data after saving.
            await fetchEvent();

            // Return to the events list after a successful update.
            router.push("/admin/event/listing");
        } catch (err) {
            setError(err?.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-5">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Events", path: "/admin/event/listing" },
                    { label: "Update Event", active: true },
                ]}
                title="Update Event"
            />

    

            {loading ? (
                <div className="flex min-h-48 items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white">
                    <Spinner size="md" color="warning" />
                    <span className="text-sm text-gray-500">
                        Loading event details...
                    </span>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                >
                    {error && (
                        <div className="mb-4  text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4  text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E87722]"
                                placeholder="Enter event title"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Location *
                            </label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E87722]"
                                    placeholder="Enter event location"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Event Date *
                            </label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    name="event_date"
                                    value={formData.event_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E87722]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Status *
                            </label>
                            <select
                                name="is_active"
                                value={formData.is_active}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E87722]"
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Start Time *
                            </label>
                            <div className="relative">
                                <FaClock className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E87722]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                End Time *
                            </label>
                            <div className="relative">
                                <FaClock className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E87722]"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E87722]"
                                placeholder="Enter event description"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Event Image
                            </label>

                            {imagePreview || currentImage ? (
                                <img
                                    src={imagePreview || currentImage}
                                    alt="Event preview"
                                    className="mb-3 h-32 w-48 rounded-md border border-gray-200 object-cover"
                                />
                            ) : null}

                            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <FaImage />
                                Choose New Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                                Leave unchanged to keep the current image.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/events")}
                            disabled={submitting}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-md bg-[#E87722] px-5 py-2 text-sm font-medium text-white hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Updating..." : "Update Event"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
