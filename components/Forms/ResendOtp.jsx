"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import { Link, Spinner } from "@heroui/react";
import { resendOtp } from "../../utils/fetchApi";

export default function ResendOtp() {
  const router = useRouter();
  const { email } = router.query;

  if (!router.isReady) return null;   // ✅ ADD THIS
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!email) return null;

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const res = await resendOtp({ email });

    setLoading(false);

    if (!res.status) {
      setError(res.message);
      setTimeout(() => setError(""), 3000);
      return;
    }

    setMessage(res.message);

    setTimeout(() => {
      router.push({
        pathname: "/verifyOtp",
        query: { email },
      });
    }, 3000);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#f4f5fa] px-4 overflow-hidden">
      <div className="bg-white shadow-md rounded-xl py-6 px-4 w-full max-w-md">

        <div className="flex justify-center sm:justify-start mb-4">
          <Link href="/">
            <img src="/assets/img/logo.png" className="h-8" />
          </Link>
        </div>

        <h4 className="text-base font-semibold text-gray-800">
          Resend OTP
        </h4>

        {message && <p className="text-green-600 mt-3">{message}</p>}
        {error && <p className="text-red-500 mt-3">{error}</p>}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full mt-4 bg-[#E87722] text-white py-2 rounded-lg"
        >
          {loading ? <Spinner size="sm" color="white" /> : "RESEND OTP"}
        </button>


      </div>
    </div>
  );
}