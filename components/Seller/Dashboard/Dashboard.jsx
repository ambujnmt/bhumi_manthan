"use client";

import React from "react";
import {
  FiHome,
  FiDollarSign,
  FiShoppingBag,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMapPin,
  FiMoreVertical,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiMessageSquare,
  FiCalendar,
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

  const sellerName = user?.name || "Seller";

  /*
  |--------------------------------------------------------------------------
  | SELLER STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = [
    {
      title: "My Properties",
      value: "42",
      change: "+5",
      changeType: "up",
      description: "this month",
      icon: FiHome,
      iconBg: "bg-orange-50",
      iconColor: "text-[#E87722]",
    },
    {
      title: "Active Listings",
      value: "28",
      change: "+3",
      changeType: "up",
      description: "this month",
      icon: HiOutlineBuildingOffice2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Leads",
      value: "₹48.6 L",
      change: "+16.8%",
      changeType: "up",
      description: "vs last month",
      icon: FiShoppingBag,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Current Leads",
      value: "₹12.8 L",
      change: "+12.4%",
      changeType: "up",
      description: "vs last month",
      icon: FiDollarSign,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | MONTHLY SALES
  |--------------------------------------------------------------------------
  */

  const monthlySales = [
    { month: "Jan", value: 38 },
    { month: "Feb", value: 48 },
    { month: "Mar", value: 42 },
    { month: "Apr", value: 58 },
    { month: "May", value: 54 },
    { month: "Jun", value: 68 },
    { month: "Jul", value: 62 },
    { month: "Aug", value: 76 },
    { month: "Sep", value: 72 },
    { month: "Oct", value: 84 },
    { month: "Nov", value: 79 },
    { month: "Dec", value: 92 },
  ];

  /*
  |--------------------------------------------------------------------------
  | PROPERTY TYPES
  |--------------------------------------------------------------------------
  */

  const propertyTypes = [
    {
      name: "Apartments",
      count: "16",
      percentage: "38%",
      icon: MdOutlineApartment,
      bg: "bg-blue-50",
      color: "text-blue-600",
      bar: "bg-blue-500",
      width: "w-[38%]",
    },
    {
      name: "Villas",
      count: "10",
      percentage: "24%",
      icon: BiBuildingHouse,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      bar: "bg-emerald-500",
      width: "w-[24%]",
    },
    {
      name: "Commercial",
      count: "7",
      percentage: "17%",
      icon: HiOutlineBuildingOffice2,
      bg: "bg-violet-50",
      color: "text-violet-600",
      bar: "bg-violet-500",
      width: "w-[17%]",
    },
    {
      name: "Plots",
      count: "5",
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
      percentage: "9%",
      icon: HiOutlineKey,
      bg: "bg-gray-100",
      color: "text-gray-600",
      bar: "bg-gray-400",
      width: "w-[9%]",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT LISTINGS
  |--------------------------------------------------------------------------
  */

  const recentListings = [
    {
      id: 1,
      name: "Luxury 3 BHK Apartment",
      location: "Golf Course Road, Gurgaon",
      type: "Apartment",
      price: "₹1.85 Cr",
      status: "Published",
      views: "1,248",
      inquiries: "32",
      image:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      name: "Modern Family Villa",
      location: "Whitefield, Bangalore",
      type: "Villa",
      price: "₹2.45 Cr",
      status: "Published",
      views: "986",
      inquiries: "24",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      name: "Premium Commercial Space",
      location: "Cyber City, Gurgaon",
      type: "Commercial",
      price: "₹3.20 Cr",
      status: "Under Review",
      views: "642",
      inquiries: "14",
      image:
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 4,
      name: "Residential Plot",
      location: "Noida Extension, Noida",
      type: "Plot",
      price: "₹78 Lakh",
      status: "Published",
      views: "528",
      inquiries: "11",
      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT ORDERS / SALES
  |--------------------------------------------------------------------------
  */

  const recentSales = [
    {
      customer: "Aarav Sharma",
      property: "Luxury 3 BHK Apartment",
      amount: "₹1.85 Cr",
      date: "Today, 10:42 AM",
      status: "Completed",
      initials: "AS",
    },
    {
      customer: "Rahul Mehta",
      property: "Residential Plot",
      amount: "₹78 Lakh",
      date: "Today, 09:18 AM",
      status: "Processing",
      initials: "RM",
    },
    {
      customer: "Emily Johnson",
      property: "Modern Family Villa",
      amount: "₹2.45 Cr",
      date: "Yesterday, 04:35 PM",
      status: "Completed",
      initials: "EJ",
    },
    {
      customer: "Sophia Williams",
      property: "Commercial Space",
      amount: "₹3.20 Cr",
      date: "Yesterday, 02:10 PM",
      status: "Pending",
      initials: "SW",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | SELLER ACTIVITIES
  |--------------------------------------------------------------------------
  */

  const activities = [
    {
      icon: FiPlus,
      title: "New property added",
      description: "Luxury 3 BHK Apartment was listed",
      time: "12 minutes ago",
      bg: "bg-orange-50",
      color: "text-[#E87722]",
    },
    {
      icon: FiShoppingBag,
      title: "New sale received",
      description: "Order received for Residential Plot",
      time: "38 minutes ago",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      icon: FiMessageSquare,
      title: "New customer inquiry",
      description: "A buyer contacted you about Villa",
      time: "1 hour ago",
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      icon: FiCheckCircle,
      title: "Payment completed",
      description: "₹1.85 Cr payment successfully received",
      time: "2 hours ago",
      bg: "bg-violet-50",
      color: "text-violet-600",
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
            Welcome back, {sellerName}. Manage your properties, sales and
            earnings from here.
          </p>

        </div>



      </div>

      {/* ================================================================
          SELLER STAT CARDS
      ================================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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
          EARNINGS + ORDER SUMMARY
      ================================================================= */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Earnings */}

        <div className="rounded-xl bg-[#001737] p-5 text-white shadow-sm lg:col-span-2">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <FiDollarSign size={18} />
                </div>

                <p className="text-sm font-medium text-white/70">
                  Seller Earnings
                </p>

              </div>

              <h2 className="mt-3 text-3xl font-bold">
                ₹12.80 Lakh
              </h2>

              <div className="mt-2 flex items-center gap-2">

                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <FiArrowUpRight size={13} />
                  12.4%
                </span>

                <span className="text-xs text-white/50">
                  compared to last month
                </span>

              </div>

            </div>

            <div className="rounded-xl bg-white/10 p-4 sm:min-w-[180px]">

              <p className="text-xs text-white/50">
                This Month
              </p>

              <p className="mt-1 text-xl font-bold">
                ₹2.64 Lakh
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[76%] rounded-full bg-[#E87722]" />
              </div>

              <p className="mt-1.5 text-[10px] text-white/50">
                76% of monthly target
              </p>

            </div>

          </div>

        </div>

        {/* Orders */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-[#62748E]">
                Orders This Month
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#001737]">
                24
              </h2>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <FiShoppingBag
                size={21}
                className="text-blue-600"
              />
            </div>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">

            <div className="rounded-lg bg-emerald-50 p-2.5">
              <p className="text-lg font-bold text-emerald-600">
                16
              </p>
              <p className="text-[10px] text-gray-500">
                Completed
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-2.5">
              <p className="text-lg font-bold text-yellow-600">
                5
              </p>
              <p className="text-[10px] text-gray-500">
                Processing
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-2.5">
              <p className="text-lg font-bold text-blue-600">
                3
              </p>
              <p className="text-[10px] text-gray-500">
                Pending
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ================================================================
          SALES PERFORMANCE + PROPERTY PORTFOLIO
      ================================================================= */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Sales Chart */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-2">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

            <div>

              <h2 className="text-base font-bold text-[#001737]">
                Website traffic and my property traffic performance
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Your monthly property traffic performance
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
                Total Sales
              </p>

              <p className="mt-1 text-2xl font-bold text-[#001737]">
                ₹48.6 L
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                This Month
              </p>

              <p className="mt-1 text-2xl font-bold text-[#E87722]">
                ₹6.82 L
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Average Order
              </p>

              <p className="mt-1 text-2xl font-bold text-[#001737]">
                ₹2.03 L
              </p>
            </div>

          </div>

          {/* Chart */}

          <div className="mt-7 flex h-[280px] items-end gap-2 sm:gap-3">

            {monthlySales.map((item) => (

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
                    ₹{item.value}K
                  </span>

                </div>

                <span className="mt-2 text-[10px] font-medium text-gray-400 sm:text-xs">
                  {item.month}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Portfolio */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-base font-bold text-[#001737]">
                My Portfolio
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Your property inventory
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
            Manage Inventory
          </button>

        </div>

      </div>

      {/* ================================================================
          LISTINGS + SALES
      ================================================================= */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Recent Listings */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-base font-bold text-[#001737]">
                Recent Listings
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Your recently added properties
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

                {recentListings.map((property) => (

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
                          property.status === "Published"
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

        {/* Recent Visitors */}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-base font-bold text-[#001737]">
                Recent Visitors
              </h2>

              <p className="mt-1 text-xs text-[#62748E]">
                Latest customer purchases
              </p>

            </div>

            <button className="text-xs font-semibold text-[#E87722] hover:text-[#d96818]">
              View All
            </button>

          </div>

          <div className="mt-4">

            {recentSales.map((sale) => (

              <div
                key={sale.customer}
                className="flex items-center gap-3 border-b border-gray-50 py-3.5 last:border-0"
              >

                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#001737] text-xs font-bold text-white">
                  {sale.initials}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between gap-2">

                    <p className="truncate text-sm font-semibold text-gray-700">
                      {sale.customer}
                    </p>

                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                        sale.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : sale.status === "Processing"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      {sale.status}
                    </span>

                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-gray-400">
                    {sale.property}
                  </p>

                  <div className="mt-1 flex items-center gap-3">

                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <FiCalendar size={10} />
                      {sale.date}
                    </span>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-xs font-bold text-[#001737]">
                    {sale.amount}
                  </p>

                  <button className="mt-1 text-[10px] font-semibold text-[#E87722]">
                    View
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
