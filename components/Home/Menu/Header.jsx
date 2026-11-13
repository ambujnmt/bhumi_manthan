"use client";

import { Link } from "@heroui/react";
import NextLink from "next/link";
import { useState, useRef, useEffect } from "react";
import { FaArrowRight, FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { FiGrid, FiHeart, FiLogOut } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useCompare } from "../../../context/CompareContext";
import { MdCompareArrows } from "react-icons/md";
import LogoutConfirm from "../../Common/LogoutConfirm";
import { useRouter } from "next/router";
import useSiteLogo from "../../../utils/useSiteLogo";
import { adminHomePath, hasAdminAccess } from "../../../utils/adminPermissions";
import { SEARCH_PATH, findTab, useSearchOptions } from "../../../utils/useSearchFilters";
import useLiveEvents from "../../../utils/useLiveEvents";
import UserAvatar from "../../Common/UserAvatar";
import LiveBadge from "../../Common/LiveBadge";
import { formatEventTime } from "../../Innerpages/Events/eventUtils";
import { PROJECT_CITIES, PROJECT_DEVELOPERS, PROJECT_STAGES, PROJECTS_PATH, projectsHref } from "../../../utils/projectFilters";

// Search page link with filters: searchHref({ type: "rental", furnishing: "furnished" })
const searchHref = (params) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();
  return query ? `${SEARCH_PATH}?${query}` : SEARCH_PATH;
};

const menuLinkClass = "text-sm text-slate-500 hover:text-[var(--primary-color)] transition-colors";

