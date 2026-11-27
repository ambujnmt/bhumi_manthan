
import { useState } from "react";
import { FaUser, FaEnvelope } from "react-icons/fa";
import { submitEnquiryForm } from "@/utils/fetchApi";
import PhoneOtpField, { isValidEmail, isValidMobile } from "../../Common/PhoneOtpField";

const initialForm = {
    name: "",
    phone: "",
    email: "",
    agree: true,
};

// Bootstrap ".border" forces a grey border with !important -> border-[1px] keeps our colours
const boxClass = "flex items-center gap-3 rounded border-[1px] bg-white px-3 focus-within:border-[var(--primary-color)]";

// propertyId: property detail page; projectSlug: project detail page (same form, same admin inbox)
export default function PropertySideForm({ propertyId = null, projectSlug = null }) {
    const [formData, setFormData] = useState(initialForm);
    // From the phone OTP (sent as phone_verification_token)
    const [phoneToken, setPhoneToken] = useState("");
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const nameError = touched.name && formData.name.trim().length < 2 ? "Please enter your full name." : "";
    const emailError = touched.email && !isValidEmail(formData.email) ? "Enter a valid email address." : "";
    const canSubmit = formData.name.trim().length >= 2 && isValidEmail(formData.email) && isValidMobile(formData.phone) && phoneToken && formData.agree;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true });

        if (!phoneToken) {
            setErrorMsg(isValidMobile(formData.phone) ? "Please verify your mobile number with OTP." : "Enter a valid 10-digit mobile number.");
            return;
        }

        if (!canSubmit) return;

        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        const { agree, ...payload } = formData;
        const res = await submitEnquiryForm({
            ...payload,
            email: payload.email.trim(),
            phone_verification_token: phoneToken,
            ...(propertyId && { property: String(propertyId) }),
            ...(projectSlug && { project: String(projectSlug) }),
        });

        if (res?.status) {
            setSuccessMsg(res.message);
            setFormData(initialForm);
            setPhoneToken("");
            setTouched({});
            setTimeout(() => setSuccessMsg(""), 4000);
        } else {
            // Verification expired on the server -> verify again
            if (res?.requires_otp) setPhoneToken("");
            setErrorMsg(res?.message || "Something went wrong. Please try again.");
            setTimeout(() => setErrorMsg(""), 6000);
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
            <form onSubmit={handleSubmit} noValidate className="space-y-3 p-4 sm:p-5">
                {/* Name */}
                <div>
                    <div className={`${boxClass} ${nameError ? "border-red-500" : "border-gray-300"}`}>
                        <FaUser className="shrink-0 text-[var(--secondary-color)]" size={14} />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                            placeholder="Your Name *"
                            autoComplete="name"
                            maxLength={100}
                            required
                            className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-500 outline-none"
                        />
                    </div>
                    {nameError && <p className="mb-0 mt-1 text-xs text-red-600">{nameError}</p>}
                </div>

                {/* Email */}
                <div>
                    <div className={`${boxClass} ${emailError ? "border-red-500" : "border-gray-300"}`}>
                        <FaEnvelope className="shrink-0 text-[var(--secondary-color)]" size={14} />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                            placeholder="Email Address *"
                            autoComplete="email"
                            maxLength={255}
                            required
                            className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-500 outline-none"
                        />
                    </div>
                    {emailError && <p className="mb-0 mt-1 text-xs text-red-600">{emailError}</p>}
                </div>

                {/* Mobile + OTP */}
                <PhoneOtpField
                    phone={formData.phone}
                    onPhoneChange={(phone) => setFormData((prev) => ({ ...prev, phone }))}
                    token={phoneToken}
                    onTokenChange={setPhoneToken}
                    disabled={loading}
                />

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

                {/* Submit: only after the mobile number is OTP verified */}
                <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full rounded bg-[var(--primary-color)] py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? "Submitting..." : phoneToken ? "Submit Enquiry" : "Verify Mobile to Submit"}
                </button>
            </form>
        </div>
    );
}
