import { FiHeart } from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";

// Heart for a property. Most cards are links, so a click here must not open the property.
export default function WishlistButton({ propertyId, className = "" }) {
  const { ids, toggleWishlist } = useWishlist();
  const saved = ids.includes(propertyId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(propertyId);
      }}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors ${
        saved ? "text-red-500" : "text-gray-600 hover:text-red-500"
      } ${className}`}
    >
      <FiHeart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
    </button>
  );
}
