'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button, Link } from '@heroui/react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { MdOutlineLogout, MdOutlineMonitor } from "react-icons/md";
import { HiMenu } from "react-icons/hi";
import { FaBuilding, FaCity, FaClipboardList, FaCog, FaEnvelope, FaImages, FaMapMarkedAlt, FaNewspaper, FaUser, FaUserShield } from 'react-icons/fa';
import { RxDotFilled } from "react-icons/rx";
import { BsChatDotsFill } from "react-icons/bs";
import { getInboxCounts } from "../../../../utils/adminFetchApi";
import { useUser } from "../../../../context/UserContext";
import { hasPermission, PANEL_URL_PREFIX } from "../../../../utils/adminPermissions";
import Tmodal from "../../../Tmodal/Tmodal";

export default function SideMenu({
  isCollapsed,
  toggleCollapse,
  toggleMenu
}) {
  const [hoveredMenu, setHoveredMenu] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0 });

  const categoryRef = useRef(null);
  const productRef = useRef(null);
  const userRef = useRef(null);
  const cmsRef = useRef(null);
  const homePageRef = useRef(null);
  const formRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // /seller/..., /broker/..., /staff/... are the same /admin pages (role URL)
  const pathname = (usePathname() || '').replace(PANEL_URL_PREFIX, '/admin');
  const [openTab, setOpenTab] = useState('');

  // Logged in admin (bottom profile + logout)
  const router = useRouter();
  const { user, logout } = useUser();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const userName = user?.name || 'Super Admin';
  const profileHref = `/admin/profile/${user?.id ?? ''}`;

  // Menu items by role permissions (super admin sees everything)
  const isSuperAdmin = user?.role === 'super_admin';
  const can = (permission) => hasPermission(user, permission);
  const canSeeMessages = can('contact_messages.view|enquiries.view');

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    router.replace('/login');
  };

  // Fresh role / permissions: UserContext refreshes the user from /profile
  // and PrivateRoute moves the user to the right dashboard.

  // Unread contact messages + enquiries (Messages box)
  const [inboxCounts, setInboxCounts] = useState({ contact: 0, enquiry: 0 });
  const unreadTotal = inboxCounts.contact + inboxCounts.enquiry;

  useEffect(() => {
    if (!canSeeMessages) return;

    const loadCounts = () =>
      getInboxCounts()
        .then((res) =>
          setInboxCounts({
            contact: res?.data?.contact_unread ?? 0,
            enquiry: res?.data?.enquiry_unread ?? 0,
          })
        )
        .catch(() => { });

    loadCounts();

    // Refresh every minute + when a message is read / deleted
    const timer = setInterval(loadCounts, 60000);
    window.addEventListener('inbox:updated', loadCounts);

    return () => {
      clearInterval(timer);
      window.removeEventListener('inbox:updated', loadCounts);
    };
  }, [pathname, canSeeMessages]);



  /*
  |--------------------------------------------------------------------------
  | Automatically open active tab based on URL
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/category')) {
      setOpenTab('category');
    } else if (pathname?.startsWith('/dashboard/user')) {
      setOpenTab('user');
    } else if (pathname?.startsWith('/dashboard/product')) {
      setOpenTab('product');
    } else if (pathname?.startsWith('/dashboard/cms')) {
      setOpenTab('cms');
    } else if (pathname?.startsWith('/dashboard/homePage')) {
      setOpenTab('cms');
    } else if (pathname?.startsWith('/dashboard/inventory')) {
      setOpenTab('inventory');
    } else if (pathname?.startsWith('/dashboard/suppliers')) {
      setOpenTab('suppliers');
    } else {
      setOpenTab('');
    }
  }, [pathname]);

  /*
  |--------------------------------------------------------------------------
  | Hover handlers for collapsed sidebar
  |--------------------------------------------------------------------------
  */
  const handleMouseEnter = (menu, ref) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (isCollapsed && ref.current) {
      const rect = ref.current.getBoundingClientRect();

      const dropdownHeight = 400;
      const viewportHeight = window.innerHeight;

      let top = rect.top + window.scrollY;

      if (rect.top + dropdownHeight > viewportHeight) {
        top = viewportHeight - dropdownHeight - 20;
      }

      setDropdownPosition({ top });
      setHoveredMenu(menu);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredMenu('');
      }, 300);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Active route helper
  |--------------------------------------------------------------------------
  */
  const isActive = (href) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  /*
  |--------------------------------------------------------------------------
  | Active menu by section (list / create / update / detail pages)
  |--------------------------------------------------------------------------
  */
  const isDashboardActive = pathname === '/admin' || isActive('/admin/dashboard');
  const isUserActive = isActive('/admin/user');
  const isPropertyActive = isActive('/admin/propertyManagement');
  const isProjectActive = isActive('/admin/project');
  const isBlogActive = isActive('/admin/blog');
  const isLocationActive = isActive('/admin/location');
  const isSettingsActive = isActive('/admin/settings');
  const isBannerActive = isActive('/admin/banner');
  const isContactActive = isActive('/admin/contact');
  const isEnquiryActive = isActive('/admin/enquiry');
  const isRoleActive = isActive('/admin/role');
  const isEventActive = isActive('/admin/event');
  const isPlanActive = isActive('/admin/plan');
  /*
  |--------------------------------------------------------------------------
  | Dropdown Links
  |--------------------------------------------------------------------------
  */
  const renderDropdownLinks = (links) => (
    <div className="space-y-1">

      {links.map(({ href, label }, idx) => {
        const active = isActive(href);

        return (
          <Link
            key={idx}
            href={href}
            onClick={toggleMenu}
            className={`
              group flex items-center gap-2.5
              rounded-lg px-3 py-2
              text-[12px] font-medium
              transition-all duration-200
              ${active
                ? 'bg-orange-50 text-[#E87722]'
                : 'text-[#62748E] hover:bg-orange-50 hover:text-[#E87722]'
              }
            `}
          >
            <RxDotFilled
              className={`
                flex-shrink-0
                ${active
                  ? 'text-[#E87722]'
                  : 'text-gray-300 group-hover:text-[#E87722]'
                }
              `}
            />

            <span>
              {label}
            </span>
          </Link>
        );
      })}

    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Sidebar
  |--------------------------------------------------------------------------
  */
  return (
    <div
      className={`
        fixed
        top-0
        left-0
        bottom-0
        z-40
        flex
        h-screen
        flex-col
        overflow-visible
        bg-white
        border-r
        border-gray-100
        shadow-[2px_0_12px_rgba(0,0,0,0.03)]
        transition-all
        duration-300
        ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div
        className={`
          flex
          h-[66px]
          flex-shrink-0
          items-center
          border-b
          border-white/10
          bg-[#001737]
          px-4
          transition-all
          duration-300
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}
      >

        {!isCollapsed && (
          <Link
            href="/"
            className="flex items-center justify-center"
          >
            <img
              src="/assets/img/footer-logo.png"
              alt="Logo"
              className="h-10 w-auto max-w-[155px] object-contain"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={toggleCollapse}
          aria-label="Toggle sidebar"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-white
            transition-all
            duration-200
            hover:bg-white/10
            active:scale-95
          "
        >
          <HiMenu className="h-5 w-5" />
        </button>
      </div>

      {/* ================================================================
          MESSAGES BOX (fixed, does not scroll with menu)
      ================================================================ */}
      {canSeeMessages && (
        <div className="flex-shrink-0 px-3 pt-3">
          {isCollapsed ? (
            <div
              title="Messages"
              className="relative flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#001737] to-[#283A86] text-white"
            >
              <BsChatDotsFill className="h-[18px] w-[18px]" />
              {unreadTotal > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E87722] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#001737] via-[#14275e] to-[#283A86] px-3 py-2 shadow-[0_6px_18px_rgba(0,23,55,0.25)] ring-1 ring-white/10">
              {/* Decorative dots + glows */}
              <span
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}
              />
              <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#E87722]/35 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />
              <span className="pointer-events-none absolute -bottom-10 -left-6 h-20 w-20 rounded-full bg-sky-400/20 blur-2xl" />

              <div className="relative flex items-center gap-2.5">
                {/* Icon */}
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff9a4d] to-[#E87722] text-white shadow-[0_4px_10px_rgba(232,119,34,0.45)]">
                  <BsChatDotsFill className="h-3.5 w-3.5" />
                  {unreadTotal > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-[#E87722] bg-white" />
                    </span>
                  )}
                </span>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <p className="mb-0 text-[13px] font-bold leading-none tracking-wide text-white">Messages</p>
                </div>

                {/* Count */}
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2 py-1 ring-1 ring-white/15 backdrop-blur-sm">
                  <span className={`text-[14px] font-extrabold leading-none ${unreadTotal > 0 ? 'text-[#ffb27a]' : 'text-white/80'}`}>
                    {unreadTotal > 99 ? '99+' : unreadTotal}
                  </span>
                  <span className="text-[9px] font-semibold uppercase leading-none tracking-wider text-white/60">new</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================
    MENU
================================================================ */}
      <div
        className="
    flex-1
    overflow-y-auto
    overflow-x-visible
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden
  "
      >
        <div className="relative p-3">

          {/* ============================================================
        DASHBOARD
    ============================================================ */}
          {can('dashboard.view') && (
            <Link
              href="/admin/dashboard"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isDashboardActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <MdOutlineMonitor
                  className={`
            h-5
            w-5
            flex-shrink-0
            transition-colors
            duration-200
            ${isDashboardActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Business Overview
                  </span>
                )}
              </div>

              {!isCollapsed && isDashboardActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}


          {/* ============================================================
        USER MANAGEMENT
    ============================================================ */}
          {can('users.view') && (
            <Link
              href="/admin/user/userManagement"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isUserActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaUser
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isUserActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    User Management
                  </span>
                )}
              </div>

              {!isCollapsed && isUserActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* property */}
          {can('properties.view') && (
            <Link
              href="/admin/propertyManagement/propertyList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isPropertyActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaBuilding
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isPropertyActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Property Management
                  </span>
                )}
              </div>

              {!isCollapsed && isPropertyActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* project */}
          {can('projects.view') && (
            <Link
              href="/admin/project/projectList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isProjectActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaCity
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isProjectActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Project Management
                  </span>
                )}
              </div>

              {!isCollapsed && isProjectActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* blog */}
          {can('blogs.view') && (
            <Link
              href="/admin/blog/blogList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isBlogActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaNewspaper
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isBlogActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Blog Management
                  </span>
                )}
              </div>

              {!isCollapsed && isBlogActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* states & cities */}
          {can('locations.view') && (
            <Link
              href="/admin/location/locationList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isLocationActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaMapMarkedAlt
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isLocationActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    States & Cities
                  </span>
                )}
              </div>

              {!isCollapsed && isLocationActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}
          {/* site settings (footer, privacy, terms, faqs) */}

          {can('settings.view') && (
            <Link
              href="/admin/settings/siteSettings"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isSettingsActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaCog
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isSettingsActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Site Settings
                  </span>
                )}
              </div>

              {!isCollapsed && isSettingsActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* banner */}
          {can('banners.view') && (
            <Link
              href="/admin/banner/bannerList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isBannerActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaImages
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isBannerActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Banner Management
                  </span>
                )}
              </div>

              {!isCollapsed && isBannerActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* contact us messages */}
          {can('contact_messages.view') && (
            <Link
              href="/admin/contact/contactList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isContactActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaEnvelope
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isContactActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Contact Messages
                  </span>
                )}
              </div>

              {!isCollapsed && isContactActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

          {/* Events */}
          {can('event.view') && (
            <Link
              href="/admin/event/listing"
              onClick={toggleMenu}
              className={`
      group
      relative
      mb-2
      flex
      w-full
      cursor-pointer
      items-center
      rounded-lg
      px-2.5
      py-2.5
      transition-all
      duration-200
      ${isEventActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
      ${isCollapsed ? 'justify-center' : 'justify-between'}
    `}
            >
              <div
                className={`
        flex
        items-center
        ${isCollapsed ? 'justify-center' : 'gap-3'}
      `}
              >
                <FaCity
                  className={`
          h-[18px]
          w-[18px]
          flex-shrink-0
          transition-colors
          duration-200
          ${isEventActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
        `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Events
                  </span>
                )}
              </div>

              {!isCollapsed && isEventActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}


{/* Plan */}

{can('plan.view') && (
  <Link
    href="/admin/plan/listing"
    onClick={toggleMenu}
    className={`
      group
      relative
      mb-2
      flex
      w-full
      cursor-pointer
      items-center
      rounded-lg
      px-2.5
      py-2.5
      transition-all
      duration-200
      ${isPlanActive
        ? 'bg-orange-50 text-[#E87722]'
        : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
      }
      ${isCollapsed ? 'justify-center' : 'justify-between'}
    `}
  >
    <div
      className={`
        flex
        items-center
        ${isCollapsed ? 'justify-center' : 'gap-3'}
      `}
    >
      <FaClipboardList
        className={`
          h-[18px]
          w-[18px]
          flex-shrink-0
          transition-colors
          duration-200
          ${isPlanActive
            ? 'text-[#E87722]'
            : 'text-[#62748E] group-hover:text-[#E87722]'
          }
        `}
      />

      {!isCollapsed && (
        <span className="text-[13px] font-semibold">
          Plan
        </span>
      )}
    </div>

    {!isCollapsed && isPlanActive && (
      <span className="h-5 w-1 rounded-full bg-[#E87722]" />
    )}
  </Link>
)}


          {/* property enquiries (Enquire Now) */}
          {can('enquiries.view') && (
            <Link
              href="/admin/enquiry/enquiryList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isEnquiryActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaClipboardList
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isEnquiryActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Property Enquiries
                  </span>
                )}
              </div>

              {!isCollapsed && isEnquiryActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}


          {/* Roles & Permissions (super admin only) */}
          {isSuperAdmin && (
            <Link
              href="/admin/role/roleList"
              onClick={toggleMenu}
              className={`
        group
        relative
        mb-2
        flex
        w-full
        cursor-pointer
        items-center
        rounded-lg
        px-2.5
        py-2.5
        transition-all
        duration-200
        ${isRoleActive
                  ? 'bg-orange-50 text-[#E87722]'
                  : 'text-[#1A1F36] hover:bg-orange-50 hover:text-[#E87722]'
                }
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
            >
              <div
                className={`
          flex
          items-center
          ${isCollapsed ? 'justify-center' : 'gap-3'}
        `}
              >
                <FaUserShield
                  className={`
            h-[18px]
            w-[18px]
            flex-shrink-0
            transition-colors
            duration-200
            ${isRoleActive
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                    }
          `}
                />

                {!isCollapsed && (
                  <span className="text-[13px] font-semibold">
                    Roles & Permissions
                  </span>
                )}
              </div>

              {!isCollapsed && isRoleActive && (
                <span className="h-5 w-1 rounded-full bg-[#E87722]" />
              )}
            </Link>
          )}

        </div>
      </div>


      {/* ================================================================
          PROFILE + LOGOUT (fixed at bottom)
      ================================================================ */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href={profileHref}
              onClick={toggleMenu}
              title="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722] no-underline transition hover:ring-2 hover:ring-orange-200"
            >
              {userName.trim().charAt(0)}
            </Link>

            <button
              type="button"
              title="Logout"
              onClick={() => setLogoutOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
            >
              <MdOutlineLogout className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {/* Avatar + name -> profile */}
            <Link
              href={profileHref}
              onClick={toggleMenu}
              title="Profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 no-underline transition hover:bg-orange-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                {userName.trim().charAt(0)}
              </span>

              <div className="min-w-0 flex-1 leading-tight">
                <p className="mb-0 truncate text-[13px] font-semibold text-[#1A1F36]">
                  {userName}
                </p>
                <p className="mb-0 truncate text-[11px] text-[#62748E]">
                  {user?.email || 'Administrator'}
                </p>
              </div>
            </Link>

            <button
              type="button"
              title="Logout"
              onClick={() => setLogoutOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
            >
              <MdOutlineLogout className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </div>

      {/* Logout confirm */}
      <Tmodal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Are you sure you want to logout?"
        footer={
          <>
            <Button
              variant="light"
              onPress={() => setLogoutOpen(false)}
              className="font-medium text-[#62748E] hover:bg-gray-100"
            >
              Cancel
            </Button>

            <Button
              onPress={handleLogout}
              className="bg-[#E87722] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#d96b19]"
            >
              Confirm
            </Button>
          </>
        }
      />

      {/* ================================================================
          COLLAPSED HOVER DROPDOWNS
      ================================================================ */}
      {isCollapsed && hoveredMenu && (
        <div
          className="
            fixed
            z-[9999]
            w-56
            overflow-y-auto
            rounded-xl
            border
            border-gray-100
            bg-white
            py-2
            shadow-[0_10px_40px_rgba(0,23,55,0.15)]
            max-h-[70vh]
          "
          style={{
            left: '80px',
            top: `${dropdownPosition.top}px`
          }}
          onMouseEnter={() => {
            const ref =
              hoveredMenu === 'product'
                ? productRef
                : hoveredMenu === 'category'
                  ? categoryRef
                  : hoveredMenu === 'cms'
                    ? cmsRef
                    : hoveredMenu === 'form'
                      ? formRef
                      : userRef;

            handleMouseEnter(
              hoveredMenu,
              ref
            );
          }}
          onMouseLeave={handleMouseLeave}
        >

          {/* Dropdown Header */}
          <div className="border-b border-gray-100 px-4 py-3">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#E87722]" />

              <span className="text-sm font-bold capitalize text-[#1A1F36]">
                {hoveredMenu}
              </span>
            </div>
          </div>

          {/* Dropdown Links */}
          <div className="px-2 py-2">

            {hoveredMenu === 'user' &&
              renderDropdownLinks([
                {
                  href: '/dashboard/user/listing',
                  label: 'User Listing'
                }
              ])}

            {hoveredMenu === 'category' &&
              renderDropdownLinks([
                {
                  href: '/dashboard/category/createCategory',
                  label: 'Create Category'
                },
                {
                  href: '/dashboard/category/categoryListing',
                  label: 'Category Listing'
                }
              ])}
          </div>
        </div>
      )}
    </div>
  );
}
