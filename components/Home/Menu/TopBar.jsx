"use client";

import { Link } from "@heroui/react";
import { FaPhoneAlt, FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

export default function TopBar() {
    return (
        <section className="w-full border-b border-b-[#ccc] py-[6px] text-white text-xs md:text-sm">
            <div className="container">
                <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-4">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3"> 
                            <span className="flex items-center gap-1.5">
                                <FaPhoneAlt className="text-[var(--primary-color)]" size={12} />
                                <Link href="tel:7567437594" className="hover:text-[var(--primary-color)] text-black font-light text-[14px]">
                                    7567437594 &nbsp;
                                </Link>
                                <span className="hidden md:inline text-black/40">|</span>
                            </span>

                            <span className="flex items-center gap-1.5">
                                <HiOutlineMail className="text-[var(--primary-color)]" size={14} />
                                <Link href="mailto:cdoe@mituniversity.edu.in" className="hover:text-[var(--primary-color)] text-black font-light text-[14px]">
                                    cdoe@mituniversity.edu.in
                                </Link>
                            </span>
                        </div>
                    </div>
                    <div className="col-span-4 block m-auto">
                        <Link href="#" className="flex items-center gap-3 shrink-0">
                        <img
                            src="/assets/images/logo2.svg"
                            alt="image"
                        />
                        </Link>
                    </div>
                    <div className="col-span-4">
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                            <Link href="#" className="hover:text-[var(--primary-color)] text-black font-light text-[14px] transition-all duration-300 ease-in-out">
                                Campus Life
                            </Link>
                            <span className="text-black/40">|</span>
                            <Link href="#" className="hover:text-[var(--primary-color)] text-black font-light text-[14px] transition-all duration-300 ease-in-out">
                                Research
                            </Link>
                            <span className="text-black/40">|</span>
                            <Link href="#" className="hover:text-[var(--primary-color)] text-black font-light text-[14px] transition-all duration-300 ease-in-out">
                                All Programs
                            </Link>

                            <span className="flex items-center gap-3 ml-2"> 
                                <Link href="#"
                                aria-label="Facebook"
                                className="hover:text-[#ccc] text-[var(--primary-color)] transition-colors"
                                >
                                    <FaFacebookF size={15} />
                                </Link> 
                                <Link href="#"
                                aria-label="Instagram"
                                className="hover:text-[#ccc] text-[var(--primary-color)] transition-colors"
                                >
                                    <FaInstagram size={15} />
                                </Link> 
                                <Link href="#"
                                aria-label="LinkedIn"
                                className="hover:text-[#ccc] text-[var(--primary-color)] transition-colors"
                                >
                                    <FaLinkedinIn size={15} />
                                </Link>
                            </span>
                        </div>
                    </div>
                </div> 
            </div>
        </section>
    );
}