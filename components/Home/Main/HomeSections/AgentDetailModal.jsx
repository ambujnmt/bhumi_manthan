"use client";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { FaStar } from "react-icons/fa";
import { FiBriefcase, FiMapPin, FiPhone, FiX } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { Spinner } from "@heroui/react";
import { useUser } from "../../../../context/UserContext";
import { getAgentDetail, rateAgent } from "../../../../utils/fetchApi";
import { formatPropertyPrice, imageFallback } from "../../../../utils/formatPrice";
import AgentStars, { AgentAvatar } from "./AgentStars";

const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Seller / broker detail: contact, rating summary, properties, reviews, "Rate" form.
 * agent = card data (shown right away), full detail loads from /agents/{key}.
 */
export default function AgentDetailModal({ agent, onClose, onRated }) {
    const { user } = useUser();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: "", text: "" });

    const open = Boolean(agent);

    // Load detail when a card is opened
    useEffect(() => {
        if (!agent?.key) return;

        let active = true;

        setDetail(null);
        setError("");
        setLoading(true);
        setRating(0);
        setText("");
        setFormMessage({ type: "", text: "" });

        getAgentDetail(agent.key).then((res) => {
            if (!active) return;

            if (res?.status) {
                setDetail(res.data);
                setRating(res.data?.my_review?.rating || 0);
                setText(res.data?.my_review?.review || "");
            } else if (agent.fallback) {
                // Ratings API not available -> card data, empty ratings, no rate form
                setDetail({
                    agent,
                    rating_breakdown: {},
                    properties: (agent.properties || []).slice(0, 6),
                    reviews: [],
                    my_review: null,
                    offline: true,
                });
            } else {
                setError(res?.message || "Could not load details.");
            }

            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [agent?.key]);

    // Latest onClose without re-running the effect below on every parent render
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Escape closes, page behind does not scroll
    useEffect(() => {
        if (!open) return;

        const onKey = (event) => event.key === "Escape" && onCloseRef.current();
        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open) return null;

    const info = { ...agent, ...(detail?.agent || {}) };
    const breakdown = detail?.rating_breakdown || {};
    const reviews = detail?.reviews || [];
    const properties = detail?.properties || [];
    const isCustomer = user?.role === "customer";

    const submitRating = async (event) => {
        event.preventDefault();

        if (saving) return;

        if (!rating) {
            setFormMessage({ type: "error", text: "Please select a rating." });
            return;
        }

        setSaving(true);
        setFormMessage({ type: "", text: "" });

        const res = await rateAgent(agent.key, { rating, review: text.trim() });

        setSaving(false);

        if (!res?.status) {
            setFormMessage({ type: "error", text: res?.message || "Could not save your rating." });
            return;
        }

        const saved = res.data.review;

        setDetail((previous) => ({
            ...previous,
            agent: { ...previous?.agent, rating_avg: res.data.rating_avg, rating_count: res.data.rating_count },
            rating_breakdown: res.data.rating_breakdown,
            my_review: saved,
            reviews: [saved, ...(previous?.reviews || []).filter((item) => item.id !== saved.id)],
        }));

        onRated?.(agent.key, { rating_avg: res.data.rating_avg, rating_count: res.data.rating_count });
        setFormMessage({ type: "success", text: res.message || "Thank you for your rating." });
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="agent-modal-title"
                className="relative my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-red-500"
                >
                    <FiX className="text-xl" />
                </button>

                {/* Header */}
                <div className="bg-[#FFF6EA] px-6 pb-6 pt-7 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <AgentAvatar agent={info} className="h-20 w-20 text-2xl" />
                        <div className="min-w-0 flex-1 pr-10">
                            <h3 id="agent-modal-title" className="mb-1 flex items-center gap-2 text-[22px] font-bold text-[var(--secondary-color)]">
                                <span className="truncate">{info.name}</span>
                                {info.verified && <MdVerified className="shrink-0 text-[#3B82F6]" size={20} title="Verified" />}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--text-color2)]">
                                <span className="rounded-full bg-white px-2 py-[2px] font-semibold text-[var(--primary-color)]">{info.type}</span>
                                {info.experience && (
                                    <span className="flex items-center gap-1"><FiBriefcase /> {info.experience} experience</span>
                                )}
                                {info.cities?.length > 0 && (
                                    <span className="flex items-center gap-1"><FiMapPin /> {info.cities.join(", ")}</span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <AgentStars rating={info.rating_avg} size={16} />
                                <span className="text-sm font-semibold text-[var(--text-color1)]">
                                    {info.rating_count > 0 ? Number(info.rating_avg).toFixed(1) : "No ratings yet"}
                                </span>
                                {info.rating_count > 0 && (
                                    <span className="text-xs text-[var(--text-color2)]">({info.rating_count})</span>
                                )}
                            </div>
                        </div>
                        {info.phone && (
                            <a
                                href={`tel:${info.phone}`}
                                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[var(--secondary-color)] hover:text-white"
                            >
                                <FiPhone /> {info.phone}
                            </a>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Spinner aria-label="Loading details" />
                        </div>
                    )}

                    {!loading && error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
                    )}

                    {!loading && detail && (
                        <div className="space-y-8">
                            {/* Rating breakdown */}
                            {info.rating_count > 0 && (
                                <div>
                                    <h4 className="mb-3 text-[16px] font-bold text-[var(--text-color1)]">Rating Summary</h4>
                                    <div className="space-y-1.5">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = Number(breakdown[star] || 0);
                                            const percent = info.rating_count ? (count / info.rating_count) * 100 : 0;

                                            return (
                                                <div key={star} className="flex items-center gap-3 text-xs text-[var(--text-color2)]">
                                                    <span className="flex w-8 items-center gap-1">{star} <FaStar className="text-yellow-400" size={11} /></span>
                                                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                                        <span className="block h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
                                                    </span>
                                                    <span className="w-6 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Properties */}
                            {properties.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-[16px] font-bold text-[var(--text-color1)]">
                                        Listed Properties ({info.properties_count})
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {properties.map((property) => (
                                            <NextLink
                                                key={property.id}
                                                href={`/web/propertyDetail/${property.slug}`}
                                                className="flex gap-3 rounded-xl border border-gray-100 p-2 no-underline transition hover:border-orange-200 hover:shadow-sm"
                                            >
                                                <img
                                                    src={property.main_image || "/assets/img/prop-1.png"}
                                                    onError={imageFallback("/assets/img/prop-1.png")}
                                                    alt={property.title}
                                                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                                                />
                                                <div className="min-w-0">
                                                    <p className="mb-0 line-clamp-1 text-[13px] font-semibold text-[var(--text-color1)]">{property.title}</p>
                                                    <p className="mb-0 line-clamp-1 text-[11px] text-[var(--text-color2)]">
                                                        {[property.location, property.city].filter(Boolean).join(", ") || "-"}
                                                    </p>
                                                    <p className="mb-0 text-[13px] font-bold text-[var(--primary-color)]">
                                                        {formatPropertyPrice(property.price)}
                                                    </p>
                                                </div>
                                            </NextLink>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rating summary when nobody has rated yet: empty stars */}
                            {!info.rating_count && (
                                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
                                    <AgentStars rating={0} size={20} />
                                    <span className="text-sm text-[var(--text-color2)]">No ratings yet</span>
                                </div>
                            )}

                            {/* Rate form */}
                            {!detail.offline && (
                            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                                <h4 className="mb-3 text-[16px] font-bold text-[var(--text-color1)]">
                                    {detail.my_review ? "Your Rating" : `Rate ${info.name}`}
                                </h4>

                                {!user && (
                                    <p className="mb-0 text-sm text-[var(--text-color2)]">
                                        <NextLink href="/login" className="font-semibold text-[var(--primary-color)] hover:underline">
                                            Login
                                        </NextLink>{" "}
                                        as a buyer to rate this {String(info.type).toLowerCase()}.
                                    </p>
                                )}

                                {user && !isCustomer && (
                                    <p className="mb-0 text-sm text-[var(--text-color2)]">Only buyer accounts can give ratings.</p>
                                )}

                                {isCustomer && (
                                    <form onSubmit={submitRating} className="space-y-3">
                                        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                                    onMouseEnter={() => setHover(star)}
                                                    onClick={() => setRating(star)}
                                                    className="p-0.5"
                                                >
                                                    <FaStar size={26} className={(hover || rating) >= star ? "text-yellow-400" : "text-gray-300"} />
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={text}
                                            onChange={(event) => setText(event.target.value)}
                                            maxLength={1000}
                                            rows={3}
                                            placeholder="Share your experience (optional)"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary-color)] focus:ring-4 focus:ring-orange-500/10"
                                        />

                                        {formMessage.text && (
                                            <p className={`mb-0 text-sm ${formMessage.type === "error" ? "text-red-600" : "text-green-600"}`}>
                                                {formMessage.text}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {saving && <Spinner size="sm" color="white" aria-label="Saving" />}
                                            {detail.my_review ? "Update Rating" : "Submit Rating"}
                                        </button>
                                    </form>
                                )}
                            </div>
                            )}

                            {/* Reviews */}
                            <div>
                                <h4 className="mb-3 text-[16px] font-bold text-[var(--text-color1)]">Reviews</h4>
                                {reviews.length === 0 ? (
                                    <p className="text-sm text-[var(--text-color2)]">No reviews yet. Be the first to rate.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {reviews.map((review) => (
                                            <li key={review.id} className="rounded-xl border border-gray-100 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-[var(--text-color1)]">{review.user_name}</span>
                                                    <span className="text-[11px] text-[var(--text-color2)]">{formatDate(review.updated_at)}</span>
                                                </div>
                                                <AgentStars rating={review.rating} size={12} />
                                                {review.review && (
                                                    <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[var(--text-color2)]">{review.review}</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
