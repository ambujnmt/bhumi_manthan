import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchWishlist, toggleWishlist } from "@/utils/fetchApi";
import { FaRegTrashCan } from "react-icons/fa6";

export default function MyWishlist() {
  const router = useRouter();
  const { id: userId } = router.query;

  const [wishlist, setWishlist] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    if (!userId) return;

    const loadWishlist = async () => {
      setLoading(true);
      const res = await fetchWishlist(userId);
      if (res?.status) {
        setWishlist(res.data);
      }
      setLoading(false);
    };

    loadWishlist();
  }, [userId]);

  const handleRemove = async (productId) => {
    const res = await toggleWishlist({
      user_id: userId,
      product_id: productId,
    });

    if (res?.status) {
      setWishlist((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
    }
  };

  const totalPages = Math.ceil(wishlist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = wishlist.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 md:px-8">
      
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-6">
        My Wishlist
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-gray-500">No wishlist items found</p>
      ) : (
        <div className="space-y-4">
          {currentItems.map((item) => (
            <div
              key={item.wishlist_id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border rounded-lg p-3 shadow-sm"
            >
              
              {/* Image */}
              <img
                src={item.product.images?.[0]}
                alt={item.product.product_name}
                className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded"
              />

              {/* Product Info */}
              <div className="flex-1">
                <h2 className="font-semibold text-sm sm:text-base">
                  {item.product.product_name}
                </h2>

                <p className="text-xs sm:text-sm text-gray-500">
                  {item.product.category?.name}
                </p>

                <p className="font-bold mt-1 text-sm sm:text-base">
                  ${item.product.price}
                </p>
              </div>

              {/* Remove Button */}
              <div className="flex justify-end sm:justify-center">
                <button
                  onClick={() => handleRemove(item.product.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove"
                >
                  <FaRegTrashCan size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === index + 1
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}