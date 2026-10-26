import { Link } from '@heroui/react'
import React from 'react'

export default function AboutPropertyDetail() {
    return (
        <> 
            {/* More Details */}
            <div className="mt-10 border-t border-gray-100 pt-8">
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                    More Details
                </h2>
                <div className="grid grid-cols-1 gap-x-2 gap-y-1 sm:grid-cols-1">
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Price Breakup</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            ₹7.25 Cr · ₹15,000 per sq. ft.
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Address</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            Sector 63, Golf Course Extension Road, Gurugram
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Property Type</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            Commercial Office
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Age of Property</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            2–5 Years
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Cabins</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            3 Private Cabins
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Furnishing</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            Fully Furnished
                        </span>
                    </div>
                    <div className="flex items-center border-b border-gray-100 pb-3 gap-6">
                        <span className="text-sm text-gray-500">Type of Ownership</span>
                        <span className="text-sm font-semibold text-[#202D47]">
                            Freehold
                        </span>
                    </div>
                </div>


                <div className="mt-5">
                    <h5 className="text-lg font-bold text-gray-900">
                        Description
                    </h5>
                    <p className="text-[14px] text-text-[var(--text-color1)] mt-2 leading-relaxed">Premium office space at DLF Corporate Greens, designed for modern businesses seeking a professional and well-connected workplace. Contemporary layout, ample natural light, high-speed connectivity and modern infrastructure make it ideal for startups, corporate offices and growing enterprises. <Link href="#" className="text-[var(--primary-color)] font-bold"> Read more </Link></p>
                </div>
            </div>
        </>
    )
}
