"use client";

import { Link } from "@heroui/react";
import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { useUser } from "../../../context/UserContext";
import { useRouter } from "next/router";
import useSiteLogo from "../../../utils/useSiteLogo";
import { adminHomePath, hasAdminAccess } from "../../../utils/adminPermissions";

export default function Header() {
  const router = useRouter();
  const siteLogo = useSiteLogo();

  const {
    user,
    logout,
    authLoading,
  } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
/* ---------- desktop dropdown states ---------- */
  const [admissionsOpen, setAdmissionsOpen] = useState(false);
  const [admissiontabOpen, setAdmissiontabOpen] = useState(false);
  const [newprojectsOpen, setNewprojectsOpen] = useState(false);
  const [commercialOpen, setCommercialOpen] = useState(false);
  const [learnerOpen, setLearnerOpen] = useState(false);  
  const [moreOpen, setMoreOpen] = useState(false);  
 
  /* ---------- hover-close timers (desktop) ---------- */
  const admissionsTimer = useRef(null);
  const admissiontabTimer = useRef(null);
  const newprojectsTimer = useRef(null);
  const commercialTimer = useRef(null);
  const learnerTimer = useRef(null);
  const moreTimer = useRef(null);

  const getDashboardPath = () => {
    if (!user) {
      return "/login";
    }

    if (hasAdminAccess(user)) {
      return adminHomePath(user);
    }

    if (user.role === "seller") {
      return "/seller/dashboard";
    }

    if (user.role === "broker") {
      return "/broker/dashboard";
    }

    return "/";
  };


  const getDashboardLabel = () => {
    if (hasAdminAccess(user)) {
      return "Admin Dashboard";
    }

    if (user?.role === "seller") {
      return "Seller Dashboard";
    }

    if (user?.role === "broker") {
      return "Broker Dashboard";
    }

    // return "Profile";
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);


  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // ============== This is for mobile dropdown ==============
  {/* Single state for main tabs — sirf ek hi khula rahega */ }
  const [openMainTab, setOpenMainTab] = useState(null);
  // possible values: 'about', 'cdoe', 'academics', 'programs', 'admission', 'learner'

  const toggleMainTab = (tab) => {
    setOpenMainTab((prev) => (prev === tab ? null : tab));
  };

  {/* Nested accordion states (in "about mit adt" section) */ }
  const [openAboutNested, setOpenAboutNested] = useState(null);
  const toggleAboutNested = (tab) => {
    setOpenAboutNested((prev) => (prev === tab ? null : tab));
  };

  {/* Nested accordion states (in "academics" section) */ }
  const [openAcademicsNested, setOpenAcademicsNested] = useState(null);
  const toggleAcademicsNested = (tab) => {
    setOpenAcademicsNested((prev) => (prev === tab ? null : tab));
  };
  // ============== // This is for mobile dropdown ==============
const handleLogout = () => {
  logout();

  setMobileOpen(false);

  router.push("/login");
};
  return (
    <>
      <header className={`w-full z-50 transition-all duration-300 ease-in-out ${isSticky ? "fixed top-0 left-0 bg-white shadow-md" : "relative bg-transparent"
        }`}>
        {/* =================== Desktop Header =================== */}
        <div className={`left-0 w-full transition-all duration-300 ease-in-out ${isSticky ? "bg-white shadow-md" : "bg-transparent"
          }`}>
          <div className="container">
            <div className={`py-3 shadow-sm rounded-2xl lg:px-[20px] transition-all lg:block flex justify-between duration-300 ${isSticky ? "bg-white" : "bg-white/80"
              }`}>
              <div className="grid lg:grid-cols-12 grid-cols-6 lg:gap-0 items-center">
                {/* Logo */}
                <div className="col-span-4 xl:col-span-2 lg:col-span-2">
                  <Link href="/" className="flex items-center gap-3 shrink-0">
                    <img
                      src={siteLogo}
                      alt="Bhoomi Manthan"
                      className="lg:w-[200px] w-[130px] h-[auto]"
                    />
                  </Link>
                </div>
                {/* // Logo */}

                {/* Nav Section */}
                <div className="col-span-8 xl:col-span-7 lg:col-span-7">
                  <nav className="hidden lg:flex items-center justify-center gap-2.5">
                    {/* HOME */}
                    <Link
                      href="/"
                      className="capitalize text-[14px] font-semibold text-[var(--primary-color)] hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                    >
                      home
                    </Link>
                    {/* // HOME */}

                {/* Buy TAB */}
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        clearTimeout(admissionsTimer.current);
                        setAdmissionsOpen(true);
                      }}
                      onMouseLeave={() => {
                        admissionsTimer.current = setTimeout(() => setAdmissionsOpen(false), 150);
                      }}
                    >
                      <Link
                        href="#"
                        className="capitalize flex items-center gap-1 text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                      >
                        Buy
                        <FaChevronDown
                          size={10}
                          className={`mt-[2px] transition-transform duration-200 ${
                            admissionsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
 
                      {/* Mega dropdown */}
                      <div
                        className={`absolute left-[-250px] top-full w-[1100px] max-w-[95vw] rounded-xl bg-white shadow-xl border border-gray-100 p-8 transition-all duration-200 origin-top ${
                          admissionsOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible pointer-events-none"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-10">
                          {/* Left: heading + columns */}
                          <div className="flex-1">
                            <h3 className="text-[22px] font-semibold text-slate-800">
                              Properties for every ambition
                            </h3>
 
                            <div className="mt-8 grid grid-cols-3 gap-x-10">
                              {/* Column 1 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Property Type</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Apartments
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Studio House
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Villas
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Independent floor
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 2 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Furnishing</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Ready to Move
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      New Launches
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Verified Properties
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Owner Properties
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 3 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Popular Cities</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Gurugram
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Noida
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      New Delhi
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Bengaluru
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
 
                          {/* Right: image */}
                          <div className="hidden lg:block shrink-0">
                            <img
                              src="/assets/img/dropdown-img1.png"
                              alt="image"
                              className="h-[auto] w-[360px] rounded-xl object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* // Buy TAB */}
 

              {/* Rent TAB */}
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        clearTimeout(admissiontabTimer.current);
                        setAdmissiontabOpen(true);
                      }}
                      onMouseLeave={() => {
                        admissiontabTimer.current = setTimeout(() => setAdmissiontabOpen(false), 150);
                      }}
                    >
                      <Link
                        href="#"
                        className="capitalize flex items-center gap-1 text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                      >
                        Rent
                        <FaChevronDown
                          size={10}
                          className={`mt-[2px] transition-transform duration-200 ${
                            admissiontabOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
 
                      {/* Mega dropdown */}
                      <div
                        className={`absolute left-[-250px] top-full w-[1100px] max-w-[95vw] rounded-xl bg-white shadow-xl border border-gray-100 p-8 transition-all duration-200 origin-top ${
                          admissiontabOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible pointer-events-none"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-10">
                          {/* Left: heading + columns */}
                          <div className="flex-1">
                            <h3 className="text-[22px] font-semibold text-slate-800">
                              Rental homes that fit your life
                            </h3>
 
                            <div className="mt-8 grid grid-cols-3 gap-x-10">
                              {/* Column 1 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">For rent</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Flats for rent
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Houses for rent
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      PG for rent
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Office for rent
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Shops for rent
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 2 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Furnishing</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Fully Furnished
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Semi-Furnished
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Unfurnished
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Move-in Ready
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 3 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Popular Cities</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent Gurugram
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in Noida
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in New Delhi
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in Bengaluru
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
 
                          {/* Right: image */}
                          <div className="hidden lg:block shrink-0">
                            <img
                              src="/assets/img/dropdown-img2.png"
                              alt="image"
                              className="h-[auto] w-[360px] rounded-xl object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* // Rent TAB */}

                 {/* New Projects TAB */}
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        clearTimeout(newprojectsTimer.current);
                        setNewprojectsOpen(true);
                      }}
                      onMouseLeave={() => {
                        newprojectsTimer.current = setTimeout(() => setNewprojectsOpen(false), 150);
                      }}
                    >
                      <Link
                        href="#"
                        className="capitalize flex items-center gap-1 text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                      >
                        New Projects
                        <FaChevronDown
                          size={10}
                          className={`mt-[2px] transition-transform duration-200 ${
                            newprojectsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
 
                      {/* Mega dropdown */}
                      <div
                        className={`absolute left-[-350px] top-full w-[1100px] max-w-[95vw] rounded-xl bg-white shadow-xl border border-gray-100 p-8 transition-all duration-200 origin-top ${
                          newprojectsOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible pointer-events-none"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-10">
                          {/* Left: heading + columns */}
                          <div className="flex-1">
                            <h3 className="text-[22px] font-semibold text-slate-800">
                              New launches from trusted builders
                            </h3>
 
                            <div className="mt-8 grid grid-cols-3 gap-x-10">
                              {/* Column 1 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Project Stage</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      New Launches
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Under Construction
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Ready to Move
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Upcoming Projects
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 2 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Top Developers</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      DLF
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Godrej Properties
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      M3M India
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 3 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Popular Cities</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent Gurugram
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in Noida
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in New Delhi
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Rent in Bengaluru
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
 
                          {/* Right: image */}
                          <div className="hidden lg:block shrink-0">
                            <img
                              src="/assets/img/dropdown-img2.png"
                              alt="image"
                              className="h-[auto] w-[360px] rounded-xl object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* // New Projects TAB */}
             {/* Commercial TAB */}
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        clearTimeout(commercialTimer.current);
                        setCommercialOpen(true);
                      }}
                      onMouseLeave={() => {
                        commercialTimer.current = setTimeout(() => setCommercialOpen(false), 150);
                      }}
                    >
                      <Link
                        href="#"
                        className="capitalize flex items-center gap-1 text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                      >
                        Commercial
                        <FaChevronDown
                          size={10}
                          className={`mt-[2px] transition-transform duration-200 ${
                            commercialOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
 
                      {/* Mega dropdown */}
                      <div
                        className={`absolute left-[-450px] top-full w-[1100px] max-w-[95vw] rounded-xl bg-white shadow-xl border border-gray-100 p-8 transition-all duration-200 origin-top ${
                          commercialOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible pointer-events-none"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-10">
                          {/* Left: heading + columns */}
                          <div className="flex-1">
                            <h3 className="text-[22px] font-semibold text-slate-800">
                              Commercial Property Opportunities
                            </h3>
 
                            <div className="mt-8 grid grid-cols-3 gap-x-10">
                              {/* Column 1 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Property Types</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Office Spaces
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Shop
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Warehouses
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Showroom
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Land
                                    </Link>
                                  </li>
                                </ul>
                              </div>
 
                              {/* Column 2 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Transaction</h4>
                                <ul className="mt-5 space-y-3">
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Commercial for sale
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Commercial for rent
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Pre-leased Assets
                                    </Link>
                                  </li>
                                  <li>
                                    <Link href="#" className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
                                      Investment Property
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
 
                          {/* Right: image */}
                          <div className="hidden lg:block shrink-0">
                            <img
                              src="/assets/img/dropdown-img2.png"
                              alt="image"
                              className="h-[auto] w-[360px] rounded-xl object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* // Commercial TAB */}
 
                    {/* Services TAB */}
                    <Link
                      href="#"
                      className="capitalize text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2"
                    >
                      Services
                    </Link>
                    {/* // Services TAB */}  

                    {/* More TAB */}
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        clearTimeout(moreTimer.current);
                        setMoreOpen(true);
                      }}
                      onMouseLeave={() => {
                        moreTimer.current = setTimeout(() => setMoreOpen(false), 150);
                      }}
                    >
                      <Link
                        href="#"
                        className="capitalize flex items-center gap-1 text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2 px-[7px]"
                      >
                        More
                        <FaChevronDown
                          size={10}
                          className={`mt-[2px] transition-transform duration-200 ${moreOpen ? "rotate-180" : ""
                            }`}
                        />
                      </Link>

                      <div
                        className={`absolute left-0 top-full w-[210px] rounded-md bg-white shadow-lg border border-gray-100 py-2 transition-all duration-200 origin-top ${moreOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible pointer-events-none"
                          }`}
                      >
                        <Link
                          href="/web/events"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[var(--primary-color)] transition-colors whitespace-normal break-words"
                        >
                          Events
                        </Link>
                        <Link
                          href="/web/plans"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[var(--primary-color)] transition-colors whitespace-normal break-words"
                        >
                          Pricing Plans
                        </Link>
                        <Link
                          href="/web/blog"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[var(--primary-color)] transition-colors whitespace-normal break-words"
                        >
                          Blogs
                        </Link>
                      </div>
                    </div>
                    {/* // More TAB */}
                  </nav>
                </div>
                {/* // Nav Section */}

                {/* Nav button */}
                <div className="col-span-8 hidden xl:block lg:block xl:col-span-3 lg:col-span-3">
                  <div className="lg:flex items-center gap-3">

                    {!authLoading && !user && (
                      <>
                        <Link
                          href="/login"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Login
                        </Link>

                        <span>/</span>

                        <Link
                          href="/signUp"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Register
                        </Link>

                        <Link
                          href="#"
                          className="flex items-center hover:bg-[var(--secondary-color)] text-white px-3 py-3 rounded-lg border text-[15px] font-medium leading-[100%] bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out"
                        >
                          Post Property Free
                        </Link>
                      </>
                    )}

                    {!authLoading && user && (
                      <>
                        <Link
                          href={user.role === "customer" ? "/" : getDashboardPath()}
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          {getDashboardLabel()}
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Logout
                        </button>

                        <Link
                          href={`/web/profile/${user.id}`}
                          className="flex items-center hover:bg-[var(--secondary-color)] text-white px-3 py-3 rounded-lg border text-[15px] font-medium leading-[100%] bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out"
                        >
                          Profile
                        </Link>
                      </>
                    )}

                  </div>
                </div>
                {/* // Nav button */}
              </div>

              {/* Mobile toggle button */}
              <button
                aria-label="Toggle menu"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-[var(--primary-color)] text-2xl p-2"
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
        {/* =================== // Desktop Header =================== */}




        {/* =================== Mobile Header =================== */}
        {/* Overlay */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
        />

        {/* Side panel */}
        <div
          className={`fixed top-0 right-0 h-full w-[80%] max-w-[340px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link
              href="#"
              className="flex items-center justify-center"
            >
              {/* Apply Now &nbsp; <FaHandPointer size={14} /> */}
              <img
                src={siteLogo}
                alt="Bhoomi Manthan"
                className="lg:w-[200px] w-[130px] h-[auto]"
              />
            </Link>
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="text-2xl text-gray-600 p-1"
            >
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-190px)] px-4">
            {/* HOME */}
            <div className="border-b border-gray-100">
              <Link href="/" className="block py-2 text-sm font-medium text-[var(--text-color)]">
                Home
              </Link>
            </div>
            {/* // HOME */}

{/* Buy TAB */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("about")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">Buy</span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${
                    openMainTab === "about" ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${
                  openMainTab === "about" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Property Type</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Apartments</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Studio House</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Villas</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Independent floor</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Furnishing</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Ready to Move</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">New Launches</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Verified Properties</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Owner Properties</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Gurugram</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Noida</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">New Delhi</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Bengaluru</Link>
              </div>
            </div>
            {/* // Buy TAB */}
 
            {/* Rent TAB */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("cdoe")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">Rent</span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${
                    openMainTab === "cdoe" ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${
                  openMainTab === "cdoe" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">For Rent</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Flats for rent</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Houses for rent</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">PG for rent</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Office for rent</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Shops for rent</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Furnishing</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Fully Furnished</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Semi-Furnished</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Unfurnished</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Move-in Ready</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent Gurugram</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in Noida</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in New Delhi</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in Bengaluru</Link>
              </div>
            </div>
            {/* // Rent TAB */}
 
            {/* New Projects */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("Projects")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">New Projects</span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${
                    openMainTab === "Projects" ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${
                  openMainTab === "Projects" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Project Stage</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">New Launches</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Under Construction</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Ready to Move</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Upcoming Projects</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Top Developers</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">DLF</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Godrej Properties</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">M3M India</Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent Gurugram</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in Noida</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in New Delhi</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Rent in Bengaluru</Link>
              </div>
            </div>
            {/* // New Projects */}
 
            {/* Commercial */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("Commercial")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">Commercial</span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${
                    openMainTab === "Commercial" ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${
                  openMainTab === "Commercial" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Property Types</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Office Spaces</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Shop</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Warehouses</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Showroom </Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Land </Link>
 
                <h6 className="px-4 py-2 text-sm font-bold text-[var(--primary-color)]">Transaction</h6>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Commercial for sale</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Commercial for rent</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Pre-leased Assets</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Investment Property</Link>
              </div>
            </div>
            {/* // Commercial */}


            {/* Services TAB */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("programs")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">Services </span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${openMainTab === "programs" ? "rotate-180" : ""
                    }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${openMainTab === "programs" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Dropdown 1</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Dropdown 2</Link>
                <Link href="#" className="block py-3 pl-4 text-sm text-gray-700">Dropdown 3 </Link>
              </div>
            </div>
            {/* // Services TAB */}

            {/* More TAB */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("admission")}
              >
                <span className="capitalize text-sm font-medium text-[var(--text-color)]">More </span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${openMainTab === "admission" ? "rotate-180" : ""
                    }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${openMainTab === "admission" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <Link href="/web/events" onClick={() => setMobileOpen(false)} className="block py-3 pl-4 text-sm text-gray-700">Events</Link>
                <Link href="/web/plans" onClick={() => setMobileOpen(false)} className="block py-3 pl-4 text-sm text-gray-700">Pricing Plans</Link>
                <Link href="/web/blog" onClick={() => setMobileOpen(false)} className="block py-3 pl-4 text-sm text-gray-700">Blogs</Link>
              </div>
            </div>
            {/* // More TAB */}
          </div>

        <div className="p-4 border-t border-gray-100">

  {!authLoading && !user && (
    <div className="flex gap-4 justify-between">

      <Link
        href="/login"
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-center text-white text-sm font-medium rounded-md px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out whitespace-nowrap w-[48%]"
      >
        Login
      </Link>

      <Link
        href="/signUp"
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-center text-white text-sm font-medium rounded-md px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out whitespace-nowrap w-[48%]"
      >
        Register
      </Link>

    </div>
  )}

  {!authLoading && user && (
    <div className="space-y-3">

      <Link
        href={
          user.role === "customer"
            ? "/"
            : getDashboardPath()
        }
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-center text-white text-sm font-medium rounded-md px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out w-full"
      >
        {getDashboardLabel()}
      </Link>

      <Link
        href={`/web/profile/${user.id}`}
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-center text-white text-sm font-medium rounded-md px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out w-full"
      >
        Profile
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center justify-center text-white text-sm font-medium rounded-md px-5 py-2.5 bg-gray-700 hover:bg-gray-900 transition-all duration-500 ease-in-out w-full"
      >
        Logout
      </button>

    </div>
  )}

</div>
        </div>
        {/* =================== // Mobile Header =================== */}

      </header>
    </>
  );
}