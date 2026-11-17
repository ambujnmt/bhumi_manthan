import NextLink from "next/link";
import PageBannerImage from "../../Common/PageBannerImage";
import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import {
    FaBuilding,
    FaBullhorn,
    FaBullseye,
    FaChartBar,
    FaChartLine,
    FaCheck,
    FaChevronRight,
    FaCrown,
    FaGem,
    FaHandshake,
    FaHome,
    FaRocket,
    FaShieldAlt,
    FaStar,
    FaUserFriends,
    FaUsers,
} from "react-icons/fa";
import { FaFacebook, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { SiGoogleads } from "react-icons/si";
import { getMyPlanOrders, getPlans } from "../../../utils/fetchApi";
import { useRouter } from "next/router";
import { useUser } from "../../../context/UserContext";
import { showToast } from "../../../store/toast";
import { rememberPostLoginRedirect } from "../../../utils/postLoginRedirect";
import BuyPlanModal, { isFreePlan } from "./BuyPlanModal";
import {
    EXTRA_CHARGES_KEY,
    PLAN_FEATURES,
    PLAN_FEATURES_SHORT,
    PLAN_MARKETING,
    featureRows,
    toFeatureMap,
} from "../../../utils/planFeatures";
import { PlanIllustration } from "./PlanIllustrations";
import SideAds from "../../Common/Ads/SideAds";

const NAVY = "#12305F";
const GOLD = "#D4961C";

// Banner image: public/images/plans-banner.jpg

const PERIOD_LABELS = {
    year: "/ Year",
    month: "/ Month",
    one_time: "One Time",
    free: "",
};

const VALIDITY = {
    year: "Valid for 1 Year",
    month: "Valid for 1 Month",
    one_time: "One-time Payment",
    free: "Free Forever (No Expiry)",
};

const MARKETING_ICONS = {
    google_ads: <SiGoogleads className="text-[#4285F4]" />,
    facebook: <FaFacebook className="text-[#1877F2]" />,
    twitter: <FaXTwitter className="text-black" />,
    linkedin: <FaLinkedin className="text-[#0A66C2]" />,
};

// Card icons: API se plan.icon na aaye to index ke hisaab se ye use honge
const PLAN_ICONS = [FaHome, FaBuilding, FaRocket, FaGem, FaStar];

const HERO_POINTS = [
    { icon: FaUsers, text: "Reach Verified Buyers & Tenants" },
    { icon: FaChartBar, text: "Increase Property Visibility" },
    { icon: FaBullseye, text: "Get Quality Leads" },
    { icon: FaHandshake, text: "Trusted Platform for Owners, Brokers & Builders" },
];

const TRUST_POINTS = [
    { icon: FaHome, text: "More Property Views" },
    { icon: FaUserFriends, text: "Genuine Buyer Leads" },
    { icon: FaChartLine, text: "Better Business Growth" },
    { icon: FaShieldAlt, text: "Trusted & Secure Platform" },
];

const WHY_CHOOSE = [
    "Dedicated to Real Estate Listings",
    "Easy to Use Platform",
    "Reach Verified Buyers & Tenants",
    "Boost Your Property Visibility",
    "Trusted by Property Owners, Brokers & Builders",
];

const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });

// Middle plan is highlighted (only when there are 3+ plans)
const highlightIndex = (count) => (count >= 3 ? Math.floor(count / 2) : -1);

// "1 + 1" offer when a plan has paid + free listings, else "11 listings"
const listingInfo = (plan) => {
    const paid = Number(plan.paid_listings) || 0;
    const free = Number(plan.free_listings) || 0;
    const total = Number(plan.total_listings) || paid + free;

    if (paid > 0 && free > 0) {
        return {
            badge: `${paid} + ${free}`,
            lines: [
                `List ${paid} ${paid === 1 ? "Property" : "Properties"}`,
                `Get ${free} Additional Free`,
                `(Total ${total} Listings)`,
            ],
            table: `${total} (${paid} + ${free})`,
            check: `List up to ${total} Properties (${paid} + ${free})`,
        };
    }

    return {
        badge: String(total),
        lines: ["Property Listings"],
        table: String(total),
        check: `List up to ${total} Properties`,
    };
};

// Card bullet list: listings, included features, support, validity
const checklist = (plan) => {
    const included = featureRows(plan.features, PLAN_FEATURES).filter((row) => row.enabled);
    const has = (key) => included.some((row) => row.key === key);
    const items = [listingInfo(plan).check];

    included.forEach((row) => {
        // Photos + videos read better as one line
        if (row.key === "videos_brochure" && has("property_photos_details")) return;

        items.push(
            row.key === "property_photos_details" && has("videos_brochure")
                ? "Property Photos, Videos & Brochure"
                : row.label
        );
    });

    if (plan.support_level) items.push(`${plan.support_level} Support`);
    if (VALIDITY[plan.billing_period]) items.push(VALIDITY[plan.billing_period]);

    return items;
};

