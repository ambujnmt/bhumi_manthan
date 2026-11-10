// "LIVE" pill for events that have started (animations in styles/globals.css)
// Text stays readable; the dot blinks and the pill pulses.
// variant "light" = transparent pill (white border + text), for use on a red background
export default function LiveBadge({ className = "", label = "LIVE", size = "md", variant = "red" }) {
    const sizes = {
        sm: { pill: "gap-1 px-2 py-[3px] text-[10px]", dot: "h-1.5 w-1.5" },
        md: { pill: "gap-1.5 px-2.5 py-1 text-[11px]", dot: "h-2 w-2" },
        lg: { pill: "gap-2 px-3 py-1.5 text-[13px]", dot: "h-2.5 w-2.5" },
    };

    const { pill, dot } = sizes[size] || sizes.md;
    const light = variant === "light";

    return (
        <span
            className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-extrabold uppercase leading-none tracking-wider ${
                light ? "live-glow-white border border-white/70 bg-transparent text-white" : "live-glow-red bg-red-600 text-white"
            } ${pill} ${className}`}
        >
            <span className={`relative flex shrink-0 ${dot}`} aria-hidden="true">
                <span className="live-ping absolute inset-0 rounded-full bg-white" />
                <span className={`live-blink relative rounded-full bg-white ${dot}`} />
            </span>
            {label}
        </span>
    );
}
