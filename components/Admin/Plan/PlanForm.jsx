"use client";

import React, { useEffect, useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { FiImage, FiSave, FiUpload } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";

import PageTitle from "../../Breadcrumb/PageTitle";
import {
    addAdminPlan,
    getAdminPlanById,
    removeAdminPlanImage,
    updateAdminPlan,
    uploadAdminPlanImage,
} from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import {
    EXTRA_CHARGES_KEY,
    PLAN_FEATURES,
    PLAN_MARKETING,
    featureRows,
    toFeatureKey,
    toFeatureMap,
} from "../../../utils/planFeatures";

// Every known key present (false = not included)
const withAllKeys = (value, labels) =>
    Object.fromEntries(featureRows(value, labels).map((row) => [row.key, row.enabled]));

const initialForm = {
    name: "",
    description: "",
    price: "",
    billing_period: "year",
    paid_listings: "0",
    free_listings: "0",
    features: withAllKeys({}, PLAN_FEATURES),
    marketing_services: withAllKeys({}, PLAN_MARKETING),
    support_level: "",
    sort_order: "0",
    is_active: true,
};

// free: price 0, never expires | month / year: plan expires after 1 month / 1 year
const BILLING_PERIODS = [
    { value: "free", label: "Free (no expiry)" },
    { value: "month", label: "Monthly (valid 1 month)" },
    { value: "year", label: "Yearly (valid 1 year)" },
    { value: "one_time", label: "One Time (no expiry)" },
];

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const IMAGE_MAX_SIZE = 2 * 1024 * 1024;

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

// On / off checkboxes for every feature key, plus custom keys
function FeatureChecklist({ label, name, value, labels, skip = [], placeholder, onChange }) {
    const [newLabel, setNewLabel] = useState("");
    const rows = featureRows(value, labels, skip);

    const toggle = (key, enabled) => onChange(name, { ...value, [key]: enabled });

    const addCustom = () => {
        const key = toFeatureKey(newLabel);

        if (!key) return;

        onChange(name, { ...value, [key]: true });
        setNewLabel("");
    };

    const removeCustom = (key) => {
        const next = { ...value };
        delete next[key];
        onChange(name, next);
    };

    return (
        <div className="md:col-span-2">
            <label className={labelClass}>{label}</label>

            <div className="mt-1.5 grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
                {rows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-2">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#1A1F36]">
                            <input
                                type="checkbox"
                                checked={row.enabled}
                                onChange={(event) => toggle(row.key, event.target.checked)}
                                className="h-4 w-4 accent-[#E87722]"
                            />
                            {row.label}
                        </label>

                        {!(row.key in labels) && (
                            <button
                                type="button"
                                onClick={() => removeCustom(row.key)}
                                className="text-red-500 hover:text-red-700"
                                aria-label={`Remove ${row.label}`}
                            >
                                <FaRegTrashCan size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <input
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            addCustom();
                        }
                    }}
                    placeholder={placeholder}
                    className={`${inputClass} mt-0`}
                />

                <button
                    type="button"
                    onClick={addCustom}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-[#E87722] transition hover:border-[#E87722] hover:bg-orange-50"
                >
                    <FaPlus size={11} />
                    Add
                </button>
            </div>
        </div>
    );
}

// Add + update plan form (pass planId to edit)
export default function PlanForm({ planId }) {
    const router = useRouter();
    const isEdit = Boolean(planId);

    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Plan image: savedImage = current URL, imageFile = new pick, removeImage = remove on save
    const [savedImage, setSavedImage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [removeImage, setRemoveImage] = useState(false);

    useEffect(() => {
        if (!imageFile) return undefined;

        const url = URL.createObjectURL(imageFile);
        setImagePreview(url);

        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const shownImage = imageFile ? imagePreview : removeImage ? "" : savedImage;

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!IMAGE_TYPES.includes(file.type)) {
            setFormError("Plan image must be JPG, PNG, WEBP or SVG.");
            return;
        }

        if (file.size > IMAGE_MAX_SIZE) {
            setFormError("Plan image must be 2 MB or smaller.");
            return;
        }

        setFormError("");
        setImageFile(file);
        setRemoveImage(false);
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview("");
        setRemoveImage(Boolean(savedImage));
    };

    useEffect(() => {
        if (!isEdit) return;

        let ignore = false;

        const fetchPlan = async () => {
            setLoading(true);
            setFormError("");

            try {
                const result = await getAdminPlanById(planId);
                const plan = result?.data?.plan;

                if (!plan) throw new Error("Plan details not found.");
                if (ignore) return;

                setForm({
                    name: plan.name || "",
                    description: plan.description || "",
                    price: plan.price ?? "",
                    billing_period: plan.billing_period || "year",
                    paid_listings: String(plan.paid_listings ?? 0),
                    free_listings: String(plan.free_listings ?? 0),
                    features: withAllKeys(plan.features, PLAN_FEATURES),
                    marketing_services: {
                        ...withAllKeys(plan.marketing_services, PLAN_MARKETING),
                        [EXTRA_CHARGES_KEY]: Boolean(
                            toFeatureMap(plan.marketing_services)[EXTRA_CHARGES_KEY]
                        ),
                    },
                    support_level: plan.support_level || "",
                    sort_order: String(plan.sort_order ?? 0),
                    is_active: Boolean(plan.is_active),
                });
                setSavedImage(plan.image_url || "");
            } catch (error) {
                if (!ignore) setFormError(error?.message || "Unable to load plan.");
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchPlan();

        return () => {
            ignore = true;
        };
    }, [isEdit, planId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            // Free plan is always price 0
            ...(name === "billing_period" && value === "free" ? { price: "0" } : {}),
        }));
    };

    const setField = (name, value) =>
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

    const totalListings = toNumber(form.paid_listings) + toNumber(form.free_listings);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!form.name.trim()) {
            setFormError("Please enter a plan name.");
            return;
        }

        if (form.price === "" || Number(form.price) < 0) {
            setFormError("Please enter a valid price.");
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: Number(form.price),
            billing_period: form.billing_period,
            paid_listings: toNumber(form.paid_listings),
            free_listings: toNumber(form.free_listings),
            total_listings: totalListings,
            features: form.features,
            marketing_services: form.marketing_services,
            support_level: form.support_level.trim() || null,
            sort_order: toNumber(form.sort_order),
            is_active: form.is_active,
        };

        setSaving(true);

        try {
            const result = isEdit
                ? await updateAdminPlan(planId, payload)
                : await addAdminPlan(payload);

            const savedId = result?.data?.plan?.id || planId;

            // Image after plan data (plan is saved even if the image fails)
            try {
                if (imageFile && savedId) {
                    await uploadAdminPlanImage(savedId, imageFile);
                } else if (removeImage && savedId) {
                    await removeAdminPlanImage(savedId);
                }
            } catch (imageError) {
                showToast(`Plan saved, but image not saved: ${imageError?.message}`, "error");
                if (!isEdit && savedId) router.replace(`/admin/plan/update/${savedId}`);
                return;
            }

            showToast(result?.message);
            router.push("/admin/plan/listing");
        } catch (error) {
            console.error("Failed to save plan:", error);

            setFormError(error?.message);
            showToast(error?.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const title = isEdit ? "Update Plan" : "Add Plan";

    return (
        <div className="pb-5">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Plans", path: "/admin/plan/listing" },
                    { label: title, active: true },
                ]}
                title={title}
            />

            <div className="mt-6 mb-4">
                <h2 className="text-base font-semibold text-[#1A1F36]">
                    Plan Information
                </h2>
            </div>

            {loading ? (
                <div className="flex min-h-48 items-center justify-center gap-3 rounded-xl bg-white shadow">
                    <Spinner size="md" color="warning" />
                    <span className="text-sm text-gray-500">Loading plan details...</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 shadow sm:p-6">
                    {formError && (
                        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Plan Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Gold Plan"
                                className={inputClass}
                                required
                                maxLength={255}
                            />
                        </div>

                        {/* Support level */}
                        <div>
                            <label htmlFor="support_level" className={labelClass}>
                                Support Level
                            </label>
                            <input
                                id="support_level"
                                name="support_level"
                                value={form.support_level}
                                onChange={handleChange}
                                placeholder="Priority support"
                                className={inputClass}
                                maxLength={255}
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label htmlFor="price" className={labelClass}>
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="4999"
                                className={inputClass}
                                disabled={form.billing_period === "free"}
                                required
                            />
                            {form.billing_period === "free" && (
                                <p className="mb-0 mt-1 text-xs text-[#62748E]">Free plan is always ₹0.</p>
                            )}
                        </div>

                        {/* Billing period */}
                        <div>
                            <label htmlFor="billing_period" className={labelClass}>
                                Billing Period <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="billing_period"
                                name="billing_period"
                                value={form.billing_period}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {BILLING_PERIODS.map((period) => (
                                    <option key={period.value} value={period.value}>
                                        {period.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Listings */}
                        <div className="grid grid-cols-3 gap-3 md:col-span-2">
                            <div>
                                <label htmlFor="paid_listings" className={labelClass}>
                                    Paid Listings
                                </label>
                                <input
                                    id="paid_listings"
                                    name="paid_listings"
                                    type="number"
                                    min="0"
                                    value={form.paid_listings}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label htmlFor="free_listings" className={labelClass}>
                                    Free Listings
                                </label>
                                <input
                                    id="free_listings"
                                    name="free_listings"
                                    type="number"
                                    min="0"
                                    value={form.free_listings}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label htmlFor="total_listings" className={labelClass}>
                                    Total Listings
                                </label>
                                <input
                                    id="total_listings"
                                    value={totalListings}
                                    readOnly
                                    className={`${inputClass} bg-gray-50 text-gray-500`}
                                />
                            </div>
                        </div>

                        {/* Plan image */}
                        <div className="md:col-span-2">
                            <label htmlFor="plan_image" className={labelClass}>
                                Plan Image
                            </label>

                            <div className="mt-1.5 flex flex-col gap-4 rounded-lg border border-dashed border-gray-300 p-4 sm:flex-row sm:items-center">
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#E87722]/40 bg-gray-50">
                                    {shownImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={shownImage}
                                            alt="Plan image preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <FiImage size={28} className="text-gray-300" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <label
                                            htmlFor="plan_image"
                                            className="mb-0 flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#001737] px-4 text-sm font-medium text-white transition hover:bg-[#E87722]"
                                        >
                                            <FiUpload size={15} />
                                            {shownImage ? "Change Image" : "Upload Image"}
                                        </label>
                                        <input
                                            id="plan_image"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={handleImageChange}
                                            className="sr-only"
                                        />

                                        {shownImage && (
                                            <button
                                                type="button"
                                                onClick={handleImageRemove}
                                                className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
                                            >
                                                <FaRegTrashCan size={13} />
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <p className="mb-0 mt-2 text-xs text-[#62748E]">
                                        {imageFile
                                            ? `New image: ${imageFile.name} (saved with the plan)`
                                            : removeImage
                                                ? "Image will be removed when you save."
                                                : "Shown on the website plan card, next to the listings badge (in place of the illustration). JPG, PNG, WEBP or SVG, max 2 MB. Use an illustration on a white or transparent background (house / building), like 320 × 260 px."}
                                    </p>
                                </div>
                            </div>
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
                                placeholder="Who is this plan for..."
                                rows={3}
                                className={inputClass}
                            />
                        </div>

                        <FeatureChecklist
                            label="Features"
                            name="features"
                            value={form.features}
                            labels={PLAN_FEATURES}
                            placeholder="Add custom feature, e.g. Site Visit Support"
                            onChange={setField}
                        />

                        <FeatureChecklist
                            label="Marketing Services"
                            name="marketing_services"
                            value={form.marketing_services}
                            labels={PLAN_MARKETING}
                            skip={[EXTRA_CHARGES_KEY]}
                            placeholder="Add custom service, e.g. Instagram"
                            onChange={setField}
                        />

                        <div className="md:col-span-2 -mt-2">
                            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#1A1F36]">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.marketing_services[EXTRA_CHARGES_KEY])}
                                    onChange={(event) =>
                                        setField("marketing_services", {
                                            ...form.marketing_services,
                                            [EXTRA_CHARGES_KEY]: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 accent-[#E87722]"
                                />
                                Extra charges apply for marketing services
                            </label>
                        </div>

                        {/* Sort order */}
                        <div>
                            <label htmlFor="sort_order" className={labelClass}>
                                Sort Order
                            </label>
                            <input
                                id="sort_order"
                                name="sort_order"
                                type="number"
                                min="0"
                                value={form.sort_order}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center pt-6">
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) => setField("is_active", event.target.checked)}
                                    className="h-4 w-4 accent-[#E87722]"
                                />
                                Active Plan
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                        <Link
                            href="/admin/plan/listing"
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
                                    {isEdit ? "Update Plan" : "Save Plan"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
