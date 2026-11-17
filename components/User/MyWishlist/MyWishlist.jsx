import React, { useEffect, useState } from "react";
import { Link } from "@heroui/react";
import { FiHeart, FiMapPin } from "react-icons/fi";
import WishlistButton from "../../Common/WishlistButton";
import { useWishlist } from "../../../context/WishlistContext";
import { getWishlist } from "../../../utils/fetchApi";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";

const FALLBACK_IMAGE = "/assets/img/prop-1.png";

export default function MyWishlist() {
  const { ids, idsLoaded, version } = useWishlist();

  const [properties, setProperties] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await getWishlist(page);

      if (cancelled) return;

      if (response.status) {
        const { properties: items, pagination } = response.data;

        setError("");
        setProperties(items);
        setLastPage(pagination.last_page);

        // Last property of the last page was removed
        if (page > pagination.last_page) {
          setPage(pagination.last_page);
        }
      } else {
        setError(response.message);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, version]);

  // A removed card goes away straight away, before the list is fetched again
  const visible = idsLoaded ? properties.filter((property) => ids.includes(property.id)) : properties;

  return (
    <div>
      <h1 className="mb-[16px] text-2xl font-bold text-[var(--secondary-color)]">My Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[280px] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-[20px] text-red-600">{error}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-[20px] py-[56px] text-center shadow-sm">
          <span className="mb-[16px] flex h-16 w-16 items-center justify-center rounded-full bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
            <FiHeart size={28} />
          </span>
          <h2 className="mb-[8px] text-lg font-bold text-[var(--secondary-color)]">Your wishlist is empty</h2>
          <p className="mb-[20px] text-sm text-[#62748E]">Tap the heart on any property to save it here.</p>
          <Link
            href="/web/property/searchProperties"
            className="rounded-lg bg-[var(--primary-color)] px-[20px] py-[10px] text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-color)]"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((property) => (
            <Link
              key={property.id}
              href={`/web/propertyDetail/${property.slug || property.id}`}
              className="block overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="relative">
                <img
                  src={property.main_image || FALLBACK_IMAGE}
                  onError={imageFallback(FALLBACK_IMAGE)}
                  alt={property.title}
                  className="h-48 w-full object-cover"
                />
                <WishlistButton propertyId={property.id} className="absolute right-[10px] top-[10px]" />
              </div>
              <div className="p-[16px]">
                <h3 className="line-clamp-1 text-[16px] font-semibold text-[var(--text-color1)]">{property.title}</h3>
                <p className="mt-[8px] flex items-center gap-1 text-[12px] text-[var(--text-color2)]">
                  <FiMapPin className="shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{[property.location, property.city].filter(Boolean).join(", ") || "-"}</span>
                </p>
                <h5 className="mb-0 mt-[4px] text-[18px] font-bold text-[var(--primary-color)]">{formatPropertyPrice(property.price)}</h5>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && lastPage > 1 && (
        <div className="mt-[24px] flex flex-wrap justify-center gap-2">
          {Array.from({ length: lastPage }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-current={number === page ? "page" : undefined}
              onClick={() => setPage(number)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                number === page
                  ? "bg-[var(--primary-color)] text-white"
                  : "border border-gray-200 bg-white text-[var(--secondary-color)] hover:border-[var(--primary-color)]"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