// Card icon: API icon URL ho to wo, warna react-icons fallback (popular = crown)
function PlanIcon({ plan, index, popular }) {
    const Icon = popular ? FaCrown : PLAN_ICONS[index % PLAN_ICONS.length];
    const color = popular ? GOLD : NAVY;
    const image = plan?.icon;

    return (
        <div
            className="mx-auto mb-3 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white shadow-md"
            style={{ border: `2px solid ${color}` }}
        >
            {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={image}
                    alt={plan.name || "Plan icon"}
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                />
            ) : (
                <Icon className="text-[30px]" style={{ color }} />
            )}
        </div>
    );
}

function MarketingBox({ plan }) {
    const services = featureRows(plan.marketing_services, PLAN_MARKETING, [EXTRA_CHARGES_KEY])
        .filter((row) => row.enabled);
    const extraCharges = toFeatureMap(plan.marketing_services)[EXTRA_CHARGES_KEY];

    if (services.length === 0) return null;

    return (
        <div className="mt-5 rounded-xl border border-[#F1D58A] bg-[#FFF8E6] px-3 py-3 text-center">
            <div className="flex items-start gap-2">
                <FaBullhorn className="mt-1 shrink-0 text-[22px]" style={{ color: NAVY }} />
                <p className="flex-1 text-[13px] font-semibold leading-5 text-[#B42318]">
                    Digital Marketing Services Available{" "}
                    <span style={{ color: NAVY }}>({services.map((row) => row.label).join(", ")})</span>{" "}
                    for More Leads Generation
                    {extraCharges && <span className="block">+ Extra Charges Apply</span>}
                </p>
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-4 text-[24px]">
                {services
                    .filter((row) => MARKETING_ICONS[row.key])
                    .map((row) => (
                        <span key={row.key} title={row.label} className="rounded bg-white p-0.5 leading-none">
                            {MARKETING_ICONS[row.key]}
                        </span>
                    ))}
            </div>
        </div>
    );
}

