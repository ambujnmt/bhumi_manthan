import NextLink from "next/link";
import React, { useEffect, useState } from 'react'

import { FiChevronRight } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa6";
import { Link } from '@heroui/react';
import { FaXTwitter } from "react-icons/fa6";
import { getFooter } from "../../../utils/fetchApi";
import { mergeFooter } from "../../../utils/footerDefaults";

const socialIcons = [
  { key: "facebook", Icon: FaFacebookF, label: "Facebook" },
  { key: "instagram", Icon: FaInstagram, label: "Instagram" },
  { key: "linkedin", Icon: FaLinkedinIn, label: "LinkedIn" },
  { key: "twitter", Icon: FaXTwitter, label: "X (Twitter)" },
  { key: "youtube", Icon: FaYoutube, label: "YouTube" },
];

// External links open in new tab
const linkProps = (href) =>
  /^https?:\/\//.test(href || "")
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

export default function Footer() {
  // Default footer shows instantly, saved settings replace it after load
  const [footer, setFooter] = useState(() => mergeFooter(null));

  useEffect(() => {
    getFooter()
      .then((res) => setFooter(mergeFooter(res?.data?.footer)))
      .catch((error) => console.error("Failed to fetch footer:", error));
  }, []);

  // Major Cities chosen by admin (Site Settings → Footer)
  const cities = Array.isArray(footer.cities) ? footer.cities : [];
  const socials = socialIcons.filter(({ key }) => footer.social?.[key]);
  const { address, phone, email, hours } = footer.contact || {};

  return (
    <footer className="w-full bg-[#1A2340] text-gray-200">
      <div className="container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
          {/* About Us */}
          <div className="col-span-2 sm:col-span-1">
            <img
              src={footer.logo}
              alt="Bhoomi Manthan"
              className="w-[80%] h-auto mb-4"
            />
            {footer.about_text && (
              <p className="text-[#fff]/80 text-[13px] mb-0">
                {footer.about_text}
              </p>
            )}

            {/* Stay Connected */}
            {socials.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  {socials.map(({ key, Icon, label }) => (
                    <Link
                      key={key}
                      href={footer.social[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[#fff] hover:bg-[var(--primary-color)] hover:text-white transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link Columns */}
          {(footer.columns || []).map((column, columnIndex) => (
            <div key={columnIndex}>
              <h6 className="text-[#fff] font-bold text-[15px] mb-4 uppercase">
                {column.title}
              </h6>
              <ul className="space-y-2">
                {(column.links || []).map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href || "#"}
                      {...linkProps(item.href)}
                      className="flex items-start gap-1.5 text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors pb-1"
                    >
                      <FiChevronRight className="mt-1 shrink-0 w-3.5 h-3.5 text-[var(--primary-color)]" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h6 className="text-[#fff] font-bold text-[15px] mb-4 uppercase">
              Contact Us
            </h6>
            <ul className="space-y-3">
              {address && (
                <li className="flex items-start gap-2.5 text-sm text-gray-200">
                  <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors"
                  >
                    {address}
                  </Link>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-2.5 text-sm text-gray-200">
                  <Link
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors break-all"
                  >
                    {phone}
                  </Link>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2.5 text-sm text-gray-200">
                  <Link
                    href={`mailto:${email}`}
                    className="text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors break-all"
                  >
                    {email}
                  </Link>
                </li>
              )}
              {hours && (
                <li className="flex items-start gap-2.5 text-sm text-[15px] text-white font-normal hover:text-white">
                  <span className="leading-relaxed text-[#fff]/80 text-[13px]">
                    {hours}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Major Cities */}
      {footer.show_cities && cities.length > 0 && (
        <div className="container">
          <div className="border-t border-white/20 lg:py-4 pb-[50px] pt-[10px]">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <h6 className="text-[#fff] font-bold text-[15px] mb-4 uppercase">
                  {footer.cities_title || "Major Cities in India"}
                </h6>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <ul className="flex flex-wrap gap-2">
                  {cities.map((city, index) => (
                    <React.Fragment key={city.id}>
                      {index > 0 && (
                        <li aria-hidden="true" className="text-white text-[20px] px-1 font-thin relative top-[-3px]">|</li>
                      )}
                      <li className="mb-2">
                        <NextLink
                          href={`/web/property/searchProperties?city=${encodeURIComponent(city.name)}`}
                          className="block bg-white/10 text-[#fff]/80 text-[12px] px-3 py-1 rounded-sm hover:bg-[var(--primary-color)] hover:text-white transition-colors"
                        >
                          {city.name}
                        </NextLink>
                      </li>
                    </React.Fragment>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="container">
        <div className="lg:py-4 xl:pb-[20px] pb-[10px] pt-[10px] border-t border-white/20 xl:mt-[40px] mt-[0px] xl:flex items-center justify-between text-center">
          <p className="text-[#fff]/80 text-[13px] mb-0">
            {(footer.copyright || "").replace("{year}", new Date().getFullYear())}
          </p>
          <div className="">
            {(footer.bottom_links || []).map((item, i) => (
              <Link
                key={i}
                href={item.href || "#"}
                {...linkProps(item.href)}
                className="text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors mr-5 last:mr-0">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