// Simple list of { label, href } links inside a mega dropdown column (mobile: plain links, closes the menu)
function MenuLinks({ links, mobile = false, onClick }) {
  if (mobile) {
    return links.map((link) => (
      <Link key={link.href + link.label} href={link.href} onClick={onClick} className="block py-2 text-sm text-gray-700">
        {link.label}
      </Link>
    ));
  }

  return (
    <ul className="mt-3 space-y-3">
      {links.map((link) => (
        <li key={link.href + link.label}>
          <Link href={link.href} className={menuLinkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Sub categories of a category group -> search page links (?type=rental&property_types=flats)
function CategoryLinks({ tab, mobile = false, onClick }) {
  const links = (tab?.property_types || []).map((sub) => ({
    key: sub.key,
    label: sub.label,
    href: `${SEARCH_PATH}?type=${encodeURIComponent(tab.key)}&property_types=${encodeURIComponent(sub.key)}`,
  }));

  if (mobile) {
    return links.map((link) => (
      <Link key={link.key} href={link.href} onClick={onClick} className="block py-2 text-sm text-gray-700">
        {link.label}
      </Link>
    ));
  }

  return (
    <ul className="mt-3 space-y-3">
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

  // Event started and not ended -> red blinking LIVE in header (links to that event)
  const liveEvents = useLiveEvents();
  const liveHref = liveEvents.length === 1
    ? `/web/events/${liveEvents[0].slug || liveEvents[0].id}`
    : "/web/events";
  const liveTitle = liveEvents.length === 1
    ? `Live now: ${liveEvents[0].title}`
    : `${liveEvents.length} events live now`;
  const buyTab = findTab(searchOptions, "buy");
  const rentTab = findTab(searchOptions, "rent");
  const commercialTab = findTab(searchOptions, "commercial");

  // Tab keys from search options (fallback = backend keys)
  const rentType = rentTab?.key || "rental";
  const commercialType = commercialTab?.key || "commercial";

  // Cities that have listings (search options order), city names exactly as saved on properties
  const popularCities = (searchOptions?.cities || []).map((city) => city.name).filter(Boolean).slice(0, 4);

  const rentLinks = {
    furnishing: [
      { label: "Fully Furnished", href: searchHref({ type: rentType, furnishing: "furnished" }) },
      { label: "Semi-Furnished", href: searchHref({ type: rentType, furnishing: "semi-furnished" }) },
      { label: "Unfurnished", href: searchHref({ type: rentType, furnishing: "unfurnished" }) },
      { label: "All Rentals", href: searchHref({ type: rentType }) },
    ],
    cities: popularCities.map((city) => ({ label: `Rent in ${city}`, href: searchHref({ type: rentType, city }) })),
  };

  const projectLinks = {
    stages: PROJECT_STAGES.map((stage) => ({ label: stage.label, href: projectsHref({ launch_status: stage.value }) })),
    developers: PROJECT_DEVELOPERS.map((developer) => ({ label: developer.label, href: projectsHref({ builder: developer.value }) })),
    cities: PROJECT_CITIES.map((city) => ({ label: `Projects in ${city}`, href: projectsHref({ city }) })),
  };

  const commercialLinks = [
    { label: "Commercial for sale", href: searchHref({ type: commercialType, listing_type: "sale" }) },
    { label: "Commercial for rent", href: searchHref({ type: commercialType, listing_type: "rent" }) },
    { label: "Commercial on lease", href: searchHref({ type: commercialType, listing_type: "lease" }) },
    { label: "All Commercial", href: searchHref({ type: commercialType }) },
  ];

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

      {/* Full width white header; shadow appears once the page is scrolled */}
      <header ref={headerRef} className={`fixed left-0 top-0 w-full z-50 bg-white transition-shadow duration-300 ease-in-out ${isSticky ? "shadow-md" : "shadow-sm"
        }`}>
        {/* =================== LIVE event bar (event started, not ended) =================== */}
        {/* Plain link (not HeroUI Link) so its default inline / colour / hover-opacity styles don't apply */}
        {liveEvents.length > 0 && (
          <NextLink
            href={liveHref}
            title={liveTitle}
            className="group block w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white no-underline hover:text-white"
          >
            <div className="container">
              <div className="flex min-h-[38px] items-center justify-center gap-2 py-1.5 sm:gap-3">
                <LiveBadge size="md" variant="light" label="Live Now" />

                <p className="mb-0 min-w-0 truncate text-[12px] font-semibold leading-tight text-white sm:text-[13px]">
                  {liveEvents.length === 1 ? (
                    <>
                      {liveEvents[0].title}
                      {liveEvents[0].city && <span className="font-normal text-white/85"> · {liveEvents[0].city}</span>}
                      {liveEvents[0].end_time && (
                        <span className="hidden font-normal text-white/85 md:inline"> · till {formatEventTime(liveEvents[0].end_time)}</span>
                      )}
                    </>
                  ) : (
                    `${liveEvents.length} property events are live now`
                  )}
                </p>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold leading-none text-red-600 shadow-sm transition group-hover:bg-red-50">
                  <span className="hidden sm:inline">{liveEvents.length === 1 ? "View Event" : "View Events"}</span>
                  <span className="sm:hidden">View</span>
                  <FaArrowRight size={9} aria-hidden="true" />
                </span>
              </div>
            </div>
          </NextLink>
        )}

        {/* =================== Desktop Header =================== */}
        <div className="left-0 w-full bg-white">
          <div className="container">
            <div className="py-3 lg:px-[20px] lg:block flex justify-between">
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
                                <ul className="mt-3 space-y-3">
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
                                <ul className="mt-3 space-y-3">
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
                        href={searchHref({ type: rentType })}
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
                                <MenuLinks links={rentLinks.furnishing} />
                              </div>

                              {/* Column 3 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Popular Cities</h4>
                                <MenuLinks links={rentLinks.cities} />
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
                        href={PROJECTS_PATH}
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
                                <MenuLinks links={projectLinks.stages} />
                              </div>

                              {/* Column 2 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Top Developers</h4>
                                <MenuLinks links={projectLinks.developers} />
                              </div>

                              {/* Column 3 */}
                              <div>
                                <h4 className="text-[15px] font-semibold text-black">Popular Cities</h4>
                                <MenuLinks links={projectLinks.cities} />
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
                        href={searchHref({ type: commercialType })}
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
                                <MenuLinks links={commercialLinks} />
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
                    {/* <Link
                      href="#"
                      className="capitalize text-[14px] font-semibold text-black hover:text-[var(--secondary-color)] transition-colors py-2"
                    >
                      Services
                    </Link> */}
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
                          className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[var(--primary-color)] transition-colors whitespace-normal break-words"
                        >
                          Events
                          {liveEvents.length > 0 && <LiveBadge size="sm" />}
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

                    {/* wishlist + compare ab right side wale "Nav button" section mein hain */}
                  </nav>
                </div>
                {/* // Nav Section */}

                {/* Nav button */}
                <div className="col-span-8 hidden xl:block lg:block xl:col-span-3 lg:col-span-3">
                  <div className="lg:flex items-center justify-end gap-3">

                    {!authLoading && !user && (
                      <>
                        {/* Guest: wishlist + compare, phir Login / Register */}
                        <div className="ml-4 flex items-center gap-0.5">
                          {wishlistLink}
                          {compareLink}
                        </div>

                        <Link
                          href="/login"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Buyer
                        </Link>

                        <span>/</span>

                        <Link
                          href="/login"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Broker
                        </Link>

                        <span>/</span>

                        <Link
                          href="/login"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Seller
                        </Link>

                        <span>/</span>

                        <Link
                          href="/signUp"
                          className="capitalize text-[14px] font-semibold text-[var(--text-color3)] hover:text-[var(--secondary-color)] transition-colors py-2"
                        >
                          Register
                        </Link>

                        {/* <Link
                          href="#"
                          className="flex items-center hover:bg-[var(--secondary-color)] text-white px-3 py-3 rounded-lg border text-[15px] font-medium leading-[100%] bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out"
                        >
                          Post Property Free
                        </Link> */}
                      </>
                    )}

                    {!authLoading && user && (
                      <>
                        <div className="ml-auto flex items-center gap-2 pl-4">
                          <div className="flex items-center gap-0.5">
                            {wishlistLink}
                            {compareLink}
                          </div>
                        <div ref={userMenuRef} className="relative">
                          <button
                            type="button"
                            aria-label="Account menu"
                            aria-haspopup="menu"
                            aria-expanded={userMenuOpen}
                            title={user.name}
                            onClick={() => setUserMenuOpen((open) => !open)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-color)] text-base font-bold text-white transition-colors hover:bg-[var(--secondary-color)] overflow-hidden ring-2 ring-transparent hover:ring-[var(--primary-color)]/40"
                          >
                            <UserAvatar user={user} className="h-full w-full" />
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
                              <UserAvatar user={user} className="h-11 w-11 bg-[var(--primary-color)] text-lg text-white" />
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

                              {getDashboardLabel() && <div className="mx-[12px] my-[6px] border-t border-gray-100" />}

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

          <div className="overflow-y-auto h-[calc(100%-230px)] px-4">
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
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
                  openMainTab === "about" ? "max-h-[1000px] pb-2 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Property Type</h6>
                <CategoryLinks tab={buyTab} mobile onClick={() => setMobileOpen(false)} />
 
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Furnishing</h6>
                <Link href="#" className="block py-2 text-sm text-gray-700">Ready to Move</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">New Launches</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">Verified Properties</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">Owner Properties</Link>
 
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <Link href="#" className="block py-2 text-sm text-gray-700">Gurugram</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">Noida</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">New Delhi</Link>
                <Link href="#" className="block py-2 text-sm text-gray-700">Bengaluru</Link>
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
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
                  openMainTab === "cdoe" ? "max-h-[1000px] pb-2 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">For Rent</h6>
                <CategoryLinks tab={rentTab} mobile onClick={() => setMobileOpen(false)} />
 
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Furnishing</h6>
                <MenuLinks links={rentLinks.furnishing} mobile onClick={() => setMobileOpen(false)} />

                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <MenuLinks links={rentLinks.cities} mobile onClick={() => setMobileOpen(false)} />
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
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
                  openMainTab === "Projects" ? "max-h-[1000px] pb-2 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Project Stage</h6>
                <MenuLinks links={projectLinks.stages} mobile onClick={() => setMobileOpen(false)} />

                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Top Developers</h6>
                <MenuLinks links={projectLinks.developers} mobile onClick={() => setMobileOpen(false)} />

                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Popular Cities</h6>
                <MenuLinks links={projectLinks.cities} mobile onClick={() => setMobileOpen(false)} />
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
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
                  openMainTab === "Commercial" ? "max-h-[1000px] pb-2 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Property Types</h6>
                <CategoryLinks tab={commercialTab} mobile onClick={() => setMobileOpen(false)} />
 
                <h6 className="mb-0 pb-1 pt-3 text-sm font-bold text-[var(--primary-color)]">Transaction</h6>
                <MenuLinks links={commercialLinks} mobile onClick={() => setMobileOpen(false)} />
              </div>
            </div>
            {/* // Commercial */}



            {/* More TAB */}
            <div className="border-b border-gray-100">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => toggleMainTab("admission")}
              >
                <span className="flex items-center gap-2 capitalize text-sm font-medium text-[var(--text-color)]">
                  More {liveEvents.length > 0 && <LiveBadge size="sm" />}
                </span>
                <FaChevronDown
                  size={12}
                  className={`mr-4 text-gray-500 transition-transform duration-300 ${openMainTab === "admission" ? "rotate-180" : ""
                    }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${openMainTab === "admission" ? "max-h-[1000px] pb-2 opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <Link href="/web/events" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                  Events {liveEvents.length > 0 && <LiveBadge size="sm" />}
                </Link>
                <Link href="/web/plans" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-700">Pricing Plans</Link>
                <Link href="/web/blog" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-700">Blogs</Link>
              </div>
            </div>
            {/* // More TAB */}
          </div>

        <div className="p-4 border-t border-gray-100">

  {!authLoading && !user && (
    <div className="space-y-3">

      {/* Buyer / Broker / Seller login */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/buyer-login"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center text-white text-sm font-medium rounded-md px-2 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out whitespace-nowrap"
        >
          Buyer
        </Link>

        <Link
          href="/login"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center text-white text-sm font-medium rounded-md px-2 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out whitespace-nowrap"
        >
          Broker
        </Link>

        <Link
          href="/login"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center text-white text-sm font-medium rounded-md px-2 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-all duration-500 ease-in-out whitespace-nowrap"
        >
          Seller
        </Link>
      </div>

      <Link
        href="/signUp"
        onClick={() => setMobileOpen(false)}
        className="flex items-center justify-center text-sm font-medium rounded-md px-5 py-2.5 border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-in-out w-full"
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