"use client";
import { useEffect, useState } from "react";
import { FaStar, FaUserCircle } from "react-icons/fa";
 

const CARDS = [
    {
        id: "rahul-sharma",
        name: "Rahul Sharma",
        role: "Property Buyer, Noida",
        rating: 5,
        review:
        "Finding an apartment in Sector 137 Noida was incredibly smooth. bhumimanthan.com helped us connect with verified agents and schedule tours quickly.",
    },
    {
        id: "priya-verma",
        name: "Priya Verma",
        role: "Property Buyer, Gurugram",
        rating: 5,
        review:
        "The listings were genuine and well documented. We closed our deal within two weeks without any hassle at all.",
    },
    {
        id: "amit-khanna",
        name: "Amit Khanna",
        role: "Property Investor, Delhi",
        rating: 4,
        review:
        "Great platform for comparing prices across localities. The support team was quick to respond to every query we had.",
    },
];

export default function HomeTestimonial() {
    const [cardsPerView, setCardsPerView] = useState(3);
    const [slideIndex, setSlideIndex] = useState(0);
    const [withTransition, setWithTransition] = useState(true);

    useEffect(() => {
        const updateCardsPerView = () => {
        if (window.innerWidth < 640) {
            setCardsPerView(1);
        } else if (window.innerWidth < 1024) {
            setCardsPerView(2);
        } else {
            setCardsPerView(3);
        }
        };

        updateCardsPerView();
        window.addEventListener("resize", updateCardsPerView);
        return () => window.removeEventListener("resize", updateCardsPerView);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
        setWithTransition(true);
        setSlideIndex((prev) => prev + 1);
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    const trackCards = [...CARDS, ...CARDS.slice(0, cardsPerView)];

    useEffect(() => {
        if (slideIndex === CARDS.length) {
        const resetTimer = setTimeout(() => {
            setWithTransition(false);
            setSlideIndex(0);
        }, 600);

        return () => clearTimeout(resetTimer);
        }
    }, [slideIndex]);

    useEffect(() => {
        if (!withTransition) {
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => setWithTransition(true));
        });

        return () => cancelAnimationFrame(raf);
        }
    }, [withTransition]);

    const activeDot = slideIndex % CARDS.length;

    const goToSlide = (idx) => {
        setWithTransition(true);
        setSlideIndex(idx);
    };

    return (
        <section className="w-full bg-[#F5F7FA] py-14 px-4 sm:px-8 mt-[60px]">
            <div className="container">
                <div className="grid grid-cols-12 mb-6">
                    <div className="col-span-12 text-center">
                        <h2 className="text-[28px] font-bold text-[var(--text-color1)]"> 
                            Trusted by Thousands of Happy Landlords & Buyers
                        </h2>
                        <p className="text-[16px] text-[var(--text-color2)] mb-4"> 
                            Here is what our clients have to say about their search experience with bhumimanthan.com
                        </p>
                    </div>
                </div>

                 

                {/* Card slider */}
                <div className="overflow-hidden">
                    <div
                        className="flex"
                        style={{
                        transform: `translateX(-${slideIndex * (100 / cardsPerView)}%)`,
                        transition: withTransition ? "transform 0.6s ease" : "none",
                        }}
                    >
                        {trackCards.map((card, idx) => (
                            <div
                                key={`${card.id}-${idx}`}
                                className="shrink-0 px-3"
                                style={{ width: `${100 / cardsPerView}%` }}
                            >
                                <div className="rounded-2xl p-3 bg-white border border-gray-200 shadow-sm h-full">
                                    {/* Stars */}
                                    <div className="flex gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <FaStar
                                                key={i}
                                                size={14}
                                                className={i < card.rating ? "text-yellow-400" : "text-gray-200"}
                                            />
                                        ))}
                                    </div>
                    
                                    {/* Review */}
                                    <p className="text-[14px] text-[var(--text-color1)] leading-relaxed mb-3">
                                        "{card.review}"
                                    </p>
                    
                                    {/* Reviewer */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-purple-100 text-purple-500">
                                            <FaUserCircle size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-[var(--text-color1)] mb-0">{card.name}</p>
                                            <p className="text-[12px] text-[var(--text-color2)] mb-0">{card.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                {CARDS.map((card, idx) => (
                    <button
                    key={card.id}
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeDot
                        ? "w-6 bg-[var(--primary-color)]"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    />
                ))}
                </div>
            </div>

            <style>{`
                @keyframes logo-scroll {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(-50%);
                }
                }

                .animate-logo-scroll {
                animation: logo-scroll 20s linear infinite;
                }
            `}</style>
        </section>
    );
}