import React from 'react'
import {
  FaSearch,
  FaCheckCircle,
  FaRupeeSign,
  FaUserTie,
  FaShieldAlt,
} from "react-icons/fa";

export default function MiddleColumn() {
    return (
        <div className="container mt-[60px]">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x divide-gray-200">
                    {/* Easy Search */}
                    <div className="flex items-center gap-3 lg:px-4 lg:first:pl-0">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-indigo-200 text-indigo-700">
                        <FaSearch size={15} />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[var(--text-color1)] mb-0">Easy Search</p>
                        <p className="text-[12px] text-[#252527] mt-0.5 mb-0">User Friendly Filters</p>
                    </div>
                    </div>
            
                    {/* Verified Listings */}
                    <div className="flex items-center gap-3 lg:px-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-indigo-200 text-indigo-700">
                        <FaCheckCircle size={15} /> 
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[var(--text-color1)] mb-0">Verified Listings</p>
                        <p className="text-[12px] text-[#252527] mt-0.5 mb-0">100% Genuine Properties</p>
                    </div>
                    </div>
            
                    {/* Best Price */}
                    <div className="flex items-center gap-3 lg:px-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-indigo-200 text-indigo-700">
                        <FaRupeeSign size={15} />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[var(--text-color1)] mb-0">Best Price</p>
                        <p className="text-[12px] text-[#252527] mt-0.5 mb-0">Get best deals</p>
                    </div>
                    </div>
            
                    {/* Expert Support */}
                    <div className="flex items-center gap-3 lg:px-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-indigo-200 text-indigo-700">
                        <FaUserTie size={15} />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[var(--text-color1)] mb-0">Expert Support</p>
                        <p className="text-[12px] text-[#252527] mt-0.5 mb-0">Consultation &amp; Assistance</p>
                    </div>
                    </div>
            
                    {/* Secure Transactions */}
                    <div className="flex items-center gap-3 lg:px-4 lg:last:pr-0">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-indigo-200 text-indigo-700">
                        <FaShieldAlt size={15} />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[var(--text-color1)] mb-0">Secure Transactions</p>
                        <p className="text-[12px] text-[#252527] mt-0.5 mb-0">Verified Documentation</p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
