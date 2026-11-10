
import { useState } from "react";
import { FaUser, FaMobileAlt, FaEnvelope } from "react-icons/fa";
import { submitEnquiryForm } from "@/utils/fetchApi";

const initialForm = {
    name: "",
    phone: "",
    email: "",
    agree: true,
};

export default function PropertySideForm({ propertyId }) {
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        const { agree, ...payload } = formData;
        const res = await submitEnquiryForm({ ...payload, property: propertyId });

        if (res?.status) {
            setSuccessMsg(res.message);
            setFormData(initialForm);
            setTimeout(() => setSuccessMsg(""), 4000);
        } else {
            setErrorMsg(res?.message || "Something went wrong. Please try again.");
            setTimeout(() => setErrorMsg(""), 4000);
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="bg-[var(--secondary-color)] px-5 py-3">
            <h3 className="text-lg font-semibold text-white">Enquire Now</h3>
        </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 p-4 sm:p-5">
                {/* Name */}
                <div className="flex items-center gap-3 rounded border border-gray-300 bg-white px-3 focus-within:border-[var(--primary-color)]">
                <FaUser className="shrink-0 text-[var(--secondary-color)]" size={14} />
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name *"
                    required
                    className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-500 outline-none"
                />
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 rounded border border-gray-300 bg-white px-3 focus-within:border-[var(--primary-color)]">
                <FaEnvelope className="shrink-0 text-[var(--secondary-color)]" size={14} />
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address *"
                    required
                    className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-500 outline-none"
                />
                </div>

                {/* Mobile */}
                <div className="flex items-center gap-3 rounded border border-gray-300 bg-white px-3 focus-within:border-[var(--primary-color)]">
                <FaMobileAlt className="shrink-0 text-[var(--secondary-color)]" size={14} />
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Mobile Number *"
                    required
                    minLength={8}
                    maxLength={20}
                    className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-500 outline-none"
                />
                </div>

                {/* Checkbox */}
                <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-600">
                <input
                    type="checkbox"
                    name="agree"
                    checked={formData.agree}
                    onChange={handleChange}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary-color)]"
                />
                <span>I agree to be contacted thru call, WhatsApp, sms &amp; e-mail by bhumimanthan.com and other advertisers for similar properties.</span>
                </label>

                {successMsg && (
                    <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{successMsg}</p>
                )}
                {errorMsg && (
                    <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
                )}

                {/* Submit */}
                <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-[var(--primary-color)] py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? "Submitting..." : "Submit Enquiry"}
                </button>
            </form>
        </div>
    );
}
