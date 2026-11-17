"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Link, Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import {
    FaBullhorn,
    FaBullseye,
    FaCalendarAlt,
    FaChartBar,
    FaCheck,
    FaChevronRight,
    FaCloudUploadAlt,
    FaFilePdf,
    FaHandshake,
    FaHeadset,
    FaImages,
    FaLightbulb,
    FaMapMarkerAlt,
    FaRegListAlt,
    FaStar,
    FaUserFriends,
    FaUsers,
} from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";

import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import SearchableSelect from "../PropertyManagement/SearchableSelect";
import EventPreviewCard from "./EventPreviewCard";
import {
    addAdminEvent,
    getAdminEventById,
    getAdminEventOptions,
    updateAdminEvent,
} from "../../../utils/fetchApi";
import { getAdminCitiesByState, getAdminLocations } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";

const NAVY = "#12305F";
const GOLD = "#D4961C";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DESCRIPTION_LIMIT = 1000;

const initialForm = {
    title: "",
    event_type: "",
    organizer_name: "",
    brand_name: "",
    description: "",
    event_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    address: "",
    city: "",
    state: "",
    map_url: "",
    expected_footfall: "",
    builders_attending: "",
    highlights: [],
    highlight_other: "",
    is_active: true,
};

const BENEFITS = [
    { icon: FaUsers, text: "Showcase Your Event" },
    { icon: FaBullseye, text: "Get More Footfall" },
    { icon: FaHandshake, text: "Invite Channel Partners & Brokers" },
    { icon: FaChartBar, text: "Increase Brand Visibility" },
    { icon: FaBullhorn, text: "Promote Across Our Platform" },
    { icon: FaUserFriends, text: "Attract End Users & Investors" },
];

const WHY_POST = [
    "Reach thousands of property buyers & investors",
    "Invite brokers, channel partners and dealers",
    "Showcase your upcoming projects and offers",
    "Increase event footfall and brand awareness",
    "Get genuine inquiries and registrations",
];

const TIPS = [
    "Use an attractive banner image",
    "Clearly mention date, venue and key highlights",
    "List all participating builders/developers",
    "Provide accurate expected footfall",
    "Mention special offers and unique benefits",
    "Keep information updated",
];

const inputClass =
    "mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-semibold text-[#1A1F36]";

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

// "18:30:00" -> "18:30" (time input value)
const toTimeInput = (value) => (value ? String(value).slice(0, 5) : "");

const SectionTitle = ({ icon: Icon, children }) => (
    <div className="mb-4 mt-7 flex items-center gap-3 rounded-lg bg-[#EEF4FB] px-4 py-3 first:mt-0">
        <Icon className="text-[20px]" style={{ color: GOLD }} />
        <h3 className="mb-0 text-[17px] font-bold" style={{ color: NAVY }}>{children}</h3>
    </div>
);

const SideCard = ({ icon: Icon, title, children }) => (
    <div className="overflow-hidden rounded-xl border border-[#E3EAF3] bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-[#EEF4FB] px-4 py-3">
            {Icon && <Icon className="text-[20px]" style={{ color: NAVY }} />}
            <h3 className="mb-0 text-[17px] font-bold" style={{ color: NAVY }}>{title}</h3>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const CheckList = ({ items }) => (
    <ul className="space-y-2.5">
        {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[14px] text-[#1F2A44]">
                <span
                    className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: GOLD }}
                >
                    <FaCheck size={9} />
                </span>
                {item}
            </li>
        ))}
    </ul>
);

