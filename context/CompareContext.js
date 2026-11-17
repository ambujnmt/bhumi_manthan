import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { showToast } from "@/store/toast";
import { addToCompare, getCompareList, removeFromCompare } from "../utils/fetchApi";
import { clearPostLoginRedirect, rememberPostLoginRedirect } from "../utils/postLoginRedirect";
import { useUser } from "./UserContext";

// Property a guest clicked "Add to Compare" on: added right after they log in
const PENDING_KEY = "compare_pending_property";

const EMPTY_LIST = { groups: [], property_ids: [] };

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
    // Storage blocked: the guest simply clicks the button again after login
  }
};

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const router = useRouter();
  const { user, authLoading } = useUser();

  const [list, setList] = useState(EMPTY_LIST);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(new Set());

  const userId = user?.id;

  const refresh = useCallback(async () => {
    const response = await getCompareList();

    if (response.status) {
      setList(response.data);
      setError("");
    } else {
      setError(response.message);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    setList(EMPTY_LIST);
    setLoaded(false);
    setError("");

    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      const pending = readPending();

      if (pending) {
        writePending(null);
        clearPostLoginRedirect();

        const added = await addToCompare(pending);

        if (!cancelled) {
          showToast(added.message, added.status ? "success" : "error");
        }
      }

      if (!cancelled) {
        await refresh();
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, refresh]);

  const toggleCompare = useCallback(async (propertyId) => {
    if (!userId) {
      writePending(propertyId);
      rememberPostLoginRedirect(router.asPath);
      router.push("/login");
      return;
    }

    // A second click while the first is being saved would race it
    if (inFlight.current.has(propertyId)) return;
    inFlight.current.add(propertyId);

    const isAdded = list.property_ids.includes(propertyId);
    const response = isAdded ? await removeFromCompare(propertyId) : await addToCompare(propertyId);

    // Add sends no list. A failed add may also mean the saved list changed in another tab.
    if (isAdded && response.status) {
      setList(response.data);
    } else {
      await refresh();
    }

    inFlight.current.delete(propertyId);

    showToast(response.message, response.status ? "success" : "error");
  }, [list.property_ids, refresh, router, userId]);

  return (
    <CompareContext.Provider
      value={{ groups: list.groups, ids: list.property_ids, loaded, error, toggleCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
