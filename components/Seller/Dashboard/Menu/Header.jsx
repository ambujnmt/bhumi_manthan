"use client";

import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineLogout } from "react-icons/md";
import { Button, Link, useDisclosure } from "@heroui/react";
import Tmodal from "../../../Tmodal/Tmodal";
import { SlCalender } from "react-icons/sl";
import { useUser } from "../../../../context/UserContext";
import { useRouter } from "next/router";

export default function Header({ menuOpen, toggleMenu }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { user, logout, authLoading } = useUser();
  const router = useRouter();

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // ------------------------------------------------
  // USER DATA
  // ------------------------------------------------

  const userId = user?.id;
  const userName = user?.name || "Seller";
  const userEmail = user?.email || "";
  const userPhone = user?.phone || "";

  const userAvatar =
    user?.profile_image ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=001737&color=ffffff`;

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

 const handleLogout = async () => {
  setLoading(true);
  setSuccessMessage("");

  try {
    // Clear authentication immediately
    logout();

    // Close logout modal
    onClose();

    // Go to login immediately
    router.replace("/login");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setLoading(false);
  }
};

  // ------------------------------------------------
  // AUTH LOADING
  // ------------------------------------------------

  if (authLoading) {
    return null;
  }

  return (
    <>
      <header
        className="
          sticky
          top-0
          z-50
          flex
          w-full
          items-center
          justify-between
          gap-3
          border-b
          border-gray-100
          bg-white
          px-3
          py-2.5
          shadow-[0_2px_12px_rgba(0,23,55,0.06)]
          sm:px-5
        "
      >
        {/* ================= MOBILE MENU ================= */}

        <button
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-[#001737]
            transition-all
            duration-200
            hover:bg-orange-50
            hover:text-[#E87722]
            active:scale-95
            lg:hidden
          "
        >
          {menuOpen ? (
            <RxCross2 className="h-5 w-5" />
          ) : (
            <FaBars className="h-4 w-4" />
          )}
        </button>

        {/* ================= LEFT SECTION ================= */}

        <div className="flex min-w-0 flex-1 items-center">
          <p className="mb-0 hidden truncate px-2 text-sm font-semibold text-[#1A1F36] sm:block">
            {userName}
          </p>
        </div>

        {/* ================= RIGHT SECTION ================= */}

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Date */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border
              border-gray-100
              bg-gray-50
              px-3
              py-2
              md:flex
            "
          >
            <SlCalender className="h-4 w-4 text-[#E87722]" />

            <span className="text-xs font-medium text-[#62748E]">
              Today:
            </span>

            <span className="text-xs font-semibold text-[#1A1F36]">
              {formattedDate}
            </span>
          </div>

          <div className="hidden h-8 w-px bg-gray-100 sm:block" />

          {/* User Profile */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
              }}
              aria-label="Open profile menu"
              className="
                flex
                items-center
                justify-center
                rounded-full
                p-0.5
                transition-all
                duration-200
                hover:ring-2
                hover:ring-orange-100
                active:scale-95
              "
            >
              <img
                src={userAvatar}
                alt={userName}
                className="
                  h-9
                  w-9
                  rounded-full
                  border-2
                  border-white
                  object-cover
                  shadow-sm
                  sm:h-10
                  sm:w-10
                "
              />
            </button>

            {/* ================= USER DROPDOWN ================= */}

            {dropdownOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-3
                  w-60
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-100
                  bg-white
                  shadow-[0_10px_40px_rgba(0,23,55,0.15)]
                "
              >
                {/* Dropdown Header */}

                <div className="bg-[#001737] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="
                        h-9
                        w-9
                        rounded-full
                        border
                        border-white/20
                        object-cover
                      "
                    />

                    <div className="min-w-0">
                      <p className="mb-0 truncate text-sm font-semibold text-white">
                        {userName}
                      </p>

                      <p className="mb-0 text-[11px] capitalize text-white/60">
                        Seller
                      </p>
                    </div>
                  </div>
                </div>

                {/* My Account */}

                <Link
                  href={`/seller/profile/${userId}`}
                  onClick={() => setDropdownOpen(false)}
                  className="
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-[#1A1F36]
                    transition-all
                    duration-200
                    hover:bg-orange-50
                    hover:text-[#E87722]
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-orange-50
                    "
                  >
                    <FaRegUser className="h-4 w-4 text-[#E87722]" />
                  </span>

                  <span>My Account</span>
                </Link>

                <div className="mx-3 border-t border-gray-100" />

                {/* Logout */}

                <Button
                  onPress={() => {
                    setDropdownOpen(false);
                    setSuccessMessage("");
                    onOpen();
                  }}
                  className="
                    flex
                    h-auto
                    w-full
                    items-center
                    justify-start
                    gap-3
                    rounded-none
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-[#1A1F36]
                    shadow-none
                    transition-all
                    duration-200
                    hover:bg-red-50
                    hover:text-red-500
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-red-50
                    "
                  >
                    <MdOutlineLogout className="h-4 w-4 text-red-500" />
                  </span>

                  <span>Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= LOGOUT MODAL ================= */}

      <Tmodal
        isOpen={isOpen}
        onClose={onClose}
        title="Are you sure you want to logout?"
        footer={
          successMessage ? (
            <p className="px-2 py-1 font-medium text-green-600">
              {successMessage}
            </p>
          ) : (
            <>
              <Button
                variant="light"
                onPress={onClose}
                className="
                  font-medium
                  text-[#62748E]
                  hover:bg-gray-100
                "
              >
                Cancel
              </Button>

              <Button
                isLoading={loading}
                onPress={handleLogout}
                className="
                  bg-[#E87722]
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:bg-[#d96b19]
                "
              >
                Confirm
              </Button>
            </>
          )
        }
      />
    </>
  );
}