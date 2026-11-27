/**
 * Card Badge on a property image (Admin -> Card Badges), same pill style as the
 * "Ready to Move" status on Admin -> Property List. Text shows as the admin typed it.
 *
 *   <div className="relative"><img ... /><PropertyCardBadge property={property} /></div>
 *
 * property.badge: "" / null = auto ("Featured" when featured, else "New"), "None" = no badge.
 * auto    : false -> no badge when the property has none chosen (used where the auto badge is not wanted)
 * className: position, default top-left of the image
 */

// Known badges get their own colour, any other badge the brand orange
const BADGE_COLORS = {
    featured: "bg-green-700",
    premium: "bg-[#283A86]",
    new: "bg-[#3B82F6]",
    "new launch": "bg-[#7C3AED]",
    "ultra luxury": "bg-[#D4AF37]",
};

export const badgeText = (property, auto = true) => {
    const chosen = String(property?.badge || "").replace(/\s+/g, " ").trim();

    if (chosen.toLowerCase() === "none") return null;
    if (chosen) return chosen;

    return auto ? (property?.is_featured ? "Featured" : "New") : null;
};

export const badgeColor = (text) => BADGE_COLORS[String(text || "").toLowerCase()] || "bg-[#E87722]";

export function BadgePill({ text, className = "" }) {
    if (!text) return null;

    return (
        <span
            className={`inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow ${badgeColor(text)} ${className}`}
        >
            {text}
        </span>
    );
}

export default function PropertyCardBadge({ property, auto = true, className = "absolute left-2.5 top-2.5 max-w-[60%]" }) {
    const text = badgeText(property, auto);

    return text ? <BadgePill text={text} className={className} /> : null;
}
