import { useEffect, useState } from "react";
import { getPropertyBadges } from "../../../utils/fetchApi";

// Loaded once per page visit, shared by add + edit forms
let badgeCache = null;

/**
 * "Card Badge (optional)" select of the property add / edit form.
 * Options = active badges from Admin -> Card Badges, plus:
 *   ""     -> Auto (Featured / New / Ultra Luxury)
 *   "NONE" -> No badge
 * A saved badge that is no longer in the list (made inactive) still shows, so editing keeps it.
 */
export default function CardBadgeField({ value, onChange, labelClass, inputClass, name = "badge" }) {
    const [badges, setBadges] = useState(() => badgeCache || []);
    const [loading, setLoading] = useState(() => !badgeCache);

    useEffect(() => {
        let active = true;

        getPropertyBadges().then((list) => {
            if (!active) return;
            badgeCache = list;
            setBadges(list);
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    const current = String(value || "");
    const isNone = current.toLowerCase() === "none";
    const options = current && !isNone && !badges.includes(current) ? [...badges, current] : badges;

    return (
        <div>
            <label htmlFor={name} className={labelClass}>
                Card Badge <span className="text-xs font-normal text-[#62748E]">(optional)</span>
            </label>
            <select id={name} name={name} value={isNone ? "NONE" : value || ""} onChange={onChange} className={inputClass} aria-busy={loading}>
                <option value="">Auto (Featured / New / Ultra Luxury)</option>
                <option value="NONE">No badge</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                        {!badges.includes(option) && !loading ? " (inactive)" : ""}
                    </option>
                ))}
            </select>
            {loading && <p className="mb-0 mt-1 text-xs text-[#62748E]">Loading badges...</p>}
        </div>
    );
}
