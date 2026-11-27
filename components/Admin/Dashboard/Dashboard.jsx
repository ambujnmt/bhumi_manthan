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
  FiGift,
  FiCalendar,
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
    href: "/admin/propertyManagement/propertyList",
  },
  {
    key: "active_listings",
    title: "Active Listings",
    icon: HiOutlineBuildingOffice2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/admin/propertyManagement/propertyList",
  },
  {
    key: "total_enquiries",
    title: "Total Enquiries",
    icon: FiMessageSquare,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    href: "/admin/lead/leadList",
  },
  {
    key: "registered_users",
    title: "Registered Users",
    icon: FiUsers,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/admin/user/userManagement",
  },
  // Seller / broker (instead of Registered Users): their own events
  {
    key: "total_events",
    title: "My Events",
    icon: FiCalendar,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/admin/event/listing",
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

/*
|--------------------------------------------------------------------------
| Loading placeholders: page shows at once, each card fills in when data comes
|--------------------------------------------------------------------------
*/

const Bone = ({ className = "" }) => <span aria-hidden="true" className={`block animate-pulse rounded bg-gray-100 ${className}`} />;

const StatCardSkeleton = () => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Bone className="h-4 w-28" />
        <Bone className="mt-3 h-7 w-16" />
      </div>
      <Bone className="h-11 w-11 rounded-xl" />
    </div>
    <Bone className="mt-4 h-3 w-40" />
  </div>
);

// Fixed heights (no Math.random: same on server and client)
const CHART_SKELETON_HEIGHTS = [35, 55, 40, 70, 50, 85, 60, 45, 75, 55, 65, 40];

const ListRowSkeleton = ({ image = false }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
    <Bone className={image ? "h-16 w-20 shrink-0 rounded-lg sm:w-24" : "h-9 w-9 shrink-0 rounded-full"} />
    <div className="flex-1">
      <Bone className="h-4 w-3/4" />
      <Bone className="mt-2 h-3 w-1/2" />
    </div>
    <Bone className="h-4 w-14" />
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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
    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setFailed(false);

      try {
        const res = await getDashboard(year);

        if (!active) return;

        if (res?.status) {
          setData(res.data);
        } else {
          setFailed(true);
        }
      } catch (error) {
        if (!active) return;
        console.error("Failed to fetch dashboard:", error);
        setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();

    // Year changed again before the answer -> ignore the old answer
    return () => {
      active = false;
    };
  }, [year, reloadKey]);

  // No full page loader: the page shows at once, cards show placeholders until data comes
  const ready = Boolean(data);

  const monthly = data?.monthly || [];
  const chartMax = Math.max(1, ...monthly.map((item) => Math.max(item.properties, item.enquiries)));
  const yearProperties = monthly.reduce((sum, item) => sum + item.properties, 0);
  const yearEnquiries = monthly.reduce((sum, item) => sum + item.enquiries, 0);

  // Festival offer running (seller / broker): from the logged in user's listing quota
  const offer = user?.listing_quota?.offer;

  return (
    <div className="min-h-screen [&_p]:mb-0" aria-busy={loading}>

      {/* Load failed: page stays, message + retry on top */}
      {failed && !loading && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{ready ? "Could not refresh the dashboard." : "Failed to load dashboard."}</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {offer?.ends_at && (
        <div
          role="status"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-orange-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5 text-sm text-purple-900">
            <FiGift className="mt-0.5 shrink-0 text-purple-600" size={18} aria-hidden="true" />
            <p>
              <b>{offer.title || "Festival offer"}:</b> post unlimited properties till{" "}
              <b>
                {new Date(offer.ends_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </b>
              .
            </p>
          </div>
          <NextLink
            href="/admin/propertyManagement/createProperty"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#6D28D9]"
          >
            Post Property
          </NextLink>
        </div>
      )}

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="mt-1 text-sm text-[#62748E]">
            &ldquo;Welcome! Here&apos;s what&apos;s happening with your real estate platform today.&rdquo;
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

        {/* Loading: 4 placeholder cards */}
        {!ready && Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index} />)}

        {/* Cards not sent by API are hidden (e.g. Registered Users for seller / broker) */}
        {ready && STAT_CARDS.filter((card) => data.stats?.[card.key]).map((card) => {
          const Icon = card.icon;
          const stat = data.stats?.[card.key] || { total: 0, this_month: 0, change: 0 };
          const isDown = stat.change < 0;

          // Every card opens its list page
          const CardTag = card.href ? NextLink : "div";

          return (
            <CardTag
              key={card.key}
              {...(card.href ? { href: card.href } : {})}
              className="block rounded-xl border border-gray-100 bg-white p-4 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
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
                  {stat.upcoming !== undefined
                    ? `${stat.upcoming} upcoming · ${stat.this_month} new this month`
                    : `${stat.this_month} new this month`}
                </span>
              </div>
            </CardTag>
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
              {/* Year change: small spinner, old chart stays until the new one comes */}
              {loading && ready && <Spinner size="sm" />}

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={!ready}
                aria-label="Year"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 outline-none disabled:opacity-60"
              >
                {(data?.years?.length ? data.years : [year]).map((item) => (
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

              {ready ? (
                <p className="mt-1 text-2xl font-bold text-[#1A1F36]">
                  {yearProperties.toLocaleString("en-IN")}
                </p>
              ) : (
                <Bone className="mt-2 h-7 w-14" />
              )}
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-2 w-2 rounded-full bg-[#001737]" />
                Enquiries Received
              </p>

              {ready ? (
                <p className="mt-1 text-2xl font-bold text-[#1A1F36]">
                  {yearEnquiries.toLocaleString("en-IN")}
                </p>
              ) : (
                <Bone className="mt-2 h-7 w-14" />
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="mt-7 flex h-[280px] items-end gap-2 sm:gap-3">

            {/* Loading: 12 placeholder bars */}
            {!ready &&
              CHART_SKELETON_HEIGHTS.map((height, index) => (
                <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div className="flex h-full w-full items-end justify-center">
                    <span aria-hidden="true" className="block w-full max-w-[36px] animate-pulse rounded-t-md bg-gray-100" style={{ height: `${height}%` }} />
                  </div>
                  <Bone className="mt-2 h-3 w-6" />
                </div>
              ))}

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

            {!ready ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3">
                    <Bone className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Bone className="h-4 w-24" />
                      <Bone className="mt-1.5 h-3 w-16" />
                    </div>
                    <Bone className="h-4 w-8" />
                  </div>
                  <Bone className="mt-2 h-1.5 w-full rounded-full" />
                </div>
              ))
            ) : data.property_types?.length ? (
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
            {!ready ? (
              Array.from({ length: 4 }, (_, index) => <ListRowSkeleton key={index} image />)
            ) : data.recent_properties?.length ? (
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
                {data?.enquiry_unread > 0 && (
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
              href="/admin/lead/leadList"
              className="text-xs font-semibold text-orange-600 no-underline hover:text-orange-700 hover:no-underline"
            >
              View All
            </NextLink>
          </div>

          <div className="mt-3">

            {!ready ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }, (_, index) => <ListRowSkeleton key={index} />)}
              </div>
            ) : data.recent_enquiries?.length ? (
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
                      {enquiry.property?.title || enquiry.property_title || enquiry.project_title || "General enquiry"}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      {[enquiry.phone, formatDate(enquiry.created_at)].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <NextLink
                    href="/admin/lead/leadList"
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
