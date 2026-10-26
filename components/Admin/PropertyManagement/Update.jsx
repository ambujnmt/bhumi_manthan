"use client";

import React, { useEffect, useRef, useState } from "react";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import RichTextEditor from "../../RichTextEditor/RichTextEditor";
import { showToast } from "../../../store/toast";
import { MAX_IMAGE_KB, pickImageFile } from "../../../utils/imageLimit";
import { geocodeAddress, getPropertyDetail, updateProperty } from "../../../utils/adminFetchApi";
import LocationFields from "./LocationFields";

const initialForm = {
    title: "",
    property_type: "",
    listing_type: "",
    configuration: "",
    status: "",
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
    age_of_property: "",
    ownership: "",
    balconies: "",
    project: "",
    agent_name: "",
    agent_type: "",
    agent_experience: "",
    agent_phone: "",
    agent_verified: false,
    is_featured: false,
    is_luxury: false,
    badge: "",
    latitude: "",
    longitude: "",
    rapid_metro_distance: "",
    school_distance: "",
    hospital_distance: "",
};

const initialImages = {
    main_image: null,
    image_2: null,
    image_3: null,
    floor_plan_image: null,
    agent_image: null,
};

const initialPreviews = {
    main_image: "",
    image_2: "",
    image_3: "",
    floor_plan_image: "",
    agent_image: "",
};

// Each "Add More" slot -> sent as gallery_images[]
const newImageSlot = () => ({ id: Date.now() + Math.random(), file: null });

// Same sections as Create page (+ fields that only exist on saved properties)
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
            { name: "age_of_property", label: "Age of Property", placeholder: "1-3 Years" },
            { name: "ownership", label: "Ownership", placeholder: "Freehold" },
        ],
    },
    {
        title: "Location Details",
        // State -> City -> Locality / Sector rendered by <LocationFields />
        fields: [
            { name: "rapid_metro_distance", label: "Rapid Metro Distance", placeholder: "1.2 km" },
            { name: "school_distance", label: "School Distance", placeholder: "500 m" },
            { name: "hospital_distance", label: "Hospital Distance", placeholder: "2 km" },
        ],
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

const fileInputClass =
    "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-[#62748E] file:mr-3 file:border-0 file:bg-[#001737] file:px-3 file:py-2.5 file:text-white hover:file:bg-[#E87722]";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const sectionTitleClass =
    "mb-5 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]";

// Keep a saved value selectable even if it is not in the default options
const withCurrentOption = (options, value) =>
    value && !options.includes(value) ? [value, ...options] : options;

const breadCrumbItems = [
    {
        label: "Dashboard",
        path: "/admin/dashboard",
    },
    {
        label: "Property",
        path: "/admin/propertyManagement/propertyList",
    },
    {
        label: "Update",
        active: true,
    },
];

/* =========================================================
   IMAGE FIELD (current image + file input, Create page style)
========================================================= */

const ImageField = ({ label, name, preview, selectedFile, onChange, onRemove }) => (
    <div>
        <label htmlFor={name} className={labelClass}>
            {label}
        </label>

        {preview && (
            <div className="relative mt-1.5">
                <img
                    src={preview}
                    alt={label}
                    className="h-32 w-full rounded-lg border border-gray-200 object-cover"
                />

                {onRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(name)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
                        aria-label={`Remove ${label}`}
                        title={`Remove ${label}`}
                    >
                        <FiX size={14} />
                    </button>
                )}
            </div>
        )}

        <input
            id={name}
            name={name}
            type="file"
            accept="image/*"
            onChange={onChange}
            className={fileInputClass}
        />

        {selectedFile && (
            <p className="mt-1.5 truncate text-xs text-green-700">
                Selected: {selectedFile.name}
            </p>
        )}
    </div>
);

