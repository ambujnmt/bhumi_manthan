import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Page numbers with gaps: 1 … 4 5 6 … 10
const pageItems = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, idx) => idx + 1);

    const sorted = [...new Set([1, total, current - 1, current, current + 1])]
        .filter((page) => page >= 1 && page <= total)
        .sort((a, b) => a - b);

    return sorted.flatMap((page, idx) => (idx > 0 && page - sorted[idx - 1] > 1 ? [`gap-${page}`, page] : [page]));
};

// Compact: 3 pages around the current one + last page -> 1 2 3 … 5 / 1 … 3 4 5 / 1 … 5 6 7 … 10
const compactItems = (current, total) => {
    if (total <= 4) return Array.from({ length: total }, (_, idx) => idx + 1);

    const start = Math.min(Math.max(current - 1, 1), total - 2);
    const windowPages = [start, start + 1, start + 2];
    const sorted = [...new Set([...(start > 1 ? [1] : []), ...windowPages, total])].sort((a, b) => a - b);

    return sorted.flatMap((page, idx) => (idx > 0 && page - sorted[idx - 1] > 1 ? [`gap-${page}`, page] : [page]));
};

const base =
    "flex h-10 min-w-[40px] items-center justify-center rounded-lg border px-2 text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const idle =
    "border-gray-200 bg-white text-[var(--secondary-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]";
const active = "border-[var(--primary-color)] bg-[var(--primary-color)] text-white";

/**
 * ‹ 1 2 3 … 9 ›   (hidden when there is only one page)
 * compact: ‹ 1 2 3 … 5 › (3 page window + last page, e.g. home sections)
 */
export default function Pagination({ page, totalPages, onChange, disabled = false, className = "", label = "Pages", compact = false }) {
    if (!totalPages || totalPages <= 1) return null;

    return (
        <nav aria-label={label} className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            <button
                type="button"
                aria-label="Previous page"
                onClick={() => onChange(page - 1)}
                disabled={disabled || page <= 1}
                className={`${base} ${idle}`}
            >
                <FiChevronLeft size={18} />
            </button>

            {(compact ? compactItems : pageItems)(page, totalPages).map((item) =>
                typeof item === "string" ? (
                    <span key={item} className="px-1 text-[var(--text-color2)]">…</span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        aria-label={`Page ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => item !== page && onChange(item)}
                        disabled={disabled}
                        className={`${base} ${item === page ? active : idle}`}
                    >
                        {item}
                    </button>
                )
            )}

            <button
                type="button"
                aria-label="Next page"
                onClick={() => onChange(page + 1)}
                disabled={disabled || page >= totalPages}
                className={`${base} ${idle}`}
            >
                <FiChevronRight size={18} />
            </button>
        </nav>
    );
}
