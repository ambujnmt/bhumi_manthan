"use client";

import React, { useEffect, useRef, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { createProperty, geocodeAddress } from "@/utils/adminFetchApi";
import { FiPlus, FiX } from "react-icons/fi";
import RichTextEditor from "../../RichTextEditor/RichTextEditor";
import { showToast } from "../../../store/toast";
import { MAX_IMAGE_KB, pickImageFile } from "../../../utils/imageLimit";
import LocationFields from "./LocationFields";

const initialForm = {
    title: "",
    property_type: "Apartment",
    listing_type: "Sale",
    configuration: "",
    status: "Ready to Move",
    price: "",
    price_per_sqft: "",
    location: "",
    city: "",
    state: "",
    description: "",
    super_area: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    floor: "",
    total_floors: "",
    facing: "",
    furnishing: "",
    balconies: "",
    project: "",
    agent_name: "",
    agent_type: "Broker",
    agent_experience: "",
    agent_phone: "",
    agent_verified: true,
    is_featured: false,
    is_luxury: false,
    badge: "",
    latitude: "",
    longitude: "",
};

const initialImages = {
    main_image: null,
    floor_plan_image: null,
};

// Each "Add More" slot -> sent as gallery_images[]
const newImageSlot = () => ({ id: Date.now() + Math.random(), file: null });

// "More Images" shows 3 empty slots by default (each can be removed with X)
const DEFAULT_EXTRA_SLOTS = 3;
const defaultImageSlots = () => Array.from({ length: DEFAULT_EXTRA_SLOTS }, newImageSlot);

const fieldSections = [
    {
        title: "Basic Property Information",
        fields: [
            { name: "title", label: "Property Title", required: true, placeholder: "3 BHK Luxury Apartment" },
            {
                name: "property_type",
                label: "Property Type",
                type: "select",
                required: true,
                options: ["Apartment", "Villa", "House", "Plot", "Commercial"],
            },
            {
                name: "listing_type",
                label: "Listing Type",
                type: "select",
                required: true,
                options: ["Sale", "Rent", "Lease"],
            },
            { name: "configuration", label: "Configuration", placeholder: "3 BHK" },
            {
                name: "status",
                label: "Property Status",
                type: "select",
                options: ["Ready to Move", "Under Construction", "Upcoming"],
            },
            { name: "project", label: "Project Name", placeholder: "ABC Heights" },
            { name: "description", label: "Description", type: "textarea", full: true },
        ],
    },
    {
        title: "Pricing and Area",
        fields: [
            { name: "price", label: "Price (₹)", type: "number", required: true, placeholder: "8500000" },
            { name: "price_per_sqft", label: "Price per Sq. Ft. (₹)", type: "number", placeholder: "7500" },
            { name: "super_area", label: "Super Area (sq. ft.)", type: "number", placeholder: "1250" },
        ],
    },
    {
        title: "Property Details",
        fields: [
            { name: "bedrooms", label: "Bedrooms", type: "number" },
            { name: "bathrooms", label: "Bathrooms", type: "number" },
            { name: "balconies", label: "Balconies", type: "number" },
            { name: "parking", label: "Parking", placeholder: "1 Covered" },
            { name: "floor", label: "Floor Number", type: "number" },
            { name: "total_floors", label: "Total Floors", type: "number" },
            {
                name: "facing",
                label: "Facing",
                type: "select",
                options: ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"],
            },
            {
                name: "furnishing",
                label: "Furnishing",
                type: "select",
                options: ["Furnished", "Semi Furnished", "Unfurnished"],
            },
        ],
    },
    {
        title: "Location Details",
        // State -> City -> Locality / Sector rendered by <LocationFields />
        fields: [],
    },
    {
        title: "Agent Details",
        fields: [
            { name: "agent_name", label: "Agent Name", placeholder: "Rahul Sharma" },
            {
                name: "agent_type",
                label: "Agent Type",
                type: "select",
                options: ["Broker", "Owner", "Builder", "Agent"],
            },
            { name: "agent_experience", label: "Experience", placeholder: "8 Years" },
            { name: "agent_phone", label: "Agent Phone", type: "tel", placeholder: "9876543210" },
        ],
    },
];

const otherImageFields = [
    { name: "floor_plan_image", label: "Floor Plan Image" },
];

const fileInputClass =
    "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// Preview of selected file (same style as Update page); URL freed on change / unmount
const FilePreview = ({ file, alt, className = "h-32", onRemove }) => {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!file) {
            setUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;

    return (
        <div className="relative mt-1.5">
            <img
                src={url}
                alt={alt}
                className={`${className} w-full rounded-lg border border-gray-200 object-cover`}
            />

            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
                    aria-label={`Remove ${alt}`}
                    title={`Remove ${alt}`}
                >
                    <FiX size={14} />
                </button>
            )}
        </div>
    );
};

