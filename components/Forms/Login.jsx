"use client";

import React, { useState } from "react";
import { adminHomePath, hasAdminAccess } from "../../utils/adminPermissions";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import {
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineArrowRight,
} from "react-icons/ai";
import { loginUser } from "@/utils/fetchApi";
import { useUser } from "../../context/UserContext";
import { clearPostLoginRedirect, postLoginRedirect } from "../../utils/postLoginRedirect";

export default function Login() {
  const router = useRouter();
  const { login } = useUser();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    /*
    |--------------------------------------------------------------------------
    | Basic Validation
    |--------------------------------------------------------------------------
    */

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
      /*
      |--------------------------------------------------------------------------
      | Login API Payload
      |--------------------------------------------------------------------------
      */

      const payload = {
        login: form.login.trim(),
        password: form.password,
      };

      const response = await loginUser(payload);

      /*
      |--------------------------------------------------------------------------
      | API Error
      |--------------------------------------------------------------------------
      */

      if (!response?.status) {
        setError(
          response?.message || "Login failed. Please try again."
        );
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Get Login Data
      |--------------------------------------------------------------------------
      */

      const token = response?.data?.token;
      const user = response?.data?.user;

 /*
|--------------------------------------------------------------------------
| Save Authentication Data
|--------------------------------------------------------------------------
*/

if (!token || !user) {
  setError("Invalid login response. Please try again.");
  return;
}

login(user, token);

/*
|--------------------------------------------------------------------------
| Role Based Redirect
|--------------------------------------------------------------------------
*/

// A saved destination (Contact Seller) is only for customers
if (user.role !== "customer") {
  clearPostLoginRedirect();
}

// Super admin / seller / broker / staff with admin role -> admin panel
if (hasAdminAccess(user)) {
  router.push(adminHomePath(user));
  return;
}

if (user.role === "seller") {
  router.push("/seller/dashboard");
  return;
}

if (user.role === "broker") {
  router.push("/broker/dashboard");
  return;
}


/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

router.push(postLoginRedirect() || "/");
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
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(135deg, #f7f8fa 0%, #eef1f5 50%, #e8edf2 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_25px_70px_rgba(0,23,55,0.14)] grid grid-cols-1 lg:grid-cols-2">

        {/* =====================================================
            LEFT SIDE - LOGIN
        ====================================================== */}

        <div className="flex flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 md:px-10 lg:px-12 xl:px-14">

          {/* Logo */}

          <div className="mb-7">
            <Link href="/" className="inline-block">
              <img
                src="/assets/img/logo.png"
                alt="Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Welcome */}

          <div className="mb-6">

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[2px]"
              style={{ color: "#E87722" }}
            >
              Bhoomi Manthan
            </p>

            <h1
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{
                color: "#001737",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              Your next property starts here.
            </h1>

            <p
              className="mt-2 text-sm sm:text-base"
              style={{ color: "#62748E" }}
            >
              Sign in to your account and continue your property journey.
            </p>

          </div>

          {/* API ERROR */}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Login Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email OR Phone */}

            <div>

              <label
                className="mb-2 block text-sm font-semibold"
                style={{ color: "#1A1F36" }}
              >
                Email or Phone Number
              </label>

              <TextField
                name="login"
                type="text"
                value={form.login}
                onChange={handleChange}
                fullWidth
                placeholder="Enter your email or phone number"
                size="small"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AiOutlineMail
                        size={19}
                        style={{ color: "#62748E" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "46px",
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",

                    "& fieldset": {
                      borderColor: "#DCE2E8",
                    },

                    "&:hover fieldset": {
                      borderColor: "#E87722",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#E87722",
                      borderWidth: "1px",
                    },
                  },

                  "& input": {
                    fontSize: "14px",
                    color: "#1A1F36",
                  },

                  "& input::placeholder": {
                    color: "#94A3B8",
                    opacity: 1,
                  },
                }}
              />

            </div>

            {/* Password */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  className="text-sm font-semibold"
                  style={{ color: "#1A1F36" }}
                >
                  Password
                </label>

                <Link
                  href="/forgotPassword"
                  className="text-xs sm:text-sm font-semibold hover:underline"
                  style={{ color: "#E87722" }}
                >
                  Forgot Password?
                </Link>

              </div>

              <TextField
                name="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                size="small"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AiOutlineLock
                        size={19}
                        style={{ color: "#62748E" }}
                      />
                    </InputAdornment>
                  ),

                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        edge="end"
                        size="small"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible
                            size={20}
                            style={{ color: "#62748E" }}
                          />
                        ) : (
                          <AiOutlineEye
                            size={20}
                            style={{ color: "#62748E" }}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "46px",
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",

                    "& fieldset": {
                      borderColor: "#DCE2E8",
                    },

                    "&:hover fieldset": {
                      borderColor: "#E87722",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#E87722",
                      borderWidth: "1px",
                    },
                  },

                  "& input": {
                    fontSize: "14px",
                    color: "#1A1F36",
                  },

                  "& input::placeholder": {
                    color: "#94A3B8",
                    opacity: 1,
                  },
                }}
              />

            </div>

            {/* Remember Me */}

            <div className="flex items-center gap-2 pt-1">

              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 cursor-pointer accent-[#E87722]"
                disabled={loading}
              />

              <label
                htmlFor="remember"
                className="cursor-pointer text-sm"
                style={{ color: "#62748E" }}
              >
                Remember me
              </label>

            </div>

            {/* Sign In */}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: "#E87722",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#d76512";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#E87722";
              }}
            >
              {loading ? (
                <Spinner
                  size="sm"
                  color="white"
                />
              ) : (
                <>
                  Sign In

                  <AiOutlineArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>

            {/* Register */}

            <p
              className="pt-1 text-center text-sm"
              style={{ color: "#62748E" }}
            >
              Don't have an account?{" "}

              <Link
                href="/signUp"
                className="font-semibold hover:underline"
                style={{ color: "#E87722" }}
              >
                Create an account
              </Link>
            </p>

          </form>
        </div>

        {/* =====================================================
            RIGHT SIDE - REAL ESTATE IMAGE
        ====================================================== */}

        <div className="relative hidden overflow-hidden lg:block">

          {/* Background Image */}

          <img
            src="/assets/img/login-real-estate-img.jpg"
            alt="Luxury Real Estate Property"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Simple Overlay */}

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,23,55,0.15) 0%, rgba(0,23,55,0.75) 100%)",
            }}
          />

          {/* Orange Accent */}

          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{
              backgroundColor: "#E87722",
            }}
          />

          {/* Simple Text */}

          <div className="absolute bottom-0 left-0 right-0 p-8 xl:p-10">

            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[2px]"
              style={{
                color: "#E87722",
              }}
            >
              Premium Real Estate
            </p>

            <h2
              className="max-w-lg text-3xl font-bold leading-tight text-white xl:text-4xl"
              style={{
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              Find a place

              <span
                className="block"
                style={{
                  color: "#E87722",
                }}
              >
                you'll love to call home.
              </span>
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
              Discover beautiful properties in locations that match
              your lifestyle and aspirations.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
