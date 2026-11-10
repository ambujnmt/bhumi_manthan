"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageTitle from "../../Breadcrumb/PageTitle";
import HeaderSettings from "./HeaderSettings";
import FaviconSettings from "./FaviconSettings";
import FooterSettings from "./FooterSettings";
import CmsPageSettings from "./CmsPageSettings";
import FaqSettings from "./FaqSettings";

const tabs = [
    { key: "header", label: "Header" },
    { key: "footer", label: "Footer" },
    { key: "privacy_policy", label: "Privacy Policy" },
    { key: "terms_conditions", label: "Terms & Conditions" },
    { key: "faqs", label: "FAQs" },
];

export default function SiteSettings() {
    const router = useRouter();
    const [tab, setTab] = useState("header");

    // ?tab=faqs opens that tab directly
    useEffect(() => {
        if (router.isReady && tabs.some((item) => item.key === router.query.tab)) {
            setTab(router.query.tab);
        }
    }, [router.isReady, router.query.tab]);

    const changeTab = (key) => {
        setTab(key);
        // as: keep the role URL (/seller/settings/...) instead of the /admin page path
        router.replace(
            { pathname: router.pathname, query: { tab: key } },
            { pathname: router.asPath.split("?")[0], query: { tab: key } },
            { shallow: true }
        );
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Site Settings", active: true },
                ]}
                title="Site Settings"
            />

            <div className="scrollbar-hide mt-6 mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">
                {tabs.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => changeTab(item.key)}
                        className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition
                        ${tab === item.key
                                ? "border-[#E87722] text-[#E87722]"
                                : "border-transparent text-[#62748E] hover:text-[#E87722]"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === "header" && (
                <>
                    <HeaderSettings />
                    <FaviconSettings />
                </>
            )}
            {tab === "footer" && <FooterSettings />}
            {(tab === "privacy_policy" || tab === "terms_conditions") && (
                <CmsPageSettings key={tab} pageKey={tab} />
            )}
            {tab === "faqs" && <FaqSettings />}
        </div>
    );
}