export default function Create() {
    const [form, setForm] = useState(initialForm);
    const [images, setImages] = useState(initialImages);
    const [extraImages, setExtraImages] = useState(defaultImageSlots);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [geoStatus, setGeoStatus] = useState(""); // "", loading, found, error
const formRef = useRef(null);

    // Auto latitude/longitude from address (debounced)
    useEffect(() => {
        const { location, city, state } = form;

        if (!city.trim()) {
            setGeoStatus("");
            setForm((previous) => ({ ...previous, latitude: "", longitude: "" }));
            return;
        }

        setGeoStatus("loading");

        const timer = setTimeout(async () => {
            try {
                const res = await geocodeAddress({ location, city, state });

                setForm((previous) => ({
                    ...previous,
                    latitude: res?.data?.latitude ?? "",
                    longitude: res?.data?.longitude ?? "",
                }));
                setGeoStatus("found");
            } catch (error) {
                setForm((previous) => ({ ...previous, latitude: "", longitude: "" }));
                setGeoStatus("error");
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [form.location, form.city, form.state]);

    // Add More Images
    const addImageSlot = () => {
        setExtraImages((previous) => [...previous, newImageSlot()]);
    };

    const removeImageSlot = (id) => {
        setExtraImages((previous) => previous.filter((slot) => slot.id !== id));
    };

    const handleExtraImageChange = (id, file) => {
        setExtraImages((previous) =>
            previous.map((slot) => (slot.id === id ? { ...slot, file } : slot))
        );
    };
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleImageChange = (event) => {
        const { name } = event.target;
        const file = pickImageFile(event); // null if > 200 KB

        setImages((previous) => ({
            ...previous,
            [name]: file,
        }));
    };

    // Remove selected image (preview X) + clear file input
    const removeImage = (name) => {
        setImages((previous) => ({ ...previous, [name]: null }));

        const input = document.getElementById(name);
        if (input) {
            input.value = "";
        }
    };

 const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
        // Create FormData for the API request
        const formData = new FormData();

        // Add all property form fields
Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
        if (typeof value === "boolean") {
            // Laravel boolean validation accepts "1" or "0"
            formData.append(key, value ? "1" : "0");
        } else {
            formData.append(key, value);
        }
    }
});
        // Add selected single images
        Object.entries(images).forEach(([key, file]) => {
            if (file) {
                formData.append(key, file);
            }
        });

        // Add more images -> gallery_images[]
        extraImages.forEach((slot) => {
            if (slot.file) {
                formData.append("gallery_images[]", slot.file);
            }
        });

        // Call the create property API
        const response = await createProperty(formData);

        // Display success toast
        showToast(response?.message || "Property created successfully.");

        // Reset React form state
        setForm({ ...initialForm });
        setImages({ ...initialImages });
        setExtraImages(defaultImageSlots());

        // Safely reset native form inputs and file inputs
        if (formRef.current) {
            formRef.current.reset();
        }

    } catch (error) {
        console.error("Create property error:", error);

        setMessage(
            error?.message || "Failed to create property."
        );
        setMessageType("error");

        showToast(error?.message || "Failed to create property.", "error");

    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen">
            <PageTitle
                breadCrumbItems={[
                    {
                        label: "Dashboard",
                        path: "/admin/dashboard",
                    },
                    {
                        label: "Property",
                        active: true,
                    },
                ]}
                title="Property Management"
            />

            <div className="mx-auto mt-4 w-full  ">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          

                    {message && (
                        <div
                            role={messageType === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`mx-5 mt-5 rounded-lg border px-4 py-3 text-sm sm:mx-7 ${
                                messageType === "success"
                                    ? " text-green-800"
                                    : " text-red-700"
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <span className="font-bold">
                                    {messageType === "success" ? "✓" : "!"}
                                </span>
                                <p>{message}</p>
                            </div>
                        </div>
                    )}

                    <form  ref={formRef} onSubmit={handleSubmit} className="p-5 sm:p-7">
                        {fieldSections.map((section) => (
                            <section
                                key={section.title}
                                className="mb-8"
                            >
                                <h3 className="mb-5 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                                    {section.title}
                                </h3>

                                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {section.title === "Location Details" && (
                                        <LocationFields
                                            values={form}
                                            onChange={(patch) =>
                                                setForm((previous) => ({ ...previous, ...patch }))
                                            }
                                            inputClass={inputClass}
                                            labelClass={labelClass}
                                        />
                                    )}

                                    {section.fields.map((field) => (
                                        <div
                                            key={field.name}
                                            className={
                                                field.full
                                                    ? "sm:col-span-2 lg:col-span-3"
                                                    : ""
                                            }
                                        >
                                            <label
                                                htmlFor={field.name}
                                                className={labelClass}
                                            >
                                                {field.label}
                                                {field.required && (
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                )}
                                            </label>

                                            {field.type === "textarea" ? (
                                                <div className="mt-1.5">
                                                    <RichTextEditor
                                                        value={form[field.name]}
                                                        onChange={(html) =>
                                                            setForm((previous) => ({
                                                                ...previous,
                                                                [field.name]: html,
                                                            }))
                                                        }
                                                        placeholder="Enter property description"
                                                    />
                                                </div>
                                            ) : field.type === "select" ? (
                                                <select
                                                    id={field.name}
                                                    name={field.name}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    required={field.required}
                                                    className={inputClass}
                                                >
                                                    <option value="">
                                                        Select {field.label}
                                                    </option>

                                                    {field.options.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            ) : (
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type={field.type || "text"}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    required={field.required}
                                                    step={field.step}
                                                    min={
                                                        field.type === "number"
                                                            ? "0"
                                                            : undefined
                                                    }
                                                    placeholder={
                                                        field.placeholder || ""
                                                    }
                                                    className={inputClass}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {section.title === "Location Details" && (
                                    <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {["latitude", "longitude"].map((name) => (
                                            <div key={name}>
                                                <label htmlFor={name} className={labelClass}>
                                                    {name === "latitude" ? "Latitude" : "Longitude"}
                                                    <span className="ml-1 text-xs font-normal text-[#62748E]">
                                                        (auto from address)
                                                    </span>
                                                </label>
                                                <input
                                                    id={name}
                                                    type="text"
                                                    value={form[name]}
                                                    readOnly
                                                    placeholder={
                                                        geoStatus === "loading"
                                                            ? "Finding location..."
                                                            : "Enter city to auto-fill"
                                                    }
                                                    className={`${inputClass} cursor-not-allowed bg-gray-50`}
                                                />
                                            </div>
                                        ))}

                                        <div className="flex items-end pb-2.5 text-xs">
                                            {geoStatus === "loading" && (
                                                <span className="text-[#62748E]">Finding location...</span>
                                            )}
                                            {geoStatus === "found" && (
                                                <span className="text-green-700">✓ Location found</span>
                                            )}
                                            {geoStatus === "error" && (
                                                <span className="text-red-600">
                                                    Location not found. Check locality / city / state.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {section.title === "Agent Details" && (
                                    <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                        <input
                                            type="checkbox"
                                            checked={form.agent_verified}
                                            onChange={(event) =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    agent_verified:
                                                        event.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4 accent-[#E87722]"
                                        />
                                        Agent is verified
                                    </label>
                                )}
                            </section>
                        ))}

                        {/* Homepage Display */}
                        <section className="mb-8">
                            <h3 className="mb-2 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                                Homepage Display
                            </h3>

                            <p className="mb-5 text-sm text-[#62748E]">
                                Show this property in homepage sections (website and mobile app, nearest first).
                            </p>

                            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                    <input
                                        type="checkbox"
                                        checked={form.is_featured}
                                        onChange={(event) =>
                                            setForm((previous) => ({ ...previous, is_featured: event.target.checked }))
                                        }
                                        className="h-4 w-4 accent-[#E87722]"
                                    />
                                    Featured Properties
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                    <input
                                        type="checkbox"
                                        checked={form.is_luxury}
                                        onChange={(event) =>
                                            setForm((previous) => ({ ...previous, is_luxury: event.target.checked }))
                                        }
                                        className="h-4 w-4 accent-[#E87722]"
                                    />
                                    Premium Luxury Listings
                                </label>

                                <div>
                                    <label htmlFor="badge" className={labelClass}>Card Badge</label>
                                    <select
                                        id="badge"
                                        name="badge"
                                        value={form.badge}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        <option value="">Auto</option>
                                        {["FEATURED", "PREMIUM", "NEW", "ULTRA LUXURY"].map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h3 className="mb-2 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                                Property Images
                            </h3>

                            <p className="mb-5 text-sm text-[#62748E]">
                                Upload JPG, PNG or WEBP images, max{" "}
                                <span className="font-semibold text-[#001737]">{MAX_IMAGE_KB} KB</span>{" "}
                                each. The main image is required.
                            </p>

                            {/* Main Image */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label htmlFor="main_image" className={labelClass}>
                                        Main Property Image
                                        <span className="ml-1 text-red-500">*</span>
                                    </label>

                                    <FilePreview
                                        file={images.main_image}
                                        alt="Main Property Image"
                                        onRemove={() => removeImage("main_image")}
                                    />

                                    <input
                                        id="main_image"
                                        name="main_image"
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={handleImageChange}
                                        className={fileInputClass}
                                    />

                                    {images.main_image && (
                                        <p className="mt-1.5 truncate text-xs text-green-700">
                                            Selected: {images.main_image.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Add More Images */}
                            <div className="mt-6">
                                <label className={labelClass}>More Images</label>

                                {extraImages.length > 0 && (
                                    <div className="mt-1.5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {extraImages.map((slot, index) => (
                                            <div key={slot.id}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-[#62748E]">
                                                        Image {index + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImageSlot(slot.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        aria-label={`Remove image ${index + 1}`}
                                                    >
                                                        <FiX size={16} />
                                                    </button>
                                                </div>

                                                <FilePreview
                                                    file={slot.file}
                                                    alt={`Image ${index + 1}`}
                                                    className="h-28"
                                                />

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) =>
                                                        handleExtraImageChange(
                                                            slot.id,
                                                            pickImageFile(event)
                                                        )
                                                    }
                                                    className={fileInputClass}
                                                />

                                                {slot.file && (
                                                    <p className="mt-1.5 truncate text-xs text-green-700">
                                                        Selected: {slot.file.name}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addImageSlot}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-[#E87722] px-4 py-2 text-sm font-semibold text-[#E87722] transition hover:bg-orange-50"
                                >
                                    <FiPlus size={16} />
                                    Add More Image
                                </button>
                            </div>

                            {/* Floor Plan Image */}
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {otherImageFields.map((imageField) => (
                                    <div key={imageField.name}>
                                        <label
                                            htmlFor={imageField.name}
                                            className={labelClass}
                                        >
                                            {imageField.label}
                                        </label>

                                        <FilePreview
                                            file={images[imageField.name]}
                                            alt={imageField.label}
                                            onRemove={() => removeImage(imageField.name)}
                                        />

                                        <input
                                            id={imageField.name}
                                            name={imageField.name}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={fileInputClass}
                                        />

                                        {images[imageField.name] && (
                                            <p className="mt-1.5 truncate text-xs text-green-700">
                                                Selected:{" "}
                                                {images[imageField.name].name}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setForm({ ...initialForm });
                                    setImages({ ...initialImages });
                                    setExtraImages(defaultImageSlots());
                                    setMessage("");
                                    setMessageType("");

                                    const fileInputs =
                                        document.querySelectorAll(
                                            'input[type="file"]'
                                        );

                                    fileInputs.forEach((input) => {
                                        input.value = "";
                                    });
                                }}
                                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear Form
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex min-w-[175px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="h-5 w-5 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                className="opacity-25"
                                            />
                                            <path
                                                d="M21 12a9 9 0 0 0-9-9"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                className="opacity-90"
                                            />
                                        </svg>
                                        Creating Property...
                                    </>
                                ) : (
                                    "Create Property"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
