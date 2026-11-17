"use client";
import NextLink from "next/link";

import { useEffect, useState } from "react";
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiX,
  FiLogIn,
  FiShield,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiPlusCircle,
} from "react-icons/fi";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/utils/fetchApi";
import { useUser } from "../../context/UserContext";
import { adminHomePath, hasAdminAccess } from "../../utils/adminPermissions";

// Post Property button kahan le jaye (guest ko seller login par bhej rahe hain)
const POST_PROPERTY_HREF = "/login";

// Popup band karne ke baad 24 ghante tak auto-open nahi hoga
const DISMISS_KEY = "loginPopupDismissedAt";
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

const wasDismissedRecently = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION;
  } catch {
    return false;
  }
};

const markDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // storage unavailable — ignore
  }
};

export default function StickyLoginForm() {
  const router = useRouter();
  const { login, user, accessToken } = useUser();

  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({
    login: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Automatically open only when the user is NOT logged in.
  useEffect(() => {
    if (user || accessToken) {
      setOpen(false);
      return;
    }

    // Agar user ne pichhle 24 ghante me popup band kiya tha to auto-open mat karo
    if (wasDismissedRecently()) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [user, accessToken]);

  // User ne popup khud band kiya — time save karo
  const dismissPopup = () => {
    if (loading) return;
    markDismissed();
    setOpen(false);
  };

  // Close popup using Escape key.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        markDismissed();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Login and redirect.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!form.login.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        login: form.login.trim(),
        password: form.password,
      });

      if (!response?.status) {
        setError(response?.message || "Login failed. Please try again.");
        return;
      }

      const token = response?.data?.token;
      const loggedInUser = response?.data?.user;

      if (!token || !loggedInUser) {
        setError("Invalid login response. Please try again.");
        return;
      }

      // Save the user and token in your existing UserContext.
      login(loggedInUser, token);

      // Close the popup immediately.
      setOpen(false);

      // Navigate according to the user's role.
      let dashboard = "/";

      switch (hasAdminAccess(loggedInUser) ? "admin_panel" : loggedInUser.role) {
        case "seller":
          dashboard = "/seller/dashboard";
          break;

        case "broker":
          dashboard = "/broker/dashboard";
          break;

        case "admin_panel":
          dashboard = adminHomePath(loggedInUser);
          break;

        default:
          dashboard = "/";
      }

      // Replace the current route and navigate immediately.
      router.replace(dashboard);
    } catch (err) {
      setError(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Do not render anything when the user is already logged in.
  if (user || accessToken) {
    return null;
  }

  return (
    <>
      {/* Login Popup */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              dismissPopup();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-[loginPopup_0.4s_ease-out]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={dismissPopup}
              disabled={loading}
              aria-label="Close login popup"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:rotate-90 hover:bg-white hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX className="text-xl" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Left Design Section */}
              <div className="relative hidden min-h-[520px] overflow-hidden bg-gradient-to-br from-[var(--primary-color)] via-[#102c50] to-[var(--secondary-color)] p-10 text-white md:flex md:flex-col md:justify-between">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[35px] border-white/5" />
                <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border-[45px] border-white/5" />
                <div className="absolute right-10 top-44 h-20 w-20 rounded-full bg-orange-400/10 blur-xl" />

                <div className="relative z-10">
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                    <FiShield className="text-3xl text-orange-300" />
                  </div>

                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                    Bhoomi Manthan
                  </p>

                  <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
                    Your next property starts here.
                  </h2>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
                    Login to save favourites, compare listings and
                    contact owners.
                  </p>
                </div>

                <div className="relative z-10 space-y-4">
                  {[
                    "Secure account access",
                    "Personalized experience",
                    "Everything in one place",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-400/20 text-orange-300">
                        <FiCheck className="text-sm" />
                      </span>

                      <span className="text-sm text-slate-200">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Login Form */}
              <div className="flex flex-col justify-center px-6 py-12 sm:px-10 md:px-9 lg:px-12">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary-color)] md:hidden">
                  <FiLogIn className="text-2xl" />
                </div>

                <div className="mb-8">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[var(--primary-color)]">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    MEMBER LOGIN
                  </div>

                  <h2
                    id="login-title"
                    className="text-3xl font-bold tracking-tight text-slate-900"
                  >
                    Sign in to your account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your details to continue to Bhoomi Manthan.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="sticky-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email or Phone Number
                    </label>

                    <div className="group relative">
                      <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition group-focus-within:text-[var(--primary-color)]" />

                      <input
                        id="sticky-email"
                        name="login"
                        type="text"
                        value={form.login}
                        onChange={handleChange}
                        autoComplete="username"
                        placeholder="Enter your email or phone number"
                        required
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary-color)] focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label
                        htmlFor="sticky-password"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <NextLink
                        href="/forgotPassword"
                        className="text-xs font-semibold text-[var(--primary-color)] transition hover:underline"
                      >
                        Forgot Password?
                      </NextLink>
                    </div>

                    <div className="group relative">
                      <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition group-focus-within:text-[var(--primary-color)]" />

                      <input
                        id="sticky-password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary-color)] focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        disabled={loading}
                        className="h-4 w-4 cursor-pointer accent-orange-600"
                      />
                      Remember me
                    </label>

                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <FiShield />
                      Secure login
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-900/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--secondary-color)] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          size="sm"
                          color="white"
                          aria-label="Logging in"
                        />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 text-center">
                  <p className="text-sm text-slate-500">
                    Don't have an account?{" "}
                    <NextLink
                      href="/signUp"
                      className="inline-flex items-center gap-1 font-bold text-[var(--primary-color)] hover:underline"
                    >
                      Create an account
                      <FiUserPlus />
                    </NextLink>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating buttons: Post Property + Login */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open login popup"
            className="flex items-center gap-2 rounded-full bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1 hover:bg-[var(--secondary-color)]"
          >
            <FiLogIn className="text-lg" />
            Login
          </button>

          <NextLink
            href={POST_PROPERTY_HREF}
            aria-label="Post your property for free"
            className="flex items-center gap-2 no-underline hover:no-underline rounded-full bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1 hover:bg-[var(--secondary-color)]"
          >
            <FiPlusCircle className="text-lg" />
            Post Property Free
          </NextLink>
        </div>
      )}

      {/* Popup Animation */}
      <style jsx global>{`
        @keyframes loginPopup {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}