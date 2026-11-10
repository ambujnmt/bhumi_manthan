import { useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

// 4.3 -> ★★★★☆ (half star from .5)
export default function AgentStars({ rating = 0, size = 14 }) {
    const value = Math.round(Number(rating || 0) * 2) / 2;

    return (
        <span className="inline-flex items-center gap-[2px] text-yellow-400" aria-label={`${Number(rating || 0).toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) =>
                value >= star ? (
                    <FaStar key={star} size={size} aria-hidden="true" />
                ) : value >= star - 0.5 ? (
                    <FaStarHalfAlt key={star} size={size} aria-hidden="true" />
                ) : (
                    <FaRegStar key={star} size={size} className="text-gray-300" aria-hidden="true" />
                )
            )}
        </span>
    );
}

// Round photo, or first letters of the name (also when the photo fails to load)
export function AgentAvatar({ agent, className = "h-14 w-14 text-lg" }) {
    const [broken, setBroken] = useState(false);

    if (agent?.image && !broken) {
        return (
            <img
                src={agent.image}
                alt={agent.name}
                onError={() => setBroken(true)}
                className={`${className} shrink-0 rounded-full object-cover ring-2 ring-orange-100`}
            />
        );
    }

    const initials = (agent?.name || "A")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#FFECD3] font-bold text-[var(--primary-color)]`} aria-hidden="true">
            {initials}
        </span>
    );
}
