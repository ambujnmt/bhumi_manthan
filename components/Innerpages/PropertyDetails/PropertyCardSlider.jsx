"use client";

import { useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

export default function PropertyCardSlider() {
    const sliderRef = useRef(null);

    // Ek card ki width + gap calculate karke utna scroll karta hai
    const scrollByOneSlide = (direction) => {
        const slider = sliderRef.current;
        if (!slider || !slider.firstElementChild) return;

        const card = slider.firstElementChild;
        const gap = parseInt(window.getComputedStyle(slider).columnGap) || 0;
        const step = card.offsetWidth + gap;

        slider.scrollBy({ left: direction * step, behavior: "smooth" });
    };

    return (
        <section className="w-full bg-white">
            <div className="relative container">
                {/* Prev button */}
                <button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => scrollByOneSlide(-1)}
                    className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/5 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:left-0 sm:h-11 sm:w-11"
                >
                    <FaArrowLeft className="text-base" />
                </button>

                {/* Slider track */}
                <div
                    ref={sliderRef}
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                {/* Slide 1 */}
                <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                    <img
                        src="/assets/img/cardsliderimg1.png"
                        alt="image"
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Slide 2 */}
                <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                    <img
                    src="/assets/img/cardsliderimg2.png"
                    alt="image"
                    className="h-full w-full object-cover"
                    />
                </div>

                {/* Slide 3 */}
                <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                    <img
                    src="/assets/img/cardsliderimg3.png"
                    alt="image"
                    className="h-full w-full object-cover"
                    />
                </div>

                {/* Slide 4 */}
                <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                    <img
                    src="/assets/img/cardsliderimg3.png"
                    alt="image"
                    className="h-full w-full object-cover"
                    />
                </div>

                {/* Slide 5 */}
                <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                    <img
                    src="/assets/img/cardsliderimg2.png"
                    alt="image"
                    className="h-full w-full object-cover"
                    />
                </div>

                    {/* Slide 6 */}
                    <div className="h-44 w-full shrink-0 snap-start overflow-hidden rounded-lg sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2.25rem)/4)]">
                        <img
                        src="/assets/img/cardsliderimg1.png"
                        alt="image"
                        className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {/* Next button */}
                <button
                    type="button"
                    aria-label="Next slide"
                    onClick={() => scrollByOneSlide(1)}
                    className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/5 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:right-0 sm:h-11 sm:w-11"
                >
                    <FaArrowRight className="text-base" />
                </button>
            </div>
        </section>
    );
}