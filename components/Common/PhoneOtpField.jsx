"use client";

import { useEffect, useRef, useState } from "react";
import { FaMobileAlt } from "react-icons/fa";
import { sendPhoneOtp, verifyPhoneOtp } from "../../utils/fetchApi";

// 10-digit Indian mobile (6-9 first digit)
export const isValidMobile = (phone) => /^[6-9]\d{9}$/.test(String(phone || ""));

// "+91 98765-43210" / "098765..." -> "9876543210" (max 10 digits)
export const cleanMobile = (value) => {
    let digits = String(value || "").replace(/\D/g, "");

    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);

    return digits.slice(0, 10);
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());

/**
 * Mobile number + OTP verification (enquiry / Get Number / event forms).
 *
 *   <PhoneOtpField phone={phone} onPhoneChange={setPhone}
 *                  token={token} onTokenChange={setToken} />
 *
 * token: "" until the OTP is verified; send it as phone_verification_token.
 * Changing the number clears the token (it belongs to one number).
 * variant: "box" (icon box, side form) | "plain" (rounded input, modals)
 */
export default function PhoneOtpField({ phone, onPhoneChange, token, onTokenChange, variant = "box", disabled = false }) {
    const [step, setStep] = useState("idle"); // idle | sent
    const [otp, setOtp] = useState("");
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [debugOtp, setDebugOtp] = useState("");
    const [resendIn, setResendIn] = useState(0);
    const [otpLength, setOtpLength] = useState(6);
    const otpRef = useRef(null);

    const verified = Boolean(token);
    const validPhone = isValidMobile(phone);

    // Resend countdown
    useEffect(() => {
        if (resendIn <= 0) return undefined;

        const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);

        return () => clearTimeout(timer);
    }, [resendIn]);

    // Form reset from outside (phone cleared) -> back to the start
    useEffect(() => {
        if (!phone) {
            setStep("idle");
            setOtp("");
            setError("");
            setInfo("");
            setDebugOtp("");
        }
    }, [phone]);

    const changePhone = (value) => {
        onPhoneChange(cleanMobile(value));
        setError("");

        if (step !== "idle" || verified) {
            setStep("idle");
            setOtp("");
            setInfo("");
            setDebugOtp("");
            onTokenChange("");
        }
    };

    const sendOtp = async () => {
        if (!validPhone) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }

        setSending(true);
        setError("");

        const res = await sendPhoneOtp(phone);

        setSending(false);

        if (!res?.status) {
            setError(res?.message || "Could not send the OTP.");
            if (res?.data?.retry_after) setResendIn(Math.min(Number(res.data.retry_after), 3600));
            return;
        }

        setStep("sent");
        setOtp("");
        setInfo(res.message || "OTP sent.");
        setDebugOtp(res?.data?.debug_otp || "");
        setOtpLength(Number(res?.data?.otp_length) || 6);
        setResendIn(Number(res?.data?.resend_in) || 30);
        setTimeout(() => otpRef.current?.focus(), 50);
    };

    const verifyOtp = async (code = otp) => {
        if (code.length !== otpLength) {
            setError(`Enter the ${otpLength}-digit OTP.`);
            return;
        }

        setVerifying(true);
        setError("");

        const res = await verifyPhoneOtp(phone, code);

        setVerifying(false);

        if (!res?.status || !res?.data?.verification_token) {
            setError(res?.message || "Wrong OTP.");
            return;
        }

        onTokenChange(res.data.verification_token);
        setStep("idle");
        setInfo("");
        setDebugOtp("");
    };

    const boxClass =
        variant === "box"
            ? "flex items-center gap-3 rounded border-[1px] border-gray-300 bg-white px-3 focus-within:border-[var(--primary-color)]"
            : "flex items-center gap-2 rounded-xl border-[1px] border-gray-200 bg-white px-4 focus-within:border-[var(--primary-color)]";
    const inputPad = variant === "box" ? "py-2.5" : "py-3";

    return (
        <div className="space-y-2">
            {/* Mobile number */}
            <div className={`${boxClass} ${verified ? "!border-green-500 bg-green-50/40" : ""}`}>
                {variant === "box" && <FaMobileAlt className="shrink-0 text-[var(--secondary-color)]" size={14} />}
                <span className="shrink-0 text-sm text-gray-500">+91</span>
                <input
                    type="tel"
                    name="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => changePhone(e.target.value)}
                    placeholder="Mobile Number *"
                    required
                    maxLength={14}
                    disabled={disabled || sending || verifying}
                    aria-invalid={Boolean(error) && step === "idle"}
                    className={`min-w-0 flex-1 bg-transparent ${inputPad} text-sm text-gray-700 placeholder-gray-500 outline-none`}
                />

                {verified ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700">
                        ✓ Verified
                        <button type="button" onClick={() => changePhone("")} className="ml-1 font-medium text-gray-500 underline hover:text-[var(--primary-color)]">
                            Change
                        </button>
                    </span>
                ) : step === "idle" ? (
                    <button
                        type="button"
                        onClick={sendOtp}
                        disabled={!validPhone || sending || resendIn > 0 || disabled}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[var(--primary-color)] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                        {sending ? "Sending..." : resendIn > 0 ? `Wait ${resendIn}s` : "Send OTP"}
                    </button>
                ) : null}
            </div>

            {/* OTP step */}
            {step === "sent" && !verified && (
                <div className="rounded-lg border-[1px] border-orange-100 bg-orange-50/50 p-2.5">
                    {info && <p className="mb-1.5 text-xs text-gray-600">{info}</p>}

                    <div className="flex gap-2">
                        <input
                            ref={otpRef}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={otp}
                            onChange={(e) => {
                                const code = e.target.value.replace(/\D/g, "").slice(0, otpLength);
                                setOtp(code);
                                setError("");
                                // Auto verify once all digits are typed / pasted
                                if (code.length === otpLength) verifyOtp(code);
                            }}
                            placeholder={`Enter ${otpLength}-digit OTP`}
                            aria-label="OTP"
                            className="min-w-0 flex-1 rounded border-[1px] border-gray-300 bg-white px-3 py-2 text-center font-mono text-sm tracking-[0.3em] outline-none focus:border-[var(--primary-color)]"
                        />
                        <button
                            type="button"
                            onClick={() => verifyOtp()}
                            disabled={verifying || otp.length !== otpLength}
                            className="shrink-0 rounded bg-[var(--primary-color)] px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                            {verifying ? "Verifying..." : "Verify"}
                        </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
                        <button type="button" onClick={() => changePhone(phone)} className="underline hover:text-[var(--primary-color)]">
                            Change number
                        </button>
                        <button
                            type="button"
                            onClick={sendOtp}
                            disabled={resendIn > 0 || sending}
                            className="font-semibold text-[var(--primary-color)] disabled:font-normal disabled:text-gray-400"
                        >
                            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : sending ? "Sending..." : "Resend OTP"}
                        </button>
                    </div>

                    {/* Local testing only: backend returns the OTP when SMS_DRIVER=log */}
                    {debugOtp && (
                        <p className="mb-0 mt-1.5 text-[11px] text-amber-700">Test mode (no SMS): OTP is {debugOtp}</p>
                    )}
                </div>
            )}

            {error && <p className="mb-0 text-xs text-red-600">{error}</p>}
            {!verified && step === "idle" && !error && validPhone && (
                <p className="mb-0 text-[11px] text-gray-500">Verify your number with OTP to submit.</p>
            )}
        </div>
    );
}