export default function Update() {
    const router = useRouter();

    const [property, setProperty] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [images, setImages] = useState(initialImages);
    const [imagePreviews, setImagePreviews] = useState(initialPreviews);

    // Already saved gallery image URLs (kept unless removed)
    const [existingGallery, setExistingGallery] = useState([]);

    // New "Add More" image slots
    const [extraImages, setExtraImages] = useState([]);

    // Saved single images marked for removal (sent as remove_images[])
    const [removedImages, setRemovedImages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [geoStatus, setGeoStatus] = useState(""); // "", loading, found, error

    // Saved address -> lat/long is recalculated only when address changes
    const savedAddressRef = useRef("");
    const formRef = useRef(null);

    /* =======================================================
       FILL FORM FROM PROPERTY
    ======================================================= */

    const fillFromProperty = (data) => {
        setProperty(data);

        setForm(
            Object.keys(initialForm).reduce((values, key) => {
                if (["agent_verified", "is_featured", "is_luxury"].includes(key)) {
                    values[key] = !!data[key];
                } else {
                    values[key] = data[key] ?? "";
                }

                return values;
            }, {})
        );

        setImagePreviews(
            Object.keys(initialPreviews).reduce((values, key) => {
                values[key] = data[key] ?? "";
                return values;
            }, {})
        );

        setImages({ ...initialImages });
        setExistingGallery(Array.isArray(data.gallery_images) ? data.gallery_images : []);
        setExtraImages([]);
        setRemovedImages([]);
        setGeoStatus("");

        savedAddressRef.current = [
            data.location ?? "",
            data.city ?? "",
            data.state ?? "",
        ].join("|");

        // Clear native file inputs
        formRef.current
            ?.querySelectorAll('input[type="file"]')
            .forEach((input) => {
                input.value = "";
            });
    };

    /* =======================================================
       FETCH PROPERTY
    ======================================================= */

    useEffect(() => {
        if (!router.isReady || !router.query.id) {
            return;
        }

        const fetchProperty = async () => {
            setLoading(true);
            setLoadError("");

            try {
                const res = await getPropertyDetail(router.query.id);

                if (res?.status && res?.data?.property) {
                    fillFromProperty(res.data.property);
                } else {
                    setLoadError("Property details could not be loaded.");
                }
            } catch (error) {
                setLoadError(error?.message || "Failed to fetch property details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [router.isReady, router.query.id]);

    /* =======================================================
       AUTO LATITUDE / LONGITUDE (DEBOUNCED)
       Runs only when location / city / state is changed.
    ======================================================= */

    useEffect(() => {
        if (loading || !property) {
            return;
        }

        const { location, city, state } = form;
        const address = [location, city, state].join("|");

        if (address === savedAddressRef.current) {
            setGeoStatus("");
            return;
        }

        if (!String(city).trim()) {
            setGeoStatus("error");
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
                // Empty -> backend tries again while saving
                setForm((previous) => ({ ...previous, latitude: "", longitude: "" }));
                setGeoStatus("error");
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [form.location, form.city, form.state, loading, property]);

    /* =======================================================
       ADD MORE IMAGES
    ======================================================= */

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

    const removeExistingImage = (url) => {
        setExistingGallery((previous) => previous.filter((image) => image !== url));
    };

    /* =======================================================
       HANDLE CHANGE
    ======================================================= */

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

        if (file) {
            setImagePreviews((previous) => ({
                ...previous,
                [name]: URL.createObjectURL(file),
            }));

            // New image replaces the old one -> no longer "removed"
            setRemovedImages((previous) => previous.filter((field) => field !== name));
        }
    };

    // Remove a single image (not main image)
    const removeImage = (name) => {
        setImages((previous) => ({ ...previous, [name]: null }));
        setImagePreviews((previous) => ({ ...previous, [name]: "" }));
        setRemovedImages((previous) =>
            previous.includes(name) ? previous : [...previous, name]
        );

        const input = document.getElementById(name);
        if (input) {
            input.value = "";
        }
    };

    /* =======================================================
       HANDLE UPDATE
    ======================================================= */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!router.query.id) {
            return;
        }

        setUpdateLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const formData = new FormData();

            // Add all property form fields
            Object.entries(form).forEach(([key, value]) => {
                if (typeof value === "boolean") {
                    // Laravel boolean validation accepts "1" or "0"
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, value ?? "");
                }
            });

            // Add selected single images
            Object.entries(images).forEach(([key, file]) => {
                if (file) {
                    formData.append(key, file);
                }
            });

            // Removed single images
            removedImages.forEach((field) => {
                formData.append("remove_images[]", field);
            });

            // Gallery: keep existing + add new
            formData.append("gallery_sync", "1");

            existingGallery.forEach((url) => {
                formData.append("existing_gallery_images[]", url);
            });

            extraImages.forEach((slot) => {
                if (slot.file) {
                    formData.append("gallery_images[]", slot.file);
                }
            });

            const response = await updateProperty(router.query.id, formData);

            showToast(response?.message || "Property updated successfully.");

            if (response?.data?.property) {
                fillFromProperty(response.data.property);
            }
        } catch (error) {
            console.error("Update property error:", error);

            setMessage(error?.message || "Failed to update property.");
            setMessageType("error");

            showToast(error?.message || "Failed to update property.", "error");
        } finally {
            setUpdateLoading(false);
        }
    };

    /* =======================================================
       LOADING / ERROR
    ======================================================= */

    if (loading || (loadError && !property)) {
        return (
            <div className="min-h-screen">
                <PageTitle breadCrumbItems={breadCrumbItems} title="Property Management" />

                <div className="mx-auto mt-4 w-full">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {loading ? (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div
                                role="alert"
                                className="m-5 rounded-lg border px-4 py-3 text-sm text-red-700 sm:m-7"
                            >
                                <div className="flex items-start gap-2">
                                    <span className="font-bold">!</span>
                                    <p>{loadError}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =======================================================
       PAGE
    ======================================================= */

    return (
        <div className="min-h-screen">
            <PageTitle breadCrumbItems={breadCrumbItems} title="Property Management" />

            <div className="mx-auto mt-4 w-full">
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

                    <form ref={formRef} onSubmit={handleSubmit} className="p-5 sm:p-7">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-[#62748E]">
                                {property?.property_id && (
                                    <>
                                        Property ID:{" "}
                                        <span className="font-semibold text-[#001737]">
                                            {property.property_id}
                                        </span>
                                    </>
                                )}
                            </p>

                            <button
                                type="button"
                                onClick={() => router.push("/admin/propertyManagement/propertyList")}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-[#001737] transition hover:border-[#E87722] hover:text-[#E87722]"
                            >
                                <FiArrowLeft size={16} />
                                Back
                            </button>
                        </div>

                        {fieldSections.map((section) => (
                            <section
                                key={section.title}
                                className="mb-8"
                            >
                                <h3 className={sectionTitleClass}>
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

                                                    {withCurrentOption(
                                                        field.options,
                                                        form[field.name]
                                                    ).map((option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type={field.type || "text"}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    required={field.required}
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
                                                <span className="text-green-700">✓ Location updated from address</span>
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
                                        {withCurrentOption(
                                            ["FEATURED", "PREMIUM", "NEW", "ULTRA LUXURY"],
                                            form.badge
                                        ).map((option) => (
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
                                Choose a new image only if you want to replace the current one.
                                JPG, PNG or WEBP, max{" "}
                                <span className="font-semibold text-[#001737]">{MAX_IMAGE_KB} KB</span>{" "}
                                each.
                            </p>

                            {/* Main Image (+ old properties: Image 2 / Image 3) */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <ImageField
                                    label="Main Property Image"
                                    name="main_image"
                                    preview={imagePreviews.main_image}
                                    selectedFile={images.main_image}
                                    onChange={handleImageChange}
                                />

                                {imagePreviews.image_2 && (
                                    <ImageField
                                        label="Image 2"
                                        name="image_2"
                                        preview={imagePreviews.image_2}
                                        selectedFile={images.image_2}
                                        onChange={handleImageChange}
                                    onRemove={removeImage}
                                    />
                                )}

                                {imagePreviews.image_3 && (
                                    <ImageField
                                        label="Image 3"
                                        name="image_3"
                                        preview={imagePreviews.image_3}
                                        selectedFile={images.image_3}
                                        onChange={handleImageChange}
                                    onRemove={removeImage}
                                    />
                                )}
                            </div>

                            {/* Add More Images */}
                            <div className="mt-6">
                                <label className={labelClass}>More Images</label>

                                {existingGallery.length > 0 && (
                                    <div className="mt-1.5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                        {existingGallery.map((url, index) => (
                                            <div
                                                key={url}
                                                className="relative overflow-hidden rounded-lg border border-gray-200"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Property image ${index + 1}`}
                                                    className="h-28 w-full object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(url)}
                                                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
                                                    aria-label={`Remove image ${index + 1}`}
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {extraImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {extraImages.map((slot, index) => (
                                            <div key={slot.id}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-[#62748E]">
                                                        New Image {index + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImageSlot(slot.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        aria-label={`Remove new image ${index + 1}`}
                                                    >
                                                        <FiX size={16} />
                                                    </button>
                                                </div>

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

                            {/* Floor Plan & Agent Images */}
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <ImageField
                                    label="Floor Plan Image"
                                    name="floor_plan_image"
                                    preview={imagePreviews.floor_plan_image}
                                    selectedFile={images.floor_plan_image}
                                    onChange={handleImageChange}
                                    onRemove={removeImage}
                                />

                                <ImageField
                                    label="Agent Image"
                                    name="agent_image"
                                    preview={imagePreviews.agent_image}
                                    selectedFile={images.agent_image}
                                    onChange={handleImageChange}
                                    onRemove={removeImage}
                                />
                            </div>
                        </section>

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                            <button
                                type="button"
                                disabled={updateLoading}
                                onClick={() => router.push("/admin/propertyManagement/propertyList")}
                                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={updateLoading}
                                className="inline-flex min-w-[175px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf681b] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {updateLoading ? (
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
                                        Updating Property...
                                    </>
                                ) : (
                                    "Update Property"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
