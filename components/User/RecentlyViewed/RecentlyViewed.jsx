import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { FiClock, FiMapPin, FiTrash2, FiX } from "react-icons/fi";
import WishlistButton from "../../Common/WishlistButton";
import Pagination from "../../Common/Pagination";
import { clearRecentlyViewed, getRecentlyViewed, removeRecentlyViewed } from "../../../utils/fetchApi";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";

const FALLBACK_IMAGE = "/assets/img/prop-1.png";

// "Viewed 5 min ago" / "Viewed yesterday" / "Viewed 12 Oct 2026"
const viewedLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "Viewed just now";
  if (minutes < 60) return `Viewed ${minutes} min ago`;
  if (minutes < 1440) return `Viewed ${Math.floor(minutes / 60)} hr ago`;
  if (minutes < 2880) return "Viewed yesterday";
  if (minutes < 10080) return `Viewed ${Math.floor(minutes / 1440)} days ago`;

  return `Viewed ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
};

/**
 * Customer dashboard "Recent View": properties the customer opened, latest first.
 */
export default function RecentlyViewed() {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getRecentlyViewed(page).then((response) => {
      if (cancelled) return;

      if (response.status) {
        const { properties: items, pagination: pages } = response.data;

        setError("");
        setProperties(items);
        setPagination(pages);

        // Last card of the last page was removed
        if (page > 1 && page > pages.last_page) setPage(pages.last_page);
      } else {
        setError(response.message);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [page, version]);

  const removeOne = async (event, propertyId) => {
    event.preventDefault();
    event.stopPropagation();

    // Card goes away straight away, list is fetched again to fill the page
    setProperties((list) => list.filter((item) => item.id !== propertyId));

    await removeRecentlyViewed(propertyId);
    setVersion((value) => value + 1);
  };

  const clearAll = async () => {
    setClearing(true);

    const response = await clearRecentlyViewed();

    setClearing(false);
    setConfirmClear(false);

    if (response.status) {
      setProperties([]);
      setPagination(null);
      setPage(1);
    } else {
      setError(response.message);
    }
  };

  const total = pagination?.total ?? properties.length;

  return (
    <div>
      <div className="mb-[16px] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-0 text-2xl font-bold text-[var(--secondary-color)]">Recent View</h1>
          {!loading && !error && total > 0 && (
            <p className="mb-0 mt-1 text-sm text-[#62748E]">
              {total} {total === 1 ? "property" : "properties"} you viewed recently
            </p>
          )}
        </div>

        {!loading && !error && properties.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#62748E]">Clear all recent views?</span>
              <button
                type="button"
                onClick={clearAll}
                disabled={clearing}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {clearing ? "Clearing..." : "Yes, clear"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[var(--secondary-color)] hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
            >
              <FiTrash2 size={15} aria-hidden="true" /> Clear All
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[290px] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-[20px] text-red-600">{error}</div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-[20px] py-[56px] text-center shadow-sm">
          <span className="mb-[16px] flex h-16 w-16 items-center justify-center rounded-full bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
            <FiClock size={28} />
          </span>
          <h2 className="mb-[8px] text-lg font-bold text-[var(--secondary-color)]">No recently viewed properties</h2>
          <p className="mb-[20px] text-sm text-[#62748E]">Properties you open will show up here, so you can find them again.</p>
          <NextLink
            href="/web/property/searchProperties"
            className="rounded-lg bg-[var(--primary-color)] px-[20px] py-[10px] text-sm font-semibold text-white no-underline transition-colors hover:bg-[var(--secondary-color)] hover:text-white"
          >
            Browse Properties
          </NextLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <NextLink
              key={property.id}
              href={`/web/propertyDetail/${property.slug || property.id}`}
              className="group block overflow-hidden rounded-xl bg-white no-underline shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="relative">
                <img
                  src={property.main_image || FALLBACK_IMAGE}
                  onError={imageFallback(FALLBACK_IMAGE)}
                  alt={property.title}
                  className="h-48 w-full object-cover"
                />
                <WishlistButton propertyId={property.id} className="absolute right-[10px] top-[10px]" />
                <button
                  type="button"
                  onClick={(event) => removeOne(event, property.id)}
                  aria-label={`Remove ${property.title} from recent views`}
                  title="Remove"
                  className="absolute left-[10px] top-[10px] flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-100 transition hover:bg-red-600 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <FiX size={16} aria-hidden="true" />
                </button>
                {property.viewed_at && (
                  <span className="absolute bottom-[10px] left-[10px] inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                    <FiClock size={10} aria-hidden="true" /> {viewedLabel(property.viewed_at)}
                  </span>
                )}
              </div>
              <div className="p-[16px]">
                <h3 className="line-clamp-1 text-[16px] font-semibold text-[var(--text-color1)]">{property.title}</h3>
                <p className="mt-[8px] flex items-center gap-1 text-[12px] text-[var(--text-color2)]">
                  <FiMapPin className="shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{[property.location, property.city].filter(Boolean).join(", ") || "-"}</span>
                </p>
                <h5 className="mb-0 mt-[4px] text-[18px] font-bold text-[var(--primary-color)]">{formatPropertyPrice(property.price)}</h5>
              </div>
            </NextLink>
          ))}
        </div>
      )}

      {!loading && !error && (
        <Pagination
          page={pagination?.current_page || page}
          totalPages={pagination?.last_page || 1}
          onChange={setPage}
          className="mt-[24px] justify-center"
          label="Recent view pages"
        />
      )}
    </div>
  );
}