// Post / update event (admin, staff, seller, broker). Pass eventId to edit.
export default function EventForm({ eventId }) {
    const router = useRouter();
    const isEdit = Boolean(eventId);

    const [form, setForm] = useState(initialForm);
    const [options, setOptions] = useState({ types: [], footfalls: [], highlights: [], max_images: 5 });
    // { key, path?, url, file? } - first image is the banner
    const [images, setImages] = useState([]);
    const [brochure, setBrochure] = useState({ url: "", file: null, remove: false });
    const [confirmed, setConfirmed] = useState(isEdit);

    const [states, setStates] = useState([]);
    const [statesLoading, setStatesLoading] = useState(true);
    const [cities, setCities] = useState([]);
    const [citiesLoading, setCitiesLoading] = useState(false);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);

    const imageInputRef = useRef(null);
    const brochureInputRef = useRef(null);
    const keyRef = useRef(0);

    const selectedState = states.find((state) => state.name === form.state);

    // Options + states
    useEffect(() => {
        getAdminEventOptions()
            .then((res) => res?.data && setOptions(res.data))
            .catch((error) => setFormError(error?.message || "Unable to load form options."));

        getAdminLocations("states")
            .then((res) => setStates(res?.data?.states || []))
            .catch(() => setStates([]))
            .finally(() => setStatesLoading(false));
    }, []);

    // Cities of selected state
    useEffect(() => {
        if (!selectedState) {
            setCities([]);
            return;
        }

        let cancelled = false;
        setCitiesLoading(true);

        getAdminCitiesByState(selectedState.id)
            .then((res) => !cancelled && setCities(res?.data?.cities || []))
            .catch(() => !cancelled && setCities([]))
            .finally(() => !cancelled && setCitiesLoading(false));

        return () => {
            cancelled = true;
        };
    }, [selectedState?.id]);

    // Edit: load event
    useEffect(() => {
        if (!isEdit) return;

        let ignore = false;

        const fetchEvent = async () => {
            setLoading(true);
            setFormError("");

            try {
                const result = await getAdminEventById(eventId);
                const event = result?.data;

                if (!event) throw new Error("Event details not found.");
                if (ignore) return;

                setForm({
                    title: event.title || "",
                    event_type: event.event_type || "",
                    organizer_name: event.organizer_name || "",
                    brand_name: event.brand_name || "",
                    description: event.description || "",
                    event_date: event.event_date ? String(event.event_date).slice(0, 10) : "",
                    end_date: event.end_date ? String(event.end_date).slice(0, 10) : "",
                    start_time: toTimeInput(event.start_time),
                    end_time: toTimeInput(event.end_time),
                    location: event.location || "",
                    address: event.address || "",
                    city: event.city || "",
                    state: event.state || "",
                    map_url: event.map_url || "",
                    expected_footfall: event.expected_footfall || "",
                    builders_attending: event.builders_attending || "",
                    highlights: event.highlights || [],
                    highlight_other: event.highlight_other || "",
                    is_active: Boolean(event.is_active),
                });

                setImages(
                    (event.images || []).map((image) => ({
                        key: `old-${image.path}`,
                        path: image.path,
                        url: image.url,
                    }))
                );
                setBrochure({ url: event.brochure || "", file: null, remove: false });
            } catch (error) {
                if (!ignore) setFormError(error?.message || "Unable to load event.");
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchEvent();

        return () => {
            ignore = true;
        };
    }, [isEdit, eventId]);

    const setField = (name, value) =>
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

    const handleChange = (event) => setField(event.target.name, event.target.value);

    const toggleHighlight = (value) =>
        setField(
            "highlights",
            form.highlights.includes(value)
                ? form.highlights.filter((item) => item !== value)
                : [...form.highlights, value]
        );

    const addImages = (fileList) => {
        const files = Array.from(fileList || []);
        const room = options.max_images - images.length;

        if (files.length === 0) return;

        if (room <= 0) {
            setFormError(`You can upload up to ${options.max_images} images.`);
            return;
        }

        const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);

        if (invalid) {
            setFormError("Images must be JPG, PNG or WEBP and 5 MB or smaller.");
            return;
        }

        setFormError(files.length > room ? `Only ${room} more image(s) allowed, extra files skipped.` : "");
        setImages((previous) => [
            ...previous,
            ...files.slice(0, room).map((file) => ({
                key: `new-${keyRef.current++}`,
                file,
                url: URL.createObjectURL(file),
            })),
        ]);
    };

    const removeImage = (key) => setImages((previous) => previous.filter((image) => image.key !== key));

    const makeBanner = (key) =>
        setImages((previous) => [
            ...previous.filter((image) => image.key === key),
            ...previous.filter((image) => image.key !== key),
        ]);

    const pickBrochure = (file) => {
        if (!file) return;

        if (file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
            setFormError("Brochure must be a PDF file of 10 MB or smaller.");
            return;
        }

        setFormError("");
        setBrochure((previous) => ({ ...previous, file, remove: false }));
    };

    // Labels for the live preview
    const preview = useMemo(() => {
        const label = (list, value) => list.find((item) => item.value === value)?.label;

        return {
            ...form,
            end_date: form.end_date || form.event_date,
            event_type_label: label(options.types, form.event_type),
            expected_footfall_label: label(options.footfalls, form.expected_footfall),
            highlight_labels: form.highlights
                .map((value) => (value === "others" ? form.highlight_other.trim() : label(options.highlights, value)))
                .filter(Boolean),
        };
    }, [form, options]);

    const validate = () => {
        const required = [
            ["title", "event title"],
            ["event_type", "event type"],
            ["organizer_name", "organizer / company name"],
            ["description", "event description"],
            ["event_date", "start date"],
            ["end_date", "end date"],
            ["start_time", "start time"],
            ["end_time", "end time"],
            ["location", "venue name"],
            ["address", "full address"],
            ["state", "state"],
            ["city", "city"],
            ["expected_footfall", "expected footfall"],
            ["builders_attending", "builders / developers attending"],
        ];

        const missing = required.find(([name]) => !String(form[name] || "").trim());

        if (missing) return `Please enter the ${missing[1]}.`;
        if (form.end_date < form.event_date) return "End date must be the same as or after the start date.";
        if (form.end_date === form.event_date && form.end_time <= form.start_time) {
            return "End time must be later than start time.";
        }
        if (form.highlights.includes("others") && !form.highlight_other.trim()) {
            return "Please specify the other highlight.";
        }
        if (images.length === 0) return "Please upload at least one event image.";
        if (!confirmed) return "Please confirm that the event information is accurate.";

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const error = validate();
        setFormError(error);

        if (error) {
            showToast(error, "error");
            return;
        }

        const payload = new FormData();
        const text = ["title", "event_type", "organizer_name", "brand_name", "description", "event_date",
            "end_date", "location", "address", "city", "state", "map_url", "expected_footfall",
            "builders_attending", "highlight_other"];

        text.forEach((name) => payload.append(name, String(form[name] || "").trim()));
        payload.append("start_time", `${form.start_time}:00`);
        payload.append("end_time", `${form.end_time}:00`);
        payload.append("is_active", form.is_active ? "1" : "0");
        form.highlights.forEach((value) => payload.append("highlights[]", value));

        // image_order[] keeps the on-screen order (first = banner):
        // "existing:<path>" for kept images, "new:<index in images[]>" for uploads
        let newIndex = 0;

        images.forEach((image) => {
            if (image.path) {
                payload.append("existing_images[]", image.path);
                payload.append("image_order[]", `existing:${image.path}`);
            } else {
                payload.append("images[]", image.file);
                payload.append("image_order[]", `new:${newIndex++}`);
            }
        });

        if (brochure.file) payload.append("brochure", brochure.file);
        if (brochure.remove) payload.append("remove_brochure", "1");

        setSaving(true);

        try {
            const result = isEdit ? await updateAdminEvent(eventId, payload) : await addAdminEvent(payload);

            showToast(result?.message);
            router.push("/admin/event/listing");
        } catch (err) {
            console.error("Failed to save event:", err);

            setFormError(err?.message);
            showToast(err?.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const title = isEdit ? "Update Event" : "Post Event";
    const bannerUrl = images[0]?.url || "";

    return (
        <div className="pb-5">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Events", path: "/admin/event/listing" },
                    { label: title, active: true },
                ]}
                title={title}
            />

            {/* Banner */}
            <div
                className="relative mt-5 overflow-hidden rounded-xl px-6 py-7 sm:px-8"
                style={{ background: `linear-gradient(110deg, ${NAVY} 0%, #1B4380 55%, #2E5E9E 100%)` }}
            >
                <FaCalendarAlt className="pointer-events-none absolute -right-6 -top-6 text-[160px] text-white/5" />
                <h2 className="mb-0 text-[26px] font-extrabold leading-tight text-white sm:text-[32px]">
                    {isEdit ? "Update Your" : "Post Your"}
                    <span className="block" style={{ color: "#F2B544" }}>Real Estate Event</span>
                </h2>
                <p className="mb-0 mt-2 max-w-xl text-[15px] text-white/85">
                    Reach genuine buyers, investors and channel partners across India with bhumimanthan.
                </p>
            </div>

            {/* Benefits */}
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white px-4 py-4 shadow-sm sm:grid-cols-3 xl:grid-cols-6">
                {BENEFITS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                        <Icon className="shrink-0 text-[26px]" style={{ color: GOLD }} />
                        <span className="text-[13px] leading-tight text-[#1F2A44]">{text}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="mt-5 flex min-h-48 items-center justify-center gap-3 rounded-xl bg-white shadow">
                    <Spinner size="md" color="warning" />
                    <span className="text-sm text-gray-500">Loading event details...</span>
                </div>
            ) : (
                <div className="mt-5 grid grid-cols-12 gap-5">
                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="col-span-12 overflow-hidden rounded-xl border border-[#E3EAF3] bg-white shadow-sm xl:col-span-8"
                    >
                        <div className="flex items-center gap-3 px-5 py-3.5" style={{ backgroundColor: NAVY }}>
                            <FaRegListAlt className="text-[20px] text-white" />
                            <h2 className="mb-0 text-[18px] font-bold text-white">Event Information</h2>
                        </div>

                        <div className="p-5">
                            {formError && (
                                <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                    {formError}
                                </p>
                            )}

                            {/* Basic info */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="title" className={labelClass}>Event Title<Required /></label>
                                    <input id="title" name="title" value={form.title} onChange={handleChange}
                                        placeholder="e.g. Mega Property Expo 2025" maxLength={255} className={inputClass} />
                                </div>

                                <div>
                                    <label htmlFor="event_type" className={labelClass}>Event Type<Required /></label>
                                    <select id="event_type" name="event_type" value={form.event_type} onChange={handleChange} className={inputClass}>
                                        <option value="">Select Event Type</option>
                                        {options.types.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="organizer_name" className={labelClass}>Organizer / Company Name<Required /></label>
                                    <input id="organizer_name" name="organizer_name" value={form.organizer_name} onChange={handleChange}
                                        placeholder="Your Company Name" maxLength={255} className={inputClass} />
                                </div>

                                <div>
                                    <label htmlFor="brand_name" className={labelClass}>Project / Brand Name (if applicable)</label>
                                    <input id="brand_name" name="brand_name" value={form.brand_name} onChange={handleChange}
                                        placeholder="e.g. Green Valley, Sky Towers" maxLength={255} className={inputClass} />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className={labelClass}>Event Description<Required /></label>
                                    <div className="relative">
                                        <textarea id="description" name="description" value={form.description} onChange={handleChange}
                                            rows={4} maxLength={DESCRIPTION_LIMIT}
                                            placeholder="Write about your event, key highlights, projects, offers, and what visitors can expect..."
                                            className={`${inputClass} pb-6`} />
                                        <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                                            {form.description.length}/{DESCRIPTION_LIMIT}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Date, time & venue */}
                            <SectionTitle icon={FaMapMarkerAlt}>Date, Time & Venue</SectionTitle>

                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <div>
                                    <label htmlFor="event_date" className={labelClass}>Start Date<Required /></label>
                                    <input id="event_date" name="event_date" type="date" value={form.event_date}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setForm((previous) => ({
                                                ...previous,
                                                event_date: value,
                                                // keep end date valid
                                                end_date: !previous.end_date || previous.end_date < value ? value : previous.end_date,
                                            }));
                                        }}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="end_date" className={labelClass}>End Date<Required /></label>
                                    <input id="end_date" name="end_date" type="date" value={form.end_date} min={form.event_date || undefined}
                                        onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="start_time" className={labelClass}>Start Time<Required /></label>
                                    <input id="start_time" name="start_time" type="time" value={form.start_time} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="end_time" className={labelClass}>End Time<Required /></label>
                                    <input id="end_time" name="end_time" type="time" value={form.end_time} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="md:col-span-3">
                                    <label htmlFor="location" className={labelClass}>Venue Name<Required /></label>
                                    <input id="location" name="location" value={form.location} onChange={handleChange}
                                        placeholder="e.g. Taj Hotel, Convention Center, etc." maxLength={255} className={inputClass} />
                                </div>

                                <div className="md:col-span-3">
                                    <label htmlFor="address" className={labelClass}>Full Address<Required /></label>
                                    <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
                                        maxLength={1000} placeholder="Address with landmarks, city, state, pincode" className={inputClass} />
                                </div>

                                <div>
                                    <label htmlFor="state" className={labelClass}>State<Required /></label>
                                    <SearchableSelect
                                        id="state"
                                        name="state"
                                        value={form.state}
                                        options={states.map((state) => ({ value: state.name, label: state.name }))}
                                        onChange={(state) => state !== form.state && setForm((previous) => ({ ...previous, state, city: "" }))}
                                        placeholder="Select State"
                                        searchPlaceholder="Search state..."
                                        emptyText="No state found"
                                        loading={statesLoading}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="city" className={labelClass}>City<Required /></label>
                                    <SearchableSelect
                                        id="city"
                                        name="city"
                                        value={form.city}
                                        options={cities.map((city) => ({ value: city.name, label: city.name }))}
                                        onChange={(city) => setField("city", city)}
                                        placeholder={form.state ? "Select City" : "Select state first"}
                                        searchPlaceholder="Search city..."
                                        emptyText="No city found"
                                        loading={citiesLoading}
                                        disabled={!form.state}
                                        required
                                    />
                                    {/* saved city missing from list (edit) */}
                                    {form.city && !citiesLoading && selectedState && !cities.some((city) => city.name === form.city) && (
                                        <p className="mb-0 mt-1 text-xs text-amber-600">"{form.city}" is not in cities list. Please select again.</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="map_url" className={labelClass}>Google Map Location (Optional)</label>
                                    <input id="map_url" name="map_url" type="url" value={form.map_url} onChange={handleChange}
                                        placeholder="Paste Google Map Link" className={inputClass} />
                                </div>
                            </div>

                            {/* Event details */}
                            <SectionTitle icon={FaUsers}>Event Details</SectionTitle>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="expected_footfall" className={labelClass}>Expected Footfall<Required /></label>
                                    <select id="expected_footfall" name="expected_footfall" value={form.expected_footfall} onChange={handleChange} className={inputClass}>
                                        <option value="">Select Expected Footfall</option>
                                        {options.footfalls.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="builders_attending" className={labelClass}>Builders / Developers Attending<Required /></label>
                                    <textarea id="builders_attending" name="builders_attending" value={form.builders_attending} onChange={handleChange}
                                        rows={2} maxLength={1000}
                                        placeholder="List participating builders / developers (e.g. DLF, Godrej, Tata Housing ...)"
                                        className={inputClass} />
                                </div>
                            </div>

                            <p className={`${labelClass} mb-2 mt-4`}>Key Highlights</p>
                            <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                {options.highlights.map((item) => (
                                    <div key={item.value}>
                                        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#1F2A44]">
                                            <input
                                                type="checkbox"
                                                checked={form.highlights.includes(item.value)}
                                                onChange={() => toggleHighlight(item.value)}
                                                className="h-4 w-4 accent-[#E87722]"
                                            />
                                            {item.label}
                                        </label>
                                        {item.value === "others" && form.highlights.includes("others") && (
                                            <input
                                                name="highlight_other"
                                                value={form.highlight_other}
                                                onChange={handleChange}
                                                placeholder="Please specify"
                                                maxLength={255}
                                                className={`${inputClass} py-1.5 text-[13px]`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Images & brochure */}
                            <SectionTitle icon={FaImages}>Images & Brochures</SectionTitle>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className={`${labelClass} mb-1.5`}>Event Banner / Images<Required /></p>
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={images.length >= options.max_images}
                                        className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center transition hover:border-[#E87722] hover:bg-orange-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <FaCloudUploadAlt className="text-[30px]" style={{ color: NAVY }} />
                                        <span className="mt-1 text-[14px] font-semibold text-[#1F2A44]">Click to Upload Images</span>
                                        <span className="text-[12px] text-gray-500">JPG, PNG, WEBP (Max 5 MB each)</span>
                                        <span className="text-[12px] text-gray-500">
                                            You can upload up to {options.max_images} images ({images.length}/{options.max_images})
                                        </span>
                                    </button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept={IMAGE_TYPES.join(",")}
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            addImages(e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                </div>

                                <div>
                                    <p className={`${labelClass} mb-1.5`}>Brochure / Invitation (PDF)</p>
                                    {(brochure.file || (brochure.url && !brochure.remove)) ? (
                                        <div className="flex h-[124px] flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-center">
                                            <FaFilePdf className="text-[30px] text-red-600" />
                                            {brochure.file ? (
                                                <span className="max-w-full truncate text-[13px] font-medium text-[#1F2A44]">{brochure.file.name}</span>
                                            ) : (
                                                <a href={brochure.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#E87722] underline">
                                                    View current brochure
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setBrochure((previous) => ({ ...previous, file: null, remove: Boolean(previous.url) }))}
                                                className="text-[12px] font-semibold text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => brochureInputRef.current?.click()}
                                            className="flex h-[124px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 text-center transition hover:border-[#E87722] hover:bg-orange-50/40"
                                        >
                                            <FaCloudUploadAlt className="text-[30px]" style={{ color: NAVY }} />
                                            <span className="mt-1 text-[14px] font-semibold text-[#1F2A44]">Upload PDF</span>
                                            <span className="text-[12px] text-gray-500">Max 10 MB</span>
                                        </button>
                                    )}
                                    <input
                                        ref={brochureInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            pickBrochure(e.target.files?.[0]);
                                            e.target.value = "";
                                        }}
                                    />
                                </div>
                            </div>

                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    {images.map((image, index) => (
                                        <div key={image.key} className="group relative overflow-hidden rounded-lg border border-gray-200">
                                            <img src={image.url} alt={`Event image ${index + 1}`} className="h-24 w-full object-cover" />
                                            {index === 0 ? (
                                                <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: GOLD }}>
                                                    Banner
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => makeBanner(image.key)}
                                                    className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[#1F2A44] opacity-0 shadow transition group-hover:opacity-100"
                                                >
                                                    <FaStar size={8} /> Set Banner
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(image.key)}
                                                aria-label="Remove image"
                                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow"
                                            >
                                                <FaRegTrashCan size={11} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Status + confirm */}
                            <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#1A1F36]">
                                    <input type="checkbox" checked={form.is_active}
                                        onChange={(e) => setField("is_active", e.target.checked)} className="h-4 w-4 accent-[#E87722]" />
                                    Show this event on the website (Active)
                                </label>

                                <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1A1F36]">
                                    <input type="checkbox" checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#E87722]" />
                                    I confirm that the information provided is accurate and I have the right to post this event.
                                </label>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Link
                                    href="/admin/event/listing"
                                    className="flex items-center justify-center rounded-lg border border-gray-300 py-3 text-[15px] font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    className="rounded-lg border-2 py-3 text-[15px] font-bold transition hover:bg-[#EEF4FB]"
                                    style={{ borderColor: NAVY, color: NAVY }}
                                >
                                    Preview Event
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-bold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ backgroundColor: GOLD }}
                                >
                                    {saving ? (
                                        <>
                                            <Spinner size="sm" color="white" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            {isEdit ? "Update Event" : "Submit Event"} <FaChevronRight size={12} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Sidebar */}
                    <aside className="col-span-12 space-y-5 xl:col-span-4">
                        <SideCard title="Why Post Your Event on bhumimanthan?">
                            <CheckList items={WHY_POST} />
                        </SideCard>

                        <SideCard icon={FaRegListAlt} title="Event Preview">
                            <EventPreviewCard event={preview} image={bannerUrl} />
                        </SideCard>

                        <SideCard icon={FaLightbulb} title="Tips for Better Response">
                            <CheckList items={TIPS} />
                        </SideCard>

                        <div className="rounded-xl bg-[#EEF4FB] p-5">
                            <div className="flex items-center gap-3">
                                <FaHeadset className="text-[32px]" style={{ color: NAVY }} />
                                <div>
                                    <p className="mb-0 text-[16px] font-bold" style={{ color: NAVY }}>Need Help?</p>
                                    <p className="mb-0 text-[13px] text-[#3B4A63]">Contact our Support Team</p>
                                </div>
                            </div>
                            <a
                                href="/user/cms/contactUs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 bg-white py-2.5 text-[15px] font-bold no-underline"
                                style={{ borderColor: NAVY, color: NAVY }}
                            >
                                Contact Us <FaChevronRight size={12} />
                            </a>
                        </div>
                    </aside>
                </div>
            )}

            <Tmodal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title="Event Preview"
                size="md"
                footer={
                    <Button variant="bordered" onPress={() => setPreviewOpen(false)}>
                        Close
                    </Button>
                }
            >
                <EventPreviewCard event={preview} image={bannerUrl} />
            </Tmodal>
        </div>
    );
}
