import NextLink from "next/link";
import React, { useEffect, useState } from 'react'

import { FiChevronRight, FiSend, FiPhone, FiMail, FiClock } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa6";
import { Link } from '@heroui/react';
import { FaXTwitter } from "react-icons/fa6";
import { getFooter, subscribeNewsletter } from "../../../utils/fetchApi";
import { mergeFooter } from "../../../utils/footerDefaults";

// Round icon before phone / email / hours
const ContactIcon = ({ Icon }) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--primary-color)]">
    <Icon className="w-3.5 h-3.5" />
  </span>
);

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

  // Subscribe (last footer column)
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeResult, setSubscribeResult] = useState(null); // { ok, message }

  const handleSubscribe = async (event) => {
    event.preventDefault();

    const email = subscribeEmail.trim();
    if (!email || subscribing) return;

    setSubscribing(true);
    setSubscribeResult(null);

    const res = await subscribeNewsletter(email);

    setSubscribeResult({ ok: Boolean(res?.status), message: res?.message || "Something went wrong. Please try again." });
    if (res?.status) setSubscribeEmail("");
    setSubscribing(false);
  };

  // Major Cities chosen by admin (Site Settings → Footer)
  const cities = Array.isArray(footer.cities) ? footer.cities : [];
  const socials = socialIcons.filter(({ key }) => footer.social?.[key]);
  // address is not shown in footer (Contact Us page still shows it)
  const { phone, email, hours } = footer.contact || {};

  return (
    <footer className="w-full bg-[#1A2340] text-gray-200">
      <div className="container py-12">
        {/* Desktop: logo column + link columns (equal) + wider subscribe column */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:1.3fr_repeat(var(--link-cols),minmax(0,1fr))_1.6fr] gap-x-8 gap-y-10"
          style={{ "--link-cols": Math.max((footer.columns || []).length, 1) }}
        >
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

          {/* Subscribe + contact */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h6 className="text-[#fff] font-bold text-[15px] mb-4 uppercase">
              Subscribe for latest updates
            </h6>
            <ul className="space-y-3">
              {phone && (
                <li className="flex items-center gap-2.5 text-sm text-gray-200">
                  <ContactIcon Icon={FiPhone} />
                  <Link
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="text-[#fff]/80 text-[13px] font-normal hover:text-[var(--primary-color)] transition-colors break-all"
                  >
                    {phone}
                  </Link>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5 text-sm text-gray-200">
                  <ContactIcon Icon={FiMail} />
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
                  <ContactIcon Icon={FiClock} />
                  <span className="pt-1 leading-relaxed text-[#fff]/80 text-[13px]">
                    {hours}
                  </span>
                </li>
              )}
            </ul>

            {/* Subscribe */}
            <div className="mt-6">
              <form onSubmit={handleSubscribe} className="flex overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20 focus-within:ring-[var(--primary-color)]">
                <input
                  type="email"
                  required
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email for newsletter"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] text-white placeholder:text-white/50 outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  aria-label="Subscribe"
                  className="flex shrink-0 items-center gap-1.5 bg-[var(--primary-color)] px-3.5 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {subscribing ? "..." : <><FiSend className="w-3.5 h-3.5" /> <span className="hidden sm:inline lg:hidden xl:inline">Subscribe</span></>}
                </button>
              </form>
              {subscribeResult && (
                <p className={`mt-2 mb-0 text-[12px] ${subscribeResult.ok ? "text-green-300" : "text-red-300"}`}>
                  {subscribeResult.message}
                </p>
              )}
            </div>
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
