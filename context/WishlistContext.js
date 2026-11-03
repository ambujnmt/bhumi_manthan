import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { showToast } from "@/store/toast";
import { addToWishlist, getWishlistIds, removeFromWishlist } from "../utils/fetchApi";
import { clearPostLoginRedirect, rememberPostLoginRedirect } from "../utils/postLoginRedirect";
import { useUser } from "./UserContext";

// Heart a guest clicked: saved right after they log in
const PENDING_KEY = "wishlist_pending_property";

const readPending = () => {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
};

const writePending = (propertyId) => {
  try {
    if (propertyId) {
      sessionStorage.setItem(PENDING_KEY, String(propertyId));
    } else {
      sessionStorage.removeItem(PENDING_KEY);
    }
  } catch {
    // Storage blocked: the guest simply clicks the heart again after login
  }
};

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const router = useRouter();
  const { user, authLoading } = useUser();

  const [ids, setIds] = useState([]);
  const [idsLoaded, setIdsLoaded] = useState(false);
  // Goes up after every saved change, so the wishlist page knows to refetch
  const [version, setVersion] = useState(0);
  const inFlight = useRef(new Set());

  const userId = user?.id;
  const isCustomer = user?.role === "customer";

  useEffect(() => {
    if (authLoading) return;

    setIds([]);
    setIdsLoaded(false);

    if (!userId) return;

    // Only customers have a wishlist, so a pending heart cannot be saved for anyone else
    if (!isCustomer) {
      if (readPending()) {
        writePending(null);
        clearPostLoginRedirect();
      }
      return;
    }

    let cancelled = false;

    const load = async () => {
      const pending = readPending();

      if (pending) {
        writePending(null);
        clearPostLoginRedirect();

        const added = await addToWishlist(pending);

        if (!cancelled) {
          showToast(added.status ? "Added to wishlist." : added.message, added.status ? "success" : "error");
        }
      }

      const response = await getWishlistIds();

      if (!cancelled && response.status) {
        setIds(response.data.property_ids);
        setIdsLoaded(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, isCustomer]);

  const toggleWishlist = useCallback(async (propertyId) => {
    if (!userId) {
      writePending(propertyId);
      rememberPostLoginRedirect(router.asPath);
      router.push("/login");
      return;
    }

    if (!isCustomer) {
      showToast("Wishlist is available for customer accounts only.", "error");
      return;
    }

    // A second click while the first is being saved would race it
    if (inFlight.current.has(propertyId)) return;
    inFlight.current.add(propertyId);

    const wasSaved = ids.includes(propertyId);

    // Heart changes straight away, and goes back if saving fails
    setIds((current) => (wasSaved ? current.filter((id) => id !== propertyId) : [propertyId, ...current]));

    const response = wasSaved ? await removeFromWishlist(propertyId) : await addToWishlist(propertyId);

    inFlight.current.delete(propertyId);

    if (!response.status) {
      setIds((current) => (wasSaved ? [propertyId, ...current] : current.filter((id) => id !== propertyId)));
      showToast(response.message, "error");
      return;
    }

    setVersion((current) => current + 1);
    showToast(wasSaved ? "Removed from wishlist." : "Added to wishlist.", "success");
  }, [ids, isCustomer, router, userId]);

  return (
    <WishlistContext.Provider value={{ ids, idsLoaded, version, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
