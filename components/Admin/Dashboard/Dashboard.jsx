"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { Spinner } from "@heroui/react";
import {
  FiUsers,
  FiHome,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMapPin,
  FiMessageSquare,
  FiMessageCircle,
  FiChevronRight,
} from "react-icons/fi";
import {
  HiOutlineBuildingOffice2,
  HiOutlineKey,
} from "react-icons/hi2";
import { BiBuildingHouse } from "react-icons/bi";
import { MdOutlineApartment } from "react-icons/md";
import { getDashboard } from "../../../utils/adminFetchApi"
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";
import { hasAdminAccess } from "../../../utils/adminPermissions";
import { useUser } from "../../../context/UserContext";
import { subscribeChatUnread } from "../../../utils/firebaseChat";

/*
|--------------------------------------------------------------------------
| Card / Type Styles (data comes from GET /api/admin/dashboard)
|--------------------------------------------------------------------------
*/

const STAT_CARDS = [
  {
    key: "total_properties",
    title: "Total Properties",
    icon: FiHome,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "active_listings",
    title: "Active Listings",
    icon: HiOutlineBuildingOffice2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "total_enquiries",
    title: "Total Enquiries",
    icon: FiMessageSquare,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "registered_users",
    title: "Registered Users",
    icon: FiUsers,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

const TYPE_STYLES = [
  { icon: MdOutlineApartment, bg: "bg-blue-50", color: "text-blue-600", bar: "bg-blue-500" },
  { icon: BiBuildingHouse, bg: "bg-emerald-50", color: "text-emerald-600", bar: "bg-emerald-500" },
  { icon: HiOutlineBuildingOffice2, bg: "bg-violet-50", color: "text-violet-600", bar: "bg-violet-500" },
  { icon: FiMapPin, bg: "bg-orange-50", color: "text-orange-600", bar: "bg-orange-500" },
];

const OTHER_TYPE_STYLE = { icon: HiOutlineKey, bg: "bg-gray-100", color: "text-gray-600", bar: "bg-gray-400" };

const PROPERTY_PLACEHOLDER = "/assets/img/prop-1.png";

const cardClass = "rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]";

// "2026-10-23T10:42:00Z" -> "Today, 10:42 am" / "Yesterday, 04:35 pm" / "21 Oct, 02:10 pm"
const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const time = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(value).setHours(0, 0, 0, 0)) / 86400000);

  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;

  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${time}`;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  // Chat button (header) with live unread count
  const { user } = useUser();
  const canChat = hasAdminAccess(user);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    if (!canChat) return;

    return subscribeChatUnread(setChatUnread);
  }, [canChat]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      try {
        const res = await getDashboard(year);

        if (res?.status) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [year]);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-32 text-center text-sm text-gray-500">
        Failed to load dashboard.
      </div>
    );
  }

  const monthly = data.monthly || [];
  const chartMax = Math.max(1, ...monthly.map((item) => Math.max(item.properties, item.enquiries)));
  const yearProperties = monthly.reduce((sum, item) => sum + item.properties, 0);
  const yearEnquiries = monthly.reduce((sum, item) => sum + item.enquiries, 0);

  return (
    <div className="min-h-screen [&_p]:mb-0">

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="mt-1 text-sm text-[#62748E]">
            Welcome back. Here's what's happening with your real estate
            platform today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canChat && (
            <NextLink
              href="/admin/chat"
              className="relative flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#d96818]"
            >
              <FiMessageCircle size={16} />
              <span className="hidden sm:inline">
                Chat
              </span>
              {chatUnread > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#E87722] shadow ring-2 ring-[#E87722]">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </NextLink>
          )}
        </div>
      </div>

      {/* ================================================================
          STAT CARDS
      ================================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Cards not sent by API are hidden (e.g. Registered Users for seller / broker) */}
        {STAT_CARDS.filter((card) => data.stats?.[card.key]).map((card) => {
          const Icon = card.icon;
          const stat = data.stats?.[card.key] || { total: 0, this_month: 0, change: 0 };
          const isDown = stat.change < 0;

          return (
            <div
              key={card.key}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-[#62748E]">
                    {card.title}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {Number(stat.total).toLocaleString("en-IN")}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon
                    size={21}
                    className={card.iconColor}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">

                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    isDown ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {isDown ? (
                    <FiArrowDownRight size={13} />
                  ) : (
                    <FiArrowUpRight size={13} />
                  )}

                  {stat.change > 0 ? "+" : ""}
                  {stat.change}%
                </span>

                <span className="text-xs text-gray-400">
                  {stat.this_month} new this month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================
          MAIN ANALYTICS
      ================================================================ */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ============================================================
            MONTHLY LISTINGS + ENQUIRIES CHART
        ============================================================ */}
        <div className={`${cardClass} xl:col-span-2`}>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

            <div>
              <h2 className="text-base font-bold text-[#1A1F36]">
                Listings & Enquiries Overview
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                New properties and enquiries received each month
              </p>
            </div>

            <div className="flex items-center gap-2">
              {loading && <Spinner size="sm" />}

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 outline-none"
              >
                {(data.years?.length ? data.years : [year]).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Summary */}
          <div className="mt-5 flex flex-wrap items-end gap-6">

            <div>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-2 w-2 rounded-full bg-[#E87722]" />
                Properties Added
              </p>

              <p className="mt-1 text-2xl font-bold text-[#1A1F36]">
                {yearProperties.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-2 w-2 rounded-full bg-[#001737]" />
                Enquiries Received
              </p>

              <p className="mt-1 text-2xl font-bold text-[#1A1F36]">
                {yearEnquiries.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-7 flex h-[280px] items-end gap-2 sm:gap-3">

            {monthly.map((item) => (
              <div
                key={item.month}
                className="group flex h-full flex-1 flex-col items-center justify-end"
              >

                <div className="relative flex h-full w-full items-end justify-center gap-0.5 sm:gap-1">

                  <div
                    className="w-1/2 max-w-[18px] rounded-t-md bg-[#E87722]/70 transition-all duration-300 group-hover:bg-[#E87722]"
                    style={{ height: `${(item.properties / chartMax) * 100}%` }}
                  />

                  <div
                    className="w-1/2 max-w-[18px] rounded-t-md bg-[#001737]/60 transition-all duration-300 group-hover:bg-[#001737]"
                    style={{ height: `${(item.enquiries / chartMax) * 100}%` }}
                  />

                  <span className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-medium leading-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.properties} properties
                    <br />
                    {item.enquiries} enquiries
                  </span>
                </div>

                <span className="mt-2 text-[10px] font-medium text-gray-400 sm:text-xs">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            PROPERTY TYPES
        ============================================================ */}
        <div className={cardClass}>

          <div>
            <h2 className="text-base font-bold text-[#1A1F36]">
              Property Types
            </h2>

            <p className="mt-1 text-xs text-[#62748E]">
              Distribution of listed properties
            </p>
          </div>

          <div className="mt-6 space-y-5">

            {data.property_types?.length ? (
              data.property_types.map((type, index) => {
                const style = type.name === "Other" ? OTHER_TYPE_STYLE : TYPE_STYLES[index] || OTHER_TYPE_STYLE;
                const Icon = style.icon;

                return (
                  <div key={type.name}>

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg}`}
                        >
                          <Icon
                            size={18}
                            className={style.color}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold capitalize text-gray-700">
                            {type.name}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {type.count} {type.count === 1 ? "property" : "properties"}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-bold text-gray-700">
                        {type.percentage}%
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                No properties yet
              </p>
            )}
          </div>

          <NextLink
            href="/admin/propertyManagement/propertyList"
            className="mt-6 block w-full rounded-lg border border-gray-200 py-2.5 text-center text-xs font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          >
            View All Properties
          </NextLink>
        </div>
      </div>

      {/* ================================================================
          PROPERTY + ENQUIRIES
      ================================================================ */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* ============================================================
            RECENT PROPERTIES
        ============================================================ */}
        <div className={cardClass}>

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-bold text-[#1A1F36]">
                Recent Properties
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Latest properties added to the platform
              </p>
            </div>

            <NextLink
              href="/admin/propertyManagement/propertyList"
              className="text-xs font-semibold text-orange-600 no-underline hover:text-orange-700 hover:no-underline"
            >
              View All
            </NextLink>
          </div>

          <div className="mt-4 space-y-2.5">
            {data.recent_properties?.length ? (
              data.recent_properties.map((property) => (
                <NextLink
                  key={property.id}
                  href={`/admin/propertyManagement/propertyDetail/${property.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 no-underline transition hover:border-orange-200 hover:bg-orange-50/40 hover:no-underline"
                >
                  {/* Image + listing tag + status dot */}
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-24">
                    <img
                      src={property.main_image || PROPERTY_PLACEHOLDER}
                      onError={imageFallback(PROPERTY_PLACEHOLDER)}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    {property.listing_type && (
                      <span className="absolute left-1 top-1 max-w-[88%] truncate rounded bg-[#E87722] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white shadow">
                        {property.listing_type}
                      </span>
                    )}

                    <span
                      title={property.is_active ? "Active" : "Inactive"}
                      className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        property.is_active ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                  </div>

                  {/* Title + location + type */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1A1F36] transition group-hover:text-[#E87722]">
                      {property.title || "-"}
                    </p>

                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-400">
                      <FiMapPin size={11} className="shrink-0" />
                      <span className="truncate">
                        {[property.location, property.city].filter(Boolean).join(", ") || "-"}
                      </span>
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {property.property_type && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-[#62748E]">
                          {property.property_type}
                        </span>
                      )}

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          property.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {property.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Price + arrow */}
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="whitespace-nowrap text-sm font-bold text-[#001737]">
                      {formatPropertyPrice(property.price)}
                    </p>

                    <span className="hidden h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition group-hover:bg-white group-hover:text-[#E87722] sm:flex">
                      <FiChevronRight size={16} />
                    </span>
                  </div>
                </NextLink>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <FiHome className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No properties yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            RECENT ENQUIRIES
        ============================================================ */}
        <div className={cardClass}>

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-bold text-[#1A1F36]">
                Recent Enquiries
                {data.enquiry_unread > 0 && (
                  <span className="ml-2 rounded-full bg-[#E87722] px-2 py-0.5 align-middle text-[10px] font-bold text-white">
                    {data.enquiry_unread} unread
                  </span>
                )}
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Latest enquiries from potential buyers
              </p>
            </div>

            <NextLink
              href="/admin/enquiry/enquiryList"
              className="text-xs font-semibold text-orange-600 no-underline hover:text-orange-700 hover:no-underline"
            >
              View All
            </NextLink>
          </div>

          <div className="mt-3">

            {data.recent_enquiries?.length ? (
              data.recent_enquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
                >

                  {/* First letter avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                    {(enquiry.name || enquiry.email || "?").trim().charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-2">

                      <p className="truncate text-sm font-semibold text-gray-700">
                        {enquiry.name || "-"}
                      </p>

                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold leading-4 ${
                          enquiry.is_read
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {enquiry.is_read ? "Read" : "New"}
                      </span>
                    </div>

                    <p className="truncate text-[11px] leading-4 text-gray-400">
                      {enquiry.property?.title || enquiry.property_title || "General enquiry"}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {[enquiry.phone, formatDate(enquiry.created_at)].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <NextLink
                    href="/admin/enquiry/enquiryList"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    <FiMessageSquare size={15} />
                  </NextLink>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                No enquiries yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
