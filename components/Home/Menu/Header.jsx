"use client";

import { Link } from "@heroui/react";
import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { FiGrid, FiHeart, FiLogOut, FiUser } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useCompare } from "../../../context/CompareContext";
import { MdCompareArrows } from "react-icons/md";
import LogoutConfirm from "../../Common/LogoutConfirm";
import { useRouter } from "next/router";
import useSiteLogo from "../../../utils/useSiteLogo";
import { adminHomePath, hasAdminAccess } from "../../../utils/adminPermissions";
import { SEARCH_PATH, findTab, useSearchOptions } from "../../../utils/useSearchFilters";

// Sub categories of a category group -> search page links (?type=rental&property_types=flats)
function CategoryLinks({ tab, mobile = false, onClick }) {
  const links = (tab?.property_types || []).map((sub) => ({
    key: sub.key,
    label: sub.label,
    href: `${SEARCH_PATH}?type=${encodeURIComponent(tab.key)}&property_types=${encodeURIComponent(sub.key)}`,
  }));

  if (mobile) {
    return links.map((link) => (
      <Link key={link.key} href={link.href} onClick={onClick} className="block py-3 pl-4 text-sm text-gray-700">
        {link.label}
      </Link>
    ));
  }

  return (
    <ul className="mt-5 space-y-3">
      {links.map((link) => (
        <li key={link.key}>
          <Link href={link.href} className="text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Header() {
  const router = useRouter();
  const siteLogo = useSiteLogo();

  // Buy / Rent / Commercial menus = property category groups (search options)
  const searchOptions = useSearchOptions();
  const buyTab = findTab(searchOptions, "buy");
  const rentTab = findTab(searchOptions, "rent");
  const commercialTab = findTab(searchOptions, "commercial");

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

  /* ---------- logged in user menu (desktop) ---------- */
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [userMenuOpen]);

  const { ids: wishlistIds } = useWishlist();

  // Only customers have a wishlist. A guest goes to login first.
  const wishlistLink = !authLoading && (!user || user.role === "customer") && (
    <Link
      href={user ? `/user/myWishlist/myWishlist/${user.id}` : "/login"}
      aria-label={wishlistIds.length ? `Wishlist, ${wishlistIds.length} saved` : "Wishlist"}
      title="Wishlist"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--primary-color)] transition-colors hover:bg-[#FFECD3]"
    >
      <FiHeart size={20} aria-hidden="true" />
      {wishlistIds.length > 0 && (
        <span className="absolute -right-[2px] -top-[2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-[4px] text-[10px] font-bold leading-none text-white" aria-hidden="true">
          {wishlistIds.length > 99 ? "99+" : wishlistIds.length}
        </span>
      )}
    </Link>
  );

  const { ids: compareIds } = useCompare();

  // The compare page itself asks a guest to log in
  const compareLink = !authLoading && (
    <Link
      href="/web/compare"
      aria-label={compareIds.length ? `Compare, ${compareIds.length} added` : "Compare"}
      title="Compare"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--primary-color)] transition-colors hover:bg-[#FFECD3]"
    >
      <MdCompareArrows size={22} aria-hidden="true" />
      {compareIds.length > 0 && (
        <span className="absolute -right-[2px] -top-[2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-[4px] text-[10px] font-bold leading-none text-white" aria-hidden="true">
          {compareIds.length}
        </span>
      )}
    </Link>
  );

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

    if (user.role === "customer") {
      return "/user/dashboard";
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

    if (user?.role === "customer") {
      return "Dashboard";
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
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => setHeaderHeight(headerRef.current?.offsetHeight || null));

    observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, []);

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
  setLogoutOpen(false);
  logout();

  setMobileOpen(false);

  router.push("/login");
};
  return (
    <>
      {/* Keeps the header's place in the page: without it the page height changes on scroll and the header blinks */}
      <div aria-hidden="true" className="h-[72px] shrink-0 lg:h-[96px]" style={headerHeight ? { height: headerHeight } : undefined} />

      <header ref={headerRef} className={`fixed left-0 top-0 w-full z-50 transition-colors duration-300 ease-in-out ${isSticky ? "bg-white shadow-md" : "bg-transparent"
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
                  <nav className="hidden lg:flex items-center justify-center gap-[2px] xl:gap-2.5">
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
                                <CategoryLinks tab={buyTab} />
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
                                <CategoryLinks tab={rentTab} />
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
                                <CategoryLinks tab={commercialTab} />
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

                    {!user && wishlistLink}
                    {!user && compareLink}
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
                        <div className="ml-auto flex items-center gap-2">
                          {wishlistLink}
                          {compareLink}
                        <div ref={userMenuRef} className="relative">
                          <button
                            type="button"
                            aria-label="Account menu"
                            aria-haspopup="menu"
                            aria-expanded={userMenuOpen}
                            title={user.name}
                            onClick={() => setUserMenuOpen((open) => !open)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-color)] text-base font-bold text-white transition-colors hover:bg-[var(--secondary-color)]"
                          >
                            {userInitial}
                          </button>

                          <div
                            role="menu"
                            className={`absolute right-0 top-full z-50 mt-3 w-[260px] origin-top-right rounded-2xl border border-gray-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ${
                              userMenuOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"
                            }`}
                          >
                            {/* Arrow pointing at the avatar */}
                            <span className="absolute -top-[6px] right-[14px] h-3 w-3 rotate-45 border-l border-t border-gray-100 bg-[#FFF6EA]" aria-hidden="true" />

                            <div className="flex items-center gap-3 rounded-t-2xl bg-[#FFF6EA] p-[16px]">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-lg font-bold text-white" aria-hidden="true">
                                {userInitial}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-[var(--secondary-color)]">{user.name}</div>
                                {user.email && <div className="truncate text-xs text-[#62748E]">{user.email}</div>}
                              </div>
                            </div>

                            <div className="p-[8px]">
                              {getDashboardLabel() && (
                                <Link
                                  href={getDashboardPath()}
                                  role="menuitem"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="group flex w-full items-center gap-3 rounded-xl px-[12px] py-[10px] text-sm font-semibold text-[var(--secondary-color)] transition-colors hover:bg-[#FFECD3] hover:text-[var(--primary-color)]"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFECD3] text-[var(--primary-color)] transition-colors group-hover:bg-white" aria-hidden="true">
                                    <FiGrid size={16} />
                                  </span>
                                  {getDashboardLabel()}
                                </Link>
                              )}
                              <Link
                                href={`/web/profile/${user.id}`}
                                role="menuitem"
                                onClick={() => setUserMenuOpen(false)}
                                className="group flex w-full items-center gap-3 rounded-xl px-[12px] py-[10px] text-sm font-semibold text-[var(--secondary-color)] transition-colors hover:bg-[#FFECD3] hover:text-[var(--primary-color)]"
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFECD3] text-[var(--primary-color)] transition-colors group-hover:bg-white" aria-hidden="true">
                                  <FiUser size={16} />
                                </span>
                                Profile
                              </Link>

                              <div className="mx-[12px] my-[6px] border-t border-gray-100" />

                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  setLogoutOpen(true);
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl px-[12px] py-[10px] text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 transition-colors group-hover:bg-white" aria-hidden="true">
                                  <FiLogOut size={16} />
                                </span>
                                Logout
                              </button>
                            </div>
                          </div>
                        </div>
                        </div>
                      </>
                    )}

                  </div>
                </div>
                {/* // Nav button */}
              </div>

              {/* Mobile wishlist + toggle button */}
              <div className="flex items-center gap-1 lg:hidden">
                {wishlistLink}
                {compareLink}
                <button
                  aria-label="Toggle menu"
                  onClick={() => setMobileOpen(true)}
                  className="text-[var(--primary-color)] text-2xl p-2"
                >
                  <FaBars />
                </button>
              </div>
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
          className={`fixed top-0 right-0 h-full w-[80%] max-w-[340px] overflow-y-auto bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"
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
                <CategoryLinks tab={buyTab} mobile onClick={() => setMobileOpen(false)} />
 
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
                <CategoryLinks tab={rentTab} mobile onClick={() => setMobileOpen(false)} />
 
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
                <CategoryLinks tab={commercialTab} mobile onClick={() => setMobileOpen(false)} />
 
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
        href={getDashboardPath()}
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
        onClick={() => {
          setMobileOpen(false);
          setLogoutOpen(true);
        }}
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

      <LogoutConfirm isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleLogout} />
    </>
  );
}