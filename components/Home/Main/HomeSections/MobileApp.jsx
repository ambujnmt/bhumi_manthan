import React from 'react'

export default function MobileApp() {
    return (
        <div className="container my-[60px]"> 
            <div
                className="rounded-2xl overflow-hidden bg-cover bg-center pt-[30px] xl:pt-0 lg:pt-0 px-[15px] xl:px-[15px] lg:px-[15px] md:px-[15px]"
                style={{ backgroundImage: "url('/assets/img/app-bg.png')" }}
                >
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 max-w-6xl mx-auto">
                    {/* Left content */}
                    <div className="sm:text-center md:text-left">
                        <h2 className="text-2xl sm:text-[40px] font-bold text-white">
                            Search Property
                        </h2>
                        <h2 className="text-2xl sm:text-[40px] font-bold text-[var(--primary-color)] leading-snug">
                            On the Go
                        </h2>
                
                        <p className="text-[#DADADA] xl:text-[20px] lg:text-[20px] text-[15px] mt-4 max-w-xl">
                            Download the BhumiManthan app for voice search, instant alerts,
                            virtual tours, camera upload, and GPS-based property discovery.
                        </p>
            
                        {/* Store badges */}
                        <div className="flex mt-6 justify-center md:justify-start gap-3">
                            <div>
                                <img
                                    src="/assets/img/app-images.png"
                                    alt="image"
                                    className="h-11 xl:w-auto lg:w-auto w-[80%] mx-auto"
                                />
                            </div>
                        </div>
                    </div>
            
                    {/* Right phone mockup image */}
                    <div className="flex-shrink-0">
                        <img
                            src="/assets/img/app-img.png"
                            alt="image"
                            className="xl:w-[220px] lg:w-[220px] md:w-[180px] w-[220px] sm:w-[260px] h-auto xl:pt-[50px] lg:pt-[50px] md:pt-[50px] mt-0"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
