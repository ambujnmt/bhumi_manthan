
"use client";

import React, { useState, useEffect } from "react";
import { Link, Button } from "@heroui/react";
import { TextField, InputAdornment } from "@mui/material";
import {
  FiMail,
  FiLock,
  FiArrowLeft,
} from "react-icons/fi";
import { forgotPassword } from "@/utils/fetchApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {
  if (!successMessage) return;

  const timer = setTimeout(() => {
    setSuccessMessage("");
    setEmail("");
  }, 3000);

  return () => clearTimeout(timer);
}, [successMessage]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(trimmedEmail);

      if (response.success) {
        setSuccessMessage(
          response.data.message 
        );
      } else {
        setErrorMessage(
          response.data?.message
        );
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 md:grid-cols-2">
        {/* Left panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#001737] p-10 text-white md:flex lg:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-white/10" />

          <Link href="/" className="relative z-10 inline-flex w-fit">
            <img
              src="/assets/img/logo.png"
              alt="Bhoomi Manthan"
              className="h-12 max-w-48 object-contain brightness-0 invert"
            />
          </Link>

          <div className="relative z-10 py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <FiLock sx={{ fontSize: 34 }} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
              Account Recovery
            </p>

            <h1 className="max-w-sm text-4xl font-bold leading-tight lg:text-5xl">
              Let&apos;s get you back on track.
            </h1>

            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              Forgot your password? No worries. We&apos;ll help you securely
              regain access to your Bhoomi Manthan account.
            </p>
          </div>

          <p className="relative z-10 text-sm text-slate-400">
            Your property journey starts here.
          </p>
        </section>

        {/* Right panel */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-9 flex justify-center md:hidden">
              <Link href="/">
                <img
                  src="/assets/Images/logo.avif"
                  alt="Bhoomi Manthan"
                  className="h-12 max-w-48 object-contain"
                />
              </Link>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#E87722]">
                <FiLock sx={{ fontSize: 28 }} />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#E87722]">
                Password Recovery
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Forgot password?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter the email address associated with your account. We&apos;ll
                send you a secure link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <TextField
                fullWidth
                required
                label="Email Address"
                type="email"
                variant="outlined"
                size="medium"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                slotProps={{
                  htmlInput: {
                    maxLength: 255,
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiMail 
                          sx={{ color: "#94A3B8", fontSize: 21 }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#fff",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#E87722",
                    },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#E87722",
                  },
                }}
              />

              {successMessage && (
                <div
                  role="status"
                  className="flex items-start  text-green-600"
                >
             
                  <p>{successMessage}</p>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className=" text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#E87722] text-base font-semibold text-white shadow-lg shadow-orange-200/60 transition hover:bg-[#cf671b]"
                isLoading={loading}
                isDisabled={loading}
              >
                {loading ? "Sending reset link..." : "Send Reset Link"}
              </Button>

              <p className="text-center text-xs leading-5 text-slate-500">
                If an account exists with this email, you&apos;ll receive
                instructions to reset your password.
              </p>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#E87722]"
              >
                <FiArrowLeft sx={{ fontSize: 18 }} />
                Back to Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
