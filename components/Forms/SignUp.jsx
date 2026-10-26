 "use client";

import React, { useState } from "react";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineUser,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineLock,
  AiOutlineShop,
} from "react-icons/ai";
import { FaTimesCircle } from "react-icons/fa";
import { registerUser } from "@/utils/fetchApi";

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsUnlocked, setTermsUnlocked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
    },
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear API message
    if (apiMessage) {
      setApiMessage("");
      setMessageType("");
    }
  };

  // ==========================================
  // ROLE CHANGE
  // ==========================================
  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
    }));

    if (errors.role) {
      setErrors((prev) => ({
        ...prev,
        role: "",
      }));
    }

    if (apiMessage) {
      setApiMessage("");
      setMessageType("");
    }
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================
  const validate = () => {
    const temp = {};

    if (!form.name.trim()) {
      temp.name = "Name is required";
    }

    if (!form.email.trim()) {
      temp.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      temp.email = "Enter a valid email";
    }

    if (!form.phone.trim()) {
      temp.phone = "Phone number is required";
    }

    if (!form.role) {
      temp.role = "Please select your account type";
    }

    if (!form.password) {
      temp.password = "Password is required";
    } else if (form.password.length < 6) {
      temp.password =
        "Password must be at least 6 characters";
    }

    if (!form.terms) {
      temp.terms =
        "You must agree to the Terms & Conditions";
    }

    setErrors(temp);

    return Object.keys(temp).length === 0;
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setApiMessage("");
    setMessageType("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        terms: form.terms,
      };

      const response = await registerUser(payload);

      // ==========================================
      // API ERROR
      // ==========================================
      if (!response?.status) {
        const apiErrors = response?.errors || {};
        const formattedErrors = {};

        if (apiErrors.email?.length) {
          formattedErrors.email =
            apiErrors.email[0];
        }

        if (apiErrors.phone?.length) {
          formattedErrors.phone =
            apiErrors.phone[0];
        }

        if (apiErrors.name?.length) {
          formattedErrors.name =
            apiErrors.name[0];
        }

        if (apiErrors.password?.length) {
          formattedErrors.password =
            apiErrors.password[0];
        }

        if (apiErrors.role?.length) {
          formattedErrors.role =
            apiErrors.role[0];
        }

        if (apiErrors.terms?.length) {
          formattedErrors.terms =
            apiErrors.terms[0];
        }

        setErrors((prev) => ({
          ...prev,
          ...formattedErrors,
        }));

        setApiMessage(
          response?.message ||
            "Registration failed. Please try again."
        );

        setMessageType("error");

        return;
      }

      // ==========================================
      // REGISTRATION SUCCESS
      // ==========================================
      setApiMessage(response?.message);
      setMessageType("success");

      // Get registered email from API response
      const registeredEmail =
        response?.data?.user?.email ||
        form.email.trim();

      // Store email internally for OTP verification
      sessionStorage.setItem(
        "otp_email",
        registeredEmail
      );

      // Store selected role temporarily if needed later
      sessionStorage.setItem(
        "otp_role",
        response?.data?.user?.role ||
          form.role
      );

      // Go to OTP page
      setTimeout(() => {
        router.push("/verifyOtp");
      }, 1000);

    } catch (error) {
      setApiMessage(
        "Something went wrong. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLOSE TERMS
  // ==========================================
  const closeTerms = () => {
    setShowTermsModal(false);
    setTermsUnlocked(true);
  };

  // ==========================================
  // ROLE CARD
  // ==========================================
  const roleCard = (
    role,
    title,
    description,
    icon
  ) => (
    <button
      type="button"
      onClick={() => handleRoleChange(role)}
      disabled={loading}
      className={`relative text-left rounded-xl border p-3 transition-all duration-200 ${
        form.role === role
          ? "border-[#E87722] bg-[#E87722]/5 shadow-sm"
          : "border-gray-200 bg-white hover:border-[#E87722]/50"
      } ${
        loading
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between">

        <div className="min-w-0">

          {/* ICON */}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
              form.role === role
                ? "bg-[#E87722] text-white"
                : "bg-[#001737]/5 text-[#001737]"
            }`}
          >
            {icon}
          </div>

          {/* TITLE */}
          <p className="text-sm font-semibold text-[#001737]">
            {title}
          </p>

          {/* DESCRIPTION */}
          <p className="text-xs text-[#62748E] mt-1 leading-4">
            {description}
          </p>

        </div>

        {/* SELECTED CHECK */}
        {form.role === role && (
          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E87722] text-white flex items-center justify-center text-xs">
            ✓
          </span>
        )}

      </div>
    </button>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f8fafc] via-[#eef2f7] to-[#f8fafc] font-['Inter']">

      {/* ==========================================
          MAIN CARD
      ========================================== */}
      <div className="w-full max-w-[1050px] bg-white rounded-2xl overflow-hidden shadow-[0_15px_50px_rgba(0,23,55,0.12)] flex flex-col lg:flex-row">

        {/* ==========================================
            LEFT SIDE
        ========================================== */}
        <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#001737]">

          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border border-white/10" />

          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-white/10" />

          <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-[#E87722]/10" />

          <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">

            {/* LOGO */}
            <Link href="/">
              <img
                src="/assets/img/logo.png"
                alt="Logo"
                className="h-auto w-64 object-contain brightness-0 invert"
              />
            </Link>

            {/* CONTENT */}
            <div className="my-auto py-16">

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-6">

                <span className="w-2 h-2 rounded-full bg-[#E87722]" />

                <span className="text-white/80 text-xs font-medium tracking-wide">
                  YOUR PROPERTY JOURNEY STARTS HERE
                </span>

              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight font-['Montserrat']">

                Find a place
                <br />

                <span className="text-[#E87722]">
                  you'll love.
                </span>

              </h1>

              <p className="text-white/65 text-sm xl:text-base leading-7 mt-6 max-w-[420px]">
                Create your account and discover properties,
                connect with trusted brokers, and make your
                next real estate move with confidence.
              </p>

              {/* FEATURES */}
              <div className="mt-8 space-y-4">

                {[
                  "Discover properties that match your needs",
                  "Connect with trusted real estate professionals",
                  "Manage your real estate journey in one place",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-3"
                  >

                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">

                      <span className="text-[#E87722] text-sm">
                        ✓
                      </span>

                    </div>

                    <span className="text-white/80 text-sm">
                      {text}
                    </span>

                  </div>
                ))}

              </div>

            </div>

            <div className="text-white/40 text-xs">
              © {new Date().getFullYear()} All rights reserved.
            </div>

          </div>
        </div>

        {/* ==========================================
            RIGHT SIDE
        ========================================== */}
        <div className="w-full lg:w-[54%] p-6 sm:p-8 lg:p-10 xl:p-12">

          {/* MOBILE LOGO */}
          <div className="flex lg:hidden justify-center mb-7">

            <Link href="/">
              <img
                src="/assets/img/logo.png"
                alt="Logo"
                className="h-9 w-auto object-contain"
              />
            </Link>

          </div>

          {/* HEADER */}
          <div className="mb-7">

            <div className="flex items-center gap-2 mb-3">

              <span className="w-8 h-[3px] rounded-full bg-[#E87722]" />

              <span className="text-[#E87722] text-xs font-semibold uppercase tracking-wider">
                Get Started
              </span>

            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#001737] font-['Montserrat']">
              Create your account
            </h2>

            <p className="text-[#62748E] text-sm mt-2">
              Join our real estate platform and get started today.
            </p>

          </div>

          {/* API MESSAGE */}
          {apiMessage && (
            <div
              className={`mb-5 text-sm ${
                messageType === "success"
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >

              <div className="flex items-start gap-2">

                <span className="font-semibold">
                  {messageType === "success"
                    ? "✓"
                    : "!"}
                </span>

                <span>{apiMessage}</span>

              </div>

            </div>
          )}

          {/* ==========================================
              FORM
          ========================================== */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}
            <TextField
              label="Full Name"
              name="name"
              size="small"
              fullWidth
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AiOutlineUser
                      className="text-[#62748E]"
                      size={19}
                    />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* EMAIL + PHONE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <TextField
                label="Email Address"
                name="email"
                type="email"
                size="small"
                fullWidth
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AiOutlineMail
                        className="text-[#62748E]"
                        size={19}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <TextField
                label="Phone Number"
                name="phone"
                size="small"
                fullWidth
                value={form.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AiOutlinePhone
                        className="text-[#62748E]"
                        size={19}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

            </div>

            {/* ==========================================
                ACCOUNT TYPE
            ========================================== */}
            <div>

              <label className="block text-sm font-medium text-[#1A1F36] mb-2">
                I want to join as
              </label>

              {/* 3 PUBLIC ROLES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* CUSTOMER */}
                {roleCard(
                  "customer",
                  "Customer",
                  "Looking for properties",
                  <AiOutlineUser size={19} />
                )}

                {/* SELLER */}
                {roleCard(
                  "seller",
                  "Seller",
                  "Selling properties",
                  <AiOutlineShop size={19} />
                )}

                {/* BROKER */}
                {roleCard(
                  "broker",
                  "Broker",
                  "Listing properties",
                  <span className="text-sm font-bold">
                    B
                  </span>
                )}

              </div>

              {errors.role && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.role}
                </p>
              )}

            </div>

            {/* PASSWORD */}
            <TextField
              label="Password"
              name="password"
              size="small"
              fullWidth
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AiOutlineLock
                      className="text-[#62748E]"
                      size={19}
                    />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">

                    <IconButton
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      edge="end"
                      disabled={loading}
                    >

                      {showPassword ? (
                        <AiOutlineEyeInvisible />
                      ) : (
                        <AiOutlineEye />
                      )}

                    </IconButton>

                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* TERMS */}
            <div>

              <div className="flex items-start gap-2">

                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  disabled={
                    !termsUnlocked ||
                    loading
                  }
                  className={`mt-1 h-4 w-4 accent-[#E87722] ${
                    !termsUnlocked || loading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                />

                <p className="text-xs sm:text-sm text-[#62748E] leading-5">

                  I agree to the{" "}

                  <button
                    type="button"
                    onClick={() =>
                      setShowTermsModal(true)
                    }
                    disabled={loading}
                    className="text-[#E87722] font-medium hover:underline disabled:opacity-50"
                  >
                    Terms & Conditions
                  </button>{" "}

                  and acknowledge the Privacy Policy.

                </p>

              </div>

              {errors.terms && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.terms}
                </p>
              )}

            </div>

            {/* SIGN UP */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-lg bg-[#E87722] text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:shadow-lg hover:-translate-y-[1px]"
              }`}
            >

              {loading ? (
                <Spinner
                  size="sm"
                  color="white"
                />
              ) : (
                "CREATE ACCOUNT"
              )}

            </button>

            {/* LOGIN */}
            <p className="text-center text-sm text-[#62748E] pt-1">

              Already have an account?{" "}

              <Link
                href="/login"
                className="text-[#E87722] font-semibold hover:underline"
              >
                Login
              </Link>

            </p>

          </form>
        </div>
      </div>

      {/* ==========================================
          TERMS MODAL
      ========================================== */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-[#001737]/70 flex justify-center items-center z-50 px-4">

          <div className="bg-white w-full max-w-[650px] max-h-[85vh] rounded-xl shadow-2xl relative overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b">

              <div>

                <p className="text-xs text-[#E87722] font-semibold uppercase tracking-wide">
                  Legal
                </p>

                <h2 className="text-lg font-bold text-[#001737] mt-1">
                  Terms & Conditions
                </h2>

              </div>

              <button
                type="button"
                onClick={closeTerms}
                className="text-[#62748E] hover:text-[#001737] transition"
              >
                <FaTimesCircle size={21} />
              </button>

            </div>

            {/* CONTENT */}
            <div className="overflow-y-auto max-h-[60vh] px-5 py-5 text-sm text-[#62748E] leading-7">

              <p className="mb-4">
                Welcome to our real estate platform. By
                creating an account, you agree to use the
                platform responsibly and comply with the
                applicable terms and conditions.
              </p>

              <h3 className="font-semibold text-[#001737] mb-2">
                1. Account Registration
              </h3>

              <p className="mb-4">
                You are responsible for providing accurate
                information when creating your account and
                for keeping your login credentials secure.
              </p>

              <h3 className="font-semibold text-[#001737] mb-2">
                2. Property Information
              </h3>

              <p className="mb-4">
                Property information displayed on the
                platform may be provided by customers,
                brokers, or other authorized parties. Users
                should verify property details before making
                any transaction or commitment.
              </p>

              <h3 className="font-semibold text-[#001737] mb-2">
                3. User Responsibilities
              </h3>

              <p className="mb-4">
                Users agree not to provide misleading
                information, misuse the platform, or engage
                in activities that may negatively affect
                other users or the platform.
              </p>

              <h3 className="font-semibold text-[#001737] mb-2">
                4. Privacy
              </h3>

              <p>
                Your information will be handled according
                to the platform's privacy practices and
                applicable laws.
              </p>

            </div>

            {/* FOOTER */}
            <div className="border-t px-5 py-4 flex justify-end">

              <button
                type="button"
                onClick={closeTerms}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#001737]"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
