"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link, Spinner } from "@heroui/react";
import { verifyOtp } from "../../utils/fetchApi";

export default function VerifyOtp() {
    const router = useRouter();

    // Email stored internally from Signup page
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    // ==========================================
    // GET EMAIL FROM SESSION STORAGE
    // ==========================================
    useEffect(() => {
        const storedEmail = sessionStorage.getItem("otp_email");

        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            setError(
                "Email not found. Please register again."
            );
        }
    }, []);

    // ==========================================
    // OTP INPUT CHANGE
    // ==========================================
    const handleChangeOtp = (value, index) => {
        // Allow only one digit
        if (!/^[0-9]?$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;

        setOtp(newOtp);
        setError("");
        setMessage("");

        // Move to next input automatically
        if (value && index < 5) {
            const nextInput = document.getElementById(
                `otp-${index + 1}`
            );

            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    // ==========================================
    // BACKSPACE HANDLING
    // ==========================================
    const handleKeyDown = (e, index) => {
        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            const previousInput = document.getElementById(
                `otp-${index - 1}`
            );

            if (previousInput) {
                previousInput.focus();
            }
        }
    };

    // ==========================================
    // OTP SUBMIT
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) {
            return;
        }

        setError("");
        setMessage("");

        // Make sure email exists
        if (!email) {
            setError(
                "Email not found. Please register again."
            );
            return;
        }

        // Combine all 6 OTP digits
        const finalOtp = otp.join("");

        // Validate OTP length
        if (finalOtp.length !== 6) {
            setError("OTP must be 6 digits.");
            return;
        }

        setLoading(true);

        try {
            // ==========================================
            // SEND EMAIL + OTP TO API
            // ==========================================
            const res = await verifyOtp({
                email: email,
                otp: finalOtp,
            });

            // ==========================================
            // API ERROR
            // ==========================================
            if (!res?.status) {
                setError(
                    res?.message ||
                    "OTP verification failed. Please try again."
                );

                // Clear error after 3 seconds
                setTimeout(() => {
                    setError("");
                }, 3000);

                return;
            }

            // ==========================================
            // SUCCESS
            // ==========================================
            setMessage(
                res?.message ||
                "Email verified successfully."
            );

            // Remove temporary registration email
            // because OTP verification is completed
            sessionStorage.removeItem("otp_email");

            // Go to login page
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (error) {
            setError(
                error?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#f4f5fa] px-4 overflow-hidden">

            <div className="bg-white shadow-md rounded-xl py-6 px-4 w-full max-w-md">

                {/* ==========================================
                    LOGO
                ========================================== */}
                <div className="flex justify-center sm:justify-start mb-4">
                    <Link href="/">
                        <img
                            src="/assets/img/logo.png"
                            alt="logo"
                            className="h-auto w-64 object-contain"
                        />
                    </Link>
                </div>

                {/* ==========================================
                    HEADING
                ========================================== */}
                <h4 className="text-base font-semibold text-gray-800 text-center sm:text-left">
                    Verify OTP
                </h4>

                <p className="text-gray-500 text-sm mt-1 text-center sm:text-left">
                    Enter the 6-digit code sent to your email
                </p>

                {/* ==========================================
                    EMAIL DISPLAY
                ========================================== */}
                {email && (
                    <p className="text-gray-600 text-sm mt-3 text-center sm:text-left">
                        OTP sent to{" "}
                        <span className="font-medium text-[#001737]">
                            {email}
                        </span>
                    </p>
                )}

                {/* ==========================================
                    SUCCESS MESSAGE
                ========================================== */}
                {message && (
                    <p className="text-green-600 text-sm mt-3 text-center font-medium">
                        {message}
                    </p>
                )}

                {/* ==========================================
                    ERROR MESSAGE
                ========================================== */}
                {error && (
                    <p className="text-red-500 text-sm mt-3 text-center font-medium">
                        {error}
                    </p>
                )}

                {/* ==========================================
                    OTP FORM
                ========================================== */}
                <form
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-4"
                >

                    {/* OTP INPUTS */}
                    <div className="flex justify-between gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                disabled={loading}
                                autoComplete="one-time-code"
                                onChange={(e) =>
                                    handleChangeOtp(
                                        e.target.value,
                                        index
                                    )
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(
                                        e,
                                        index
                                    )
                                }
                                className="w-10 h-12 border border-gray-300 rounded-lg text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#0057b7] focus:border-[#0057b7] disabled:bg-gray-100"
                            />
                        ))}
                    </div>

                    {/* ==========================================
                        VERIFY BUTTON
                    ========================================== */}
                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-[#E87722] hover:bg-[#d96b1d] text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <Spinner
                                size="sm"
                                color="white"
                            />
                        ) : (
                            "VERIFY OTP"
                        )}
                    </button>

                    {/* ==========================================
                        RESEND OTP
                    ========================================== */}
                    {email && (
                        <div className="text-center mt-3">
                            <Link
                                href="/resendOtp"
                                className="text-[#0057b7]"
                            >
                                Resend OTP
                            </Link>
                        </div>
                    )}

                    {/* ==========================================
                        BACK TO LOGIN
                    ========================================== */}
                    <div className="text-center mt-3">
                        <Link
                            href="/login"
                            className="text-sm text-gray-500 hover:text-[#001737]"
                        >
                            Back to Login
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
}