// state: "current" | "pending" | null (button text / disabled)
function PlanCard({ plan, index, popular, state, onBuy }) {
    const listing = listingInfo(plan);
    const accent = popular ? GOLD : NAVY;
    const disabled = state === "current" || state === "pending";
    const buttonText =
        state === "current" ? "Your Current Plan"
            : state === "pending" ? "Request Pending"
                : isFreePlan(plan) ? "Get Started Free"
                    : "Buy Now";

    return (
        <div
            className={`relative flex h-full flex-col rounded-2xl bg-white shadow-lg ${popular ? "border-2 lg:-mt-5" : "border border-[#E3EAF3]"}`}
            style={popular ? { borderColor: GOLD } : undefined}
        >
            {popular && (
                <span
                    className="absolute -top-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg px-6 py-2 text-[15px] font-bold text-white shadow"
                    style={{ backgroundColor: GOLD }}
                >
                    <FaCrown /> Most Popular
                </span>
            )}

            {/* Icon + name + who it's for */}
            <div className={`rounded-t-2xl px-5 pb-4 text-center ${popular ? "bg-[#FFF8E6] pt-8" : "bg-[#EEF4FB] pt-6"}`}>
                <PlanIcon plan={plan} index={index} popular={popular} />

                <h2
                    className="text-[21px] font-extrabold leading-tight xl:text-[23px]"
                    style={{ color: popular ? "#8A5A00" : NAVY }}
                >
                    {plan.name}
                </h2>
                {plan.description && (
                    <p className="mt-1.5 text-[15px] leading-6 text-[#3B4A63]">{plan.description}</p>
                )}
            </div>

            <div className="flex flex-1 flex-col px-5 pb-6">
                {/* Price */}
                <div className="mt-4 flex items-baseline justify-center gap-1.5" style={{ color: NAVY }}>
                    <span className="text-[44px] font-extrabold leading-none">
                        {Number(plan.price) === 0 ? "Free" : formatPrice(plan.price)}
                    </span>
                    {Number(plan.price) > 0 && (
                        <span className="text-[17px] font-medium">{PERIOD_LABELS[plan.billing_period] || ""}</span>
                    )}
                </div>

                {/* Listings badge + illustration */}
                <div className="mt-5 flex items-end">
                    <div
                        className="relative z-10 w-[52%] shrink-0 rounded-[32px] bg-[#FCEBC0] px-3 py-3 text-center"
                        style={{ color: "#3A2A05" }}
                    >
                        <span className="block text-[34px] font-extrabold leading-none">{listing.badge}</span>
                        {listing.lines.map((line) => (
                            <span key={line} className="mt-0.5 block text-[13px] font-bold leading-[1.3]">{line}</span>
                        ))}
                    </div>

                    {/* Admin plan image (Admin -> Plans), else the SVG illustration */}
                    {plan.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={plan.image}
                            alt={plan.name || "Plan image"}
                            loading="lazy"
                            className="-ml-6 h-[130px] min-w-0 flex-1 object-contain object-bottom mix-blend-multiply"
                        />
                    ) : (
                        <PlanIllustration index={index} className="-ml-6 h-[130px] min-w-0 flex-1" />
                    )}
                </div>

                {/* What's included */}
                <ul className="mt-5">
                    {checklist(plan).map((item) => (
                        <li key={item} className="flex items-start gap-3 border-b border-[#EDF1F6] py-2 text-[15px] text-[#1F2A44] last:border-b-0">
                            <span
                                className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: accent }}
                            >
                                <FaCheck size={11} />
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>

                <MarketingBox plan={plan} />

                <div className="mt-auto pt-6">
                    <button
                        type="button"
                        onClick={() => onBuy(plan)}
                        disabled={disabled}
                        className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-2 rounded-lg py-3 text-[18px] font-bold text-white shadow transition hover:opacity-90 disabled:cursor-default disabled:opacity-60"
                        style={{ backgroundColor: state === "current" ? "#16A34A" : accent }}
                    >
                        {state === "current" && <FaCheck size={14} />}
                        {buttonText}
                        {!disabled && <FaChevronRight size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ComparisonTable({ plans, popular }) {
    const rows = featureRows(
        Object.assign({}, ...plans.map((plan) => toFeatureMap(plan.features))),
        PLAN_FEATURES
    );

    const cellClass = (index) =>
        `px-3 py-2 text-center ${index === popular ? "bg-[#FFF8E6]" : ""}`;

    return (
        <div className="overflow-x-auto rounded-xl border border-[#E3EAF3] bg-white shadow">
            <table className="w-full min-w-[560px] text-[14px]">
                <thead>
                    <tr className="text-white">
                        <th className="px-4 py-3 text-left text-[15px] font-bold" style={{ backgroundColor: NAVY }}>
                            Features
                        </th>
                        {plans.map((plan, index) => (
                            <th
                                key={plan.id}
                                className="border-l border-white/20 px-3 py-2.5 text-center font-semibold leading-tight"
                                style={{ backgroundColor: index === popular ? GOLD : NAVY }}
                            >
                                {plan.name.replace(/\s+Package$/i, "")}
                                <span className="block">{formatPrice(plan.price)}</span>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="text-[#1F2A44]">
                    <tr className="border-t border-[#EDF1F6]">
                        <td className="px-4 py-2">Number of Property Listings</td>
                        {plans.map((plan, index) => (
                            <td key={plan.id} className={`${cellClass(index)} font-semibold`}>
                                {listingInfo(plan).table}
                            </td>
                        ))}
                    </tr>

                    {rows.map((row) => (
                        <tr key={row.key} className="border-t border-[#EDF1F6]">
                            <td className="px-4 py-2">{PLAN_FEATURES_SHORT[row.key] || row.label}</td>
                            {plans.map((plan, index) => (
                                <td key={plan.id} className={cellClass(index)}>
                                    {toFeatureMap(plan.features)[row.key] ? (
                                        <FaCheck className="mx-auto" style={{ color: NAVY }} />
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}

                    <tr className="border-t border-[#EDF1F6]">
                        <td className="px-4 py-2">Customer Support</td>
                        {plans.map((plan, index) => (
                            <td key={plan.id} className={cellClass(index)}>
                                {plan.support_level || "-"}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

// initialPlans: loaded on server (pages/web/plans), null = load in browser
export default function PlanList({ initialPlans = null, initialBanner }) {
    const [plans, setPlans] = useState(initialPlans ?? []);
    const [loading, setLoading] = useState(initialPlans === null);

    useEffect(() => {
        if (initialPlans !== null) return;

        const fetchPlans = async () => {
            try {
                const res = await getPlans();
                setPlans(res?.data?.plans ?? []);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [initialPlans]);

    const popular = highlightIndex(plans.length);

    // Buying (cash / offline payment): seller / broker only
    const router = useRouter();
    const { user, updateUser } = useUser() || {};
    const canBuy = ["seller", "broker"].includes(user?.role);
    const [mine, setMine] = useState(null);
    const [buyPlan, setBuyPlan] = useState(null);

    const loadMine = async () => {
        try {
            const res = await getMyPlanOrders();
            setMine(res.data);
            // Keep the cached user (Add Property limit banner) up to date
            if (res.data?.listing_quota && user) updateUser?.({ ...user, listing_quota: res.data.listing_quota });
        } catch {
            setMine(null);
        }
    };

    useEffect(() => {
        if (canBuy) loadMine();
        else setMine(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canBuy, user?.id]);

    const quota = mine?.listing_quota;
    const pendingOrder = mine?.orders?.find((order) => order.status === "pending");
    const activePlanId = quota?.source === "plan" ? quota.plan_id : null;

    const planState = (plan) =>
        plan.id === activePlanId ? "current" : pendingOrder?.plan_id === plan.id ? "pending" : null;

    const handleBuy = (plan) => {
        if (!user) {
            rememberPostLoginRedirect("/web/plans");
            router.push("/login");
            return;
        }

        if (!canBuy) {
            showToast("Plans are for sellers and brokers. Please contact us to list as a seller or broker.", "error", 5000);
            return;
        }

        if (pendingOrder) {
            showToast(`You already have a pending request (${pendingOrder.order_no}). Cancel it first to choose another plan.`, "error", 5000);
            return;
        }

        setBuyPlan(plan);
    };

    return (
        <>
            {/* Hero with banner image */}
            <section className="relative overflow-hidden py-12 lg:py-16">
                {/* Image: Admin -> Banner (type: Plans Page) */}
                <PageBannerImage
                    type="plans"
                    initialBanner={initialBanner}
                    alt="Bhumimanthan plans banner"
                />
                {/* Dark navy overlay taaki text clear dikhe */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(18,48,95,0.80) 0%, rgba(18,48,95,0.65) 100%)",
                    }}
                />

                <div className="container relative text-center">
                    <h1 className="text-[28px] font-extrabold leading-tight text-white lg:text-[42px]">
                        Grow Your Real Estate Business with bhumimanthan
                    </h1>
                    <p className="mx-auto mt-3 max-w-3xl text-[16px] text-white/90 lg:text-[19px]">
                        List your properties, reach genuine buyers & tenants, and get more business opportunities.
                    </p>

                    <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-5 lg:grid-cols-4">
                        {HERO_POINTS.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center justify-center gap-3 text-left">
                                <Icon className="shrink-0 text-[34px]" style={{ color: GOLD }} />
                                <span className="text-[14px] leading-5 text-white">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container py-12">
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : plans.length === 0 ? (
                    <p className="py-16 text-center text-[var(--text-color2)]">Plans will be available soon.</p>
                ) : (
                    <>
                        {/* Plan cards. Ads (Admin -> Ads, "Pricing Plans") sit left / right of them */}
                        <SideAds page="plans" sticky={false} railClass="lg:mt-0" wrapClass="">
                            <div
                                className={`grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-2 ${plans.length >= 3 ? "lg:grid-cols-3" : ""}`}
                            >
                                {plans.map((plan, index) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        index={index}
                                        popular={index === popular}
                                        state={canBuy ? planState(plan) : null}
                                        onBuy={handleBuy}
                                    />
                                ))}
                            </div>
                        </SideAds>

                        {/* Trust strip */}
                        <div className="mt-8 grid grid-cols-2 gap-5 rounded-xl bg-[#EEF4FB] px-6 py-5 lg:grid-cols-4">
                            {TRUST_POINTS.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center justify-center gap-3">
                                    <Icon className="shrink-0 text-[34px]" style={{ color: GOLD }} />
                                    <span className="text-[15px] font-semibold leading-5" style={{ color: NAVY }}>
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Comparison + why choose */}
                        <div className="mt-8 grid grid-cols-12 gap-5">
                            <div className="col-span-12 lg:col-span-8">
                                <ComparisonTable plans={plans} popular={popular} />
                            </div>

                            <div className="col-span-12 flex flex-col rounded-xl border border-[#E3EAF3] bg-white p-5 shadow lg:col-span-4">
                                <h2 className="text-[22px] font-extrabold" style={{ color: NAVY }}>
                                    Why Choose bhumimanthan?
                                </h2>

                                <ul className="mt-4 mb-6 space-y-3">
                                    {WHY_CHOOSE.map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-[15px] text-[#1F2A44]">
                                            <span
                                                className="mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-white"
                                                style={{ backgroundColor: GOLD }}
                                            >
                                                <FaCheck size={10} />
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <NextLink
                                    href="/signUp"
                                    className="mt-auto flex items-center justify-center gap-2 rounded-lg py-3.5 no-underline text-[18px] font-bold text-white shadow transition hover:opacity-90"
                                    style={{ backgroundColor: GOLD }}
                                >
                                    Post Your Property Now <FaChevronRight size={14} />
                                </NextLink>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {buyPlan && (
                <BuyPlanModal
                    plan={buyPlan}
                    onClose={() => setBuyPlan(null)}
                    onDone={loadMine}
                />
            )}
        </>
    );
}