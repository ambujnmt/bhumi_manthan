"use client";

import { useEffect, useState } from "react";
import { FiPhone, FiX } from "react-icons/fi";
import { Spinner } from "@heroui/react";
import { submitLead } from "../../utils/fetchApi";
import PhoneOtpField, { isValidEmail, isValidMobile } from "./PhoneOtpField";

const inputClass =
    "w-full rounded-xl border-[1px] border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary-color)]";

/**
 * "Get Number": buyer fills name / email / mobile (OTP verified) / message,
 * a Get Number lead is saved (POST /api/leads, same as the mobile app),
 * then the seller / broker number is shown.
 *
 *   <GetNumberModal open agentId={12} agentName="Neha Kapoor" phone="98..."
 *                   defaultMessage="Interested in ..." onClose={...} onUnlocked={(phone) => ...} />
 */
export default function GetNumberModal({ open, agentId, agentName, phone, defaultMessage = "", onClose, onUnlocked }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [phoneToken, setPhoneToken] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // Empty form each time it opens (no auto fill from the logged-in account)
    useEffect(() => {
        if (!open) return;

        setName("");
        setEmail("");
        setMobile("");
        setPhoneToken("");
        setMessage(defaultMessage);
        setError("");
        setDone(false);
    }, [open, defaultMessage]);

    // Close on Escape
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => event.key === "Escape" && !saving && onClose?.();
        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [open, saving, onClose]);

    if (!open) return null;

    const submit = async (event) => {
        event.preventDefault();

        if (saving) return;

        if (!agentId || !Number.isInteger(Number(agentId))) {
            setError("Unable to contact this seller / broker right now. Please try again later.");
            return;
        }

        if (name.trim().length < 2) {
            setError("Please enter your full name.");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!isValidMobile(mobile)) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }

        if (!phoneToken) {
            setError("Please verify your mobile number with OTP.");
            return;
        }

        setSaving(true);
        setError("");

        const response = await submitLead({
            lead_type: "profile",
            source: "get_number",
            agent_id: Number(agentId),
            agent_name: agentName || null,
            name: name.trim(),
            email: email.trim(),
            phone: mobile,
            message: message.trim() || null,
            phone_verification_token: phoneToken,
        });

        setSaving(false);

        if (!response?.status) {
            // Verification expired on the server -> verify again
            if (response?.requires_otp) setPhoneToken("");
            setError(response?.message || "Unable to submit enquiry.");
            return;
        }

        setDone(true);
        onUnlocked?.(phone);
    };

    return (
        <div
            className="fixed inset-0 z-[11000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose?.()}
        >
            <div role="dialog" aria-modal="true" aria-labelledby="get-number-title" className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h3 id="get-number-title" className="text-xl font-bold text-gray-800">
                            Get Contact Number
                        </h3>
                        <p className="mb-0 mt-1 text-sm text-gray-500">
                            {agentName ? `Send an enquiry to ${agentName}.` : "Send an enquiry to the seller / broker."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
                    >
                        <FiX size={19} />
                    </button>
                </div>

                {done ? (
                    <div className="py-4 text-center">
                        <div className="mb-3 text-4xl text-green-500">✓</div>
                        <h4 className="text-lg font-bold text-gray-800">Enquiry Submitted!</h4>
                        <p className="mt-2 text-sm text-gray-500">
                            Your enquiry has been submitted successfully.{phone ? " You can now call directly:" : ""}
                        </p>
                        {phone && (
                            <a
                                href={`tel:${phone}`}
                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white no-underline hover:text-white"
                            >
                                <FiPhone /> {phone}
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-4 block w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            placeholder="Your Name *"
                            autoComplete="name"
                            maxLength={100}
                            className={inputClass}
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError("");
                            }}
                            placeholder="Email Address *"
                            autoComplete="email"
                            maxLength={255}
                            className={inputClass}
                        />

                        {/* Mobile + OTP: the number unlocks only after verification */}
                        <PhoneOtpField
                            phone={mobile}
                            onPhoneChange={(value) => {
                                setMobile(value);
                                setError("");
                            }}
                            token={phoneToken}
                            onTokenChange={setPhoneToken}
                            variant="plain"
                            disabled={saving}
                        />

                        <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Your Message"
                            maxLength={2000}
                            className={inputClass}
                        />

                        {error && <p className="mb-0 text-sm text-red-600">{error}</p>}

                        <button
                            type="submit"
                            disabled={saving || !phoneToken}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--secondary-color)] disabled:opacity-60"
                        >
                            {saving && <Spinner size="sm" color="white" />}
                            {saving ? "Submitting..." : phoneToken ? "Get Number" : "Verify Mobile to Continue"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
