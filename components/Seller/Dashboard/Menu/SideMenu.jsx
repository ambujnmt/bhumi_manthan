'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@heroui/react';
import { usePathname } from 'next/navigation';
import { MdOutlineMonitor } from "react-icons/md";
import { HiMenu } from "react-icons/hi";
import { LuSquareMenu } from "react-icons/lu";
import { FaPlus, FaUser } from 'react-icons/fa';
import { TiMinus } from "react-icons/ti";
import { RxDotFilled } from "react-icons/rx";
import { useUser } from '../../../../context/UserContext';

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

  const pathname = usePathname();
  const [openTab, setOpenTab] = useState('');

  const { user } = useUser();

  const role = user?.role;
const isSeller = role === "seller";

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
          MENU
      ================================================================ */}
      <div
        className="
          flex-1
          overflow-y-auto
          overflow-x-visible
          scrollbar-thin
          scrollbar-thumb-gray-300
          scrollbar-track-transparent
        "
      >

        <div className="relative p-3">

          {/* ============================================================
              DASHBOARD
          ============================================================ */}
          <Link
            href="/seller/dashboard"
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
              ${
                pathname === '/seller/dashboard'
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
                  ${
                    pathname === '/seller/dashboard'
                      ? 'text-[#E87722]'
                      : 'text-[#62748E] group-hover:text-[#E87722]'
                  }
                `}
              />

              {!isCollapsed && (
                <span className="text-[13px] font-semibold">
                  Dashboard
                </span>
              )}
            </div>

            {/* Active indicator */}
            {!isCollapsed && pathname === '/seller/dashboard' && (
              <span className="h-5 w-1 rounded-full bg-[#E87722]" />
            )}
          </Link>

          {/* ============================================================
              ADMIN ONLY
          ============================================================ */}
          {/* {isAdmin && (
            <>
              <div
                ref={userRef}
                data-menu-id="user"
                className="relative"
                onMouseEnter={() =>
                  handleMouseEnter('user', userRef)
                }
                onMouseLeave={handleMouseLeave}
              >

                <div
                  className={`
                    group
                    mb-2
                    flex
                    w-full
                    cursor-pointer
                    items-center
                    rounded-lg
                    px-2.5
                    py-2.5
                    text-[#1A1F36]
                    transition-all
                    duration-200
                    ${
                      openTab === 'user'
                        ? 'bg-orange-50 text-[#E87722]'
                        : 'hover:bg-orange-50 hover:text-[#E87722]'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                  `}
                  onClick={() =>
                    !isCollapsed &&
                    setOpenTab(
                      openTab === 'user'
                        ? ''
                        : 'user'
                    )
                  }
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
                        ${
                          openTab === 'user'
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

                  {!isCollapsed && (
                    openTab === 'user'
                      ? (
                        <TiMinus className="h-4 w-4 text-[#E87722]" />
                      )
                      : (
                        <FaPlus className="h-3 w-3 text-gray-400" />
                      )
                  )}
                </div>

                {!isCollapsed &&
                  openTab === 'user' && (
                    <div className="mb-2 ml-2 border-l border-orange-100 pl-2">
                      {renderDropdownLinks([
                        {
                          href: '/dashboard/user/listing',
                          label: 'User Listing'
                        }
                      ])}
                    </div>
                  )}
              </div>

              <div
                ref={categoryRef}
                data-menu-id="category"
                className="relative"
                onMouseEnter={() =>
                  handleMouseEnter(
                    'category',
                    categoryRef
                  )
                }
                onMouseLeave={handleMouseLeave}
              >

                <div
                  className={`
                    group
                    mb-2
                    flex
                    w-full
                    cursor-pointer
                    items-center
                    rounded-lg
                    px-2.5
                    py-2.5
                    text-[#1A1F36]
                    transition-all
                    duration-200
                    ${
                      openTab === 'category'
                        ? 'bg-orange-50 text-[#E87722]'
                        : 'hover:bg-orange-50 hover:text-[#E87722]'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                  `}
                  onClick={() =>
                    !isCollapsed &&
                    setOpenTab(
                      openTab === 'category'
                        ? ''
                        : 'category'
                    )
                  }
                >

                  <div
                    className={`
                      flex
                      items-center
                      ${isCollapsed ? 'justify-center' : 'gap-3'}
                    `}
                  >

                    <LuSquareMenu
                      className={`
                        h-5
                        w-5
                        flex-shrink-0
                        transition-colors
                        duration-200
                        ${
                          openTab === 'category'
                            ? 'text-[#E87722]'
                            : 'text-[#62748E] group-hover:text-[#E87722]'
                        }
                      `}
                    />

                    {!isCollapsed && (
                      <span className="text-[13px] font-semibold">
                        Category
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    openTab === 'category'
                      ? (
                        <TiMinus className="h-4 w-4 text-[#E87722]" />
                      )
                      : (
                        <FaPlus className="h-3 w-3 text-gray-400" />
                      )
                  )}
                </div>

                {!isCollapsed &&
                  openTab === 'category' && (
                    <div className="mb-2 ml-2 border-l border-orange-100 pl-2">
                      {renderDropdownLinks([
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
                  )}
              </div>
            </>
          )} */}
        </div>
      </div>

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

          <div className="border-b border-gray-100 px-4 py-3">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-[#E87722]" />

              <span className="text-sm font-bold capitalize text-[#1A1F36]">
                {hoveredMenu}
              </span>
            </div>
          </div>

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