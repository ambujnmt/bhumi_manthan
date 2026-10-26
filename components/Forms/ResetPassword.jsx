
"use client";

import React, { useEffect, useState } from "react";
import { Link, Button } from "@heroui/react";
import { TextField, InputAdornment } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FiLock,
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { resetPassword } from "../../utils/fetchApi";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, router]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!token || !email) {
      setErrorMessage(
        "This reset link is invalid. Please request a new password reset link."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        setPassword("");
        setConfirmPassword("");
        setSuccessMessage(
          response.data?.message ||
            "Password reset successful. Please log in with your new password."
        );
      } else {
        setErrorMessage(
          response.data?.message ||
            "Unable to reset your password. Please try again."
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
              <FiLock size={34} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
              Account Security
            </p>

            <h1 className="max-w-sm text-4xl font-bold leading-tight lg:text-5xl">
              Create your new password.
            </h1>

            <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
              Choose a strong password to help keep your Bhoomi Manthan
              account and property journey secure.
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
                  src="/assets/img/logo.png"
                  alt="Bhoomi Manthan"
                  className="h-12 max-w-48 object-contain"
                />
              </Link>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#E87722]">
                <FiLock size={28} />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#E87722]">
                Password Recovery
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Reset password
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create a new password for your account. Enter it below and
                confirm it to finish resetting your password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <TextField
                fullWidth
                required
                label="New Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading || !!successMessage}
                slotProps={{
                  htmlInput: { minLength: 8, maxLength: 255 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiLock color="#94A3B8" size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="text-slate-500"
                        >
                          {showPassword ? (
                            <FiEyeOff size={19} />
                          ) : (
                            <FiEye size={19} />
                          )}
                        </button>
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
                    { borderColor: "#E87722" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#E87722",
                  },
                }}
              />

              <TextField
                fullWidth
                required
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading || !!successMessage}
                slotProps={{
                  htmlInput: { minLength: 8, maxLength: 255 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiLock color="#94A3B8" size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((v) => !v)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="text-slate-500"
                        >
                          {showConfirmPassword ? (
                            <FiEyeOff size={19} />
                          ) : (
                            <FiEye size={19} />
                          )}
                        </button>
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
                    { borderColor: "#E87722" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#E87722",
                  },
                }}
              />

              {successMessage && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700"
                >
                  <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
                  <p>{successMessage} Redirecting to login...</p>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#E87722] text-base font-semibold text-white shadow-lg shadow-orange-200/60 transition hover:bg-[#cf671b]"
                isLoading={loading}
                isDisabled={loading || !!successMessage}
              >
                {loading ? "Resetting password..." : "Reset Password"}
              </Button>

              <p className="text-center text-xs leading-5 text-slate-500">
                After resetting your password, you can sign in using your
                new password.
              </p>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#E87722]"
              >
                <FiArrowLeft size={18} />
                Back to Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
