"use client";

import React from "react";
import {
  FiUsers,
  FiHome,
  FiDollarSign,
  FiMoreVertical,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMapPin,
  FiMessageSquare,
  FiPlus,
  FiCalendar,
  FiEye,
  FiPhone,
  FiCheckCircle,
  FiTrendingUp,
  FiBriefcase,
} from "react-icons/fi";

import {
  HiOutlineBuildingOffice2,
  HiOutlineKey,
} from "react-icons/hi2";

import { BiBuildingHouse } from "react-icons/bi";
import { MdOutlineApartment } from "react-icons/md";
import { useUser } from "../../../context/UserContext";

export default function Dashboard() {
  const { user } = useUser();

  const brokerName = user?.name || "Broker";

  /*
  |--------------------------------------------------------------------------
  | BROKER STATS
  |--------------------------------------------------------------------------
  */

  const stats = [
    {
      title: "My Properties",
      value: "48",
      change: "+6",
      changeType: "up",
      description: "this month",
      icon: FiHome,
      iconBg: "bg-orange-50",
      iconColor: "text-[#E87722]",
    },
    {
      title: "Active Listings",
      value: "32",
      change: "+4",
      changeType: "up",
      description: "this month",
      icon: HiOutlineBuildingOffice2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "New Inquiries",
      value: "126",
      change: "+18.4%",
      changeType: "up",
      description: "vs last month",
      icon: FiMessageSquare,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "Total Deals",
      value: "18",
      change: "+3",
      changeType: "up",
      description: "this month",
      icon: FiCheckCircle,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | MONTHLY PERFORMANCE
  |--------------------------------------------------------------------------
  */

  const monthlyPerformance = [
    { month: "Jan", value: 42 },
    { month: "Feb", value: 54 },
    { month: "Mar", value: 48 },
    { month: "Apr", value: 67 },
    { month: "May", value: 58 },
    { month: "Jun", value: 74 },
    { month: "Jul", value: 69 },
    { month: "Aug", value: 82 },
    { month: "Sep", value: 76 },
    { month: "Oct", value: 88 },
    { month: "Nov", value: 84 },
    { month: "Dec", value: 94 },
  ];

  /*
  |--------------------------------------------------------------------------
  | PROPERTY TYPES
  |--------------------------------------------------------------------------
  */

  const propertyTypes = [
    {
      name: "Apartments",
      count: "18",
      percentage: "38%",
      icon: MdOutlineApartment,
      bg: "bg-blue-50",
      color: "text-blue-600",
      bar: "bg-blue-500",
      width: "w-[38%]",
    },
    {
      name: "Villas",
      count: "12",
      percentage: "25%",
      icon: BiBuildingHouse,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      bar: "bg-emerald-500",
      width: "w-[25%]",
    },
    {
      name: "Commercial",
      count: "8",
      percentage: "17%",
      icon: HiOutlineBuildingOffice2,
      bg: "bg-violet-50",
      color: "text-violet-600",
      bar: "bg-violet-500",
      width: "w-[17%]",
    },
    {
      name: "Plots",
      count: "6",
      percentage: "12%",
      icon: FiMapPin,
      bg: "bg-orange-50",
      color: "text-orange-600",
      bar: "bg-orange-500",
      width: "w-[12%]",
    },
    {
      name: "Other",
      count: "4",
      percentage: "8%",
      icon: HiOutlineKey,
      bg: "bg-gray-100",
      color: "text-gray-600",
      bar: "bg-gray-400",
      width: "w-[8%]",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT PROPERTIES
  |--------------------------------------------------------------------------
  */

  const recentProperties = [
    {
      id: 1,
      name: "Luxury 3 BHK Apartment",
      location: "Golf Course Road, Gurgaon",
      type: "Apartment",
      price: "₹1.85 Cr",
      status: "Active",
      views: "248",
      inquiries: "18",
      image:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      name: "Modern Family Villa",
      location: "Whitefield, Bangalore",
      type: "Villa",
      price: "₹2.45 Cr",
      status: "Active",
      views: "184",
      inquiries: "12",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      name: "Premium Commercial Space",
      location: "Cyber City, Gurgaon",
      type: "Commercial",
      price: "₹3.20 Cr",
      status: "Pending",
      views: "326",
      inquiries: "27",
      image:
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 4,
      name: "Residential Plot",
      location: "Noida Extension, Noida",
      type: "Plot",
      price: "₹78 Lakh",
      status: "Active",
      views: "156",
      inquiries: "9",
      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT INQUIRIES
  |--------------------------------------------------------------------------
  */

  const recentInquiries = [
    {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      phone: "+91 98765 43210",
      property: "Luxury 3 BHK Apartment",
      date: "Today, 10:42 AM",
      status: "New",
      initials: "AS",
    },
    {
      name: "Emily Johnson",
      email: "emily@example.com",
      phone: "+91 98765 42110",
      property: "Modern Family Villa",
      date: "Today, 09:18 AM",
      status: "Contacted",
      initials: "EJ",
    },
    {
      name: "Rahul Mehta",
      email: "rahul@example.com",
      phone: "+91 98765 41210",
      property: "Premium Commercial Space",
      date: "Yesterday, 04:35 PM",
      status: "New",
      initials: "RM",
    },
    {
      name: "Sophia Williams",
      email: "sophia@example.com",
      phone: "+91 98765 40120",
      property: "Residential Plot",
      date: "Yesterday, 02:10 PM",
      status: "Contacted",
      initials: "SW",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT ACTIVITIES
  |--------------------------------------------------------------------------
  */

  const activities = [
    {
      icon: FiHome,
      title: "New property listed",
      description: "Luxury 3 BHK Apartment was added",
      time: "12 minutes ago",
      bg: "bg-orange-50",
      color: "text-[#E87722]",
    },
    {
      icon: FiMessageSquare,
      title: "New buyer inquiry",
      description: "Aarav Sharma sent an inquiry",
      time: "38 minutes ago",
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      icon: FiCalendar,
      title: "Property viewing scheduled",
      description: "Viewing scheduled for Modern Villa",
      time: "1 hour ago",
      bg: "bg-violet-50",
      color: "text-violet-600",
    },
    {
      icon: FiCheckCircle,
      title: "Deal closed",
      description: "Residential property deal completed",
      time: "2 hours ago",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
     

          <p className="mt-1 text-sm text-[#62748E]">
            Welcome back, {brokerName}. Here's an overview of your property
            business today.
          </p>
        </div>

       
      </div>

      {/* ================================================================
          BROKER PERFORMANCE SUMMARY
      ================================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-[#62748E]">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#001737]">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon
                    size={21}
                    className={stat.iconColor}
                  />
                </div>

              </div>

              <div className="mt-4 flex items-center gap-2">

                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  {stat.changeType === "up" ? (
                    <FiArrowUpRight size={13} />
                  ) : (
                    <FiArrowDownRight size={13} />
                  )}

                  {stat.change}
                </span>

                <span className="text-xs text-gray-400">
                  {stat.description}
                </span>

              </div>
            </div>
          );
        })}

      </div>

      {/* ================================================================
          EARNINGS + LEADS SUMMARY
      ================================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Commission */}

        <div className="rounded-xl bg-[#001737] p-5 text-white shadow-sm md:col-span-2">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <FiDollarSign size={18} />
                </div>

                <p className="text-sm font-medium text-white/70">
                  Total Commission Earned
                </p>
              </div>

              <h2 className="mt-3 text-3xl font-bold">
                ₹18.64 Lakh
              </h2>

              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <FiArrowUpRight size={13} />
                  18.7%
                </span>

                <span className="text-xs text-white/50">
                  compared to last month
                </span>
              </div>

            </div>

            <div className="rounded-xl bg-white/10 p-4 sm:min-w-[170px]">

              <p className="text-xs text-white/50">
                This Month
              </p>

              <p className="mt-1 text-xl font-bold">
                ₹2.86 Lakh
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-[#E87722]" />
              </div>

              <p className="mt-1.5 text-[10px] text-white/50">
                72% of monthly target
              </p>

            </div>

          </div>

        </div>

        {/* Leads */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-[#62748E]">
                Lead Conversion
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#001737]">
                24.8%
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <FiTrendingUp
                size={21}
                className="text-emerald-600"
              />
            </div>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-[62%] rounded-full bg-emerald-500" />
          </div>

          <div className="mt-3 flex items-center justify-between">

            <span className="text-xs text-gray-400">
              126 total leads
            </span>

            <span className="text-xs font-semibold text-emerald-600">
              +4.2%
            </span>

          </div>

        </div>

      </div>

      {/* ================================================================
          PERFORMANCE + PROPERTY TYPES
      ================================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ============================================================
            PERFORMANCE CHART
        ============================================================= */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-2">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

            <div>
              <h2 className="text-base font-bold text-[#001737]">
                Business Performance
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Your property activity and performance throughout the year
              </p>
            </div>

            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 outline-none">
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
            </select>

          </div>

          {/* Summary */}

          <div className="mt-5 flex flex-wrap gap-8">

            <div>
              <p className="text-xs text-gray-400">
                Properties Sold
              </p>

              <p className="mt-1 text-2xl font-bold text-[#001737]">
                18
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Total Views
              </p>

              <p className="mt-1 text-2xl font-bold text-[#001737]">
                12.8K
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Buyer Inquiries
              </p>

              <p className="mt-1 text-2xl font-bold text-[#E87722]">
                126
              </p>
            </div>

          </div>

          {/* Chart */}

          <div className="mt-7 flex h-[280px] items-end gap-2 sm:gap-3">

            {monthlyPerformance.map((item) => (
              <div
                key={item.month}
                className="group flex h-full flex-1 flex-col items-center justify-end"
              >

                <div className="relative flex h-full w-full items-end">

                  <div
                    className="w-full rounded-t-md bg-orange-100 transition-all duration-300 group-hover:bg-orange-200"
                    style={{
                      height: `${item.value}%`,
                    }}
                  />

                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-[#E87722] opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      height: `${item.value}%`,
                    }}
                  />

                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#001737] px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.value}%
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
            MY PROPERTY TYPES
        ============================================================= */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-bold text-[#001737]">
                My Property Portfolio
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Distribution of your listings
              </p>
            </div>

            <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
              <FiMoreVertical />
            </button>

          </div>

          <div className="mt-6 space-y-5">

            {propertyTypes.map((type) => {
              const Icon = type.icon;

              return (
                <div key={type.name}>

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${type.bg}`}
                      >
                        <Icon
                          size={18}
                          className={type.color}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {type.name}
                        </p>

                        <p className="text-[11px] text-gray-400">
                          {type.count} listings
                        </p>
                      </div>

                    </div>

                    <span className="text-sm font-bold text-gray-700">
                      {type.percentage}
                    </span>

                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">

                    <div
                      className={`h-full rounded-full ${type.bar} ${type.width}`}
                    />

                  </div>

                </div>
              );
            })}

          </div>

          <button className="mt-6 w-full rounded-lg border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
            Manage My Properties
          </button>

        </div>

      </div>

      {/* ================================================================
          RECENT PROPERTIES + RECENT INQUIRIES
      ================================================================= */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* ============================================================
            RECENT PROPERTIES
        ============================================================= */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-bold text-[#001737]">
                My Recent Listings
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Recently added properties
              </p>
            </div>

            <button className="text-xs font-semibold text-[#E87722] hover:text-[#d96818]">
              View All
            </button>

          </div>

          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead>

                <tr className="border-b border-gray-100 text-left">

                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Property
                  </th>

                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Price
                  </th>

                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Views
                  </th>

                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentProperties.map((property) => (

                  <tr
                    key={property.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >

                    <td className="py-3">

                      <div className="flex items-center gap-3">

                        <img
                          src={property.image}
                          alt={property.name}
                          className="h-11 w-11 rounded-lg object-cover"
                        />

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-gray-700">
                            {property.name}
                          </p>

                          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-400">
                            <FiMapPin size={11} />
                            {property.location}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="py-3 text-sm font-bold text-gray-700">
                      {property.price}
                    </td>

                    <td className="py-3">

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FiEye size={13} />
                        {property.views}
                      </div>

                      <p className="mt-1 text-[10px] text-gray-400">
                        {property.inquiries} inquiries
                      </p>

                    </td>

                    <td className="py-3">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          property.status === "Active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-yellow-50 text-yellow-600"
                        }`}
                      >
                        {property.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ============================================================
            RECENT INQUIRIES
        ============================================================= */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-bold text-[#001737]">
                Recent Buyer Inquiries
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Latest leads from potential buyers
              </p>
            </div>

            <button className="text-xs font-semibold text-[#E87722] hover:text-[#d96818]">
              View All
            </button>

          </div>

          <div className="mt-4">

            {recentInquiries.map((inquiry) => (

              <div
                key={inquiry.email}
                className="flex items-center gap-3 border-b border-gray-50 py-3.5 last:border-0"
              >

                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#001737] text-xs font-bold text-white">
                  {inquiry.initials}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between gap-2">

                    <p className="truncate text-sm font-semibold text-gray-700">
                      {inquiry.name}
                    </p>

                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                        inquiry.status === "New"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {inquiry.status}
                    </span>

                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-gray-400">
                    {inquiry.property}
                  </p>

                  <div className="mt-1 flex items-center gap-3">

                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <FiCalendar size={10} />
                      {inquiry.date}
                    </span>

                  </div>

                </div>

                <div className="flex items-center gap-1">

                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-orange-50 hover:text-[#E87722]">
                    <FiMessageSquare size={15} />
                  </button>

                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600">
                    <FiPhone size={14} />
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}