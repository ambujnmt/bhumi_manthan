import { createContext, useContext, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ------------------------------------------------
  // LOAD AUTH DATA
  // ------------------------------------------------

  useEffect(() => {
    try {
      const cookieUser = Cookies.get("user");
      const cookieToken = Cookies.get("accessToken");

      if (cookieUser) {
        setUser(JSON.parse(cookieUser));
      } else {
        setUser(null);
      }

      if (cookieToken) {
        setAccessToken(cookieToken);
      } else {
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Failed to load auth data:", error);

      Cookies.remove("user", { path: "/" });
      Cookies.remove("accessToken", { path: "/" });
      Cookies.remove("role", { path: "/" });

      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }

      setUser(null);
      setAccessToken(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ------------------------------------------------
  // REFRESH USER FROM SERVER
  // Admin can change role / admin role / permissions while the user is
  // logged in: refresh on page load + when the tab gets focus.
  // ------------------------------------------------

  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    const refreshUser = async () => {
      try {
        const response = await fetch(`${BASE_URL}profile`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        // Token no longer valid (logged out / account inactive / deleted)
        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json().catch(() => null);
        const freshUser = data?.data?.user;

        if (!response.ok || !freshUser) {
          return;
        }

        const mergedUser = { ...userRef.current, ...freshUser };

        if (JSON.stringify(mergedUser) !== JSON.stringify(userRef.current)) {
          updateUser(mergedUser);
        }
      } catch (error) {
        // Offline / API down: keep the cookie user
      }
    };

    refreshUser();
    window.addEventListener("focus", refreshUser);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshUser);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // ------------------------------------------------
  // LOGIN
  // ------------------------------------------------

  const login = (userData, token) => {
    if (!userData || !token) {
      return;
    }

    setUser(userData);
    setAccessToken(token);

    Cookies.set("user", JSON.stringify(userData), {
      path: "/",
      expires: 7,
    });

    Cookies.set("accessToken", token, {
      path: "/",
      expires: 7,
    });

    Cookies.set("role", userData.role, {
      path: "/",
      expires: 7,
    });

    // Keep localStorage synchronized if your API code uses it
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // ------------------------------------------------
  // UPDATE USER (fresh profile, e.g. admin permissions)
  // ------------------------------------------------

  const updateUser = (userData) => {
    if (!userData) {
      return;
    }

    setUser(userData);

    Cookies.set("user", JSON.stringify(userData), {
      path: "/",
      expires: 7,
    });

    Cookies.set("role", userData.role, {
      path: "/",
      expires: 7,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  const logout = () => {
    // First clear React state
    setUser(null);
    setAccessToken(null);

    // Clear cookies
    Cookies.remove("user", { path: "/" });
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("role", { path: "/" });

    // Also remove without options in case an older cookie
    // was created with different cookie options
    Cookies.remove("user");
    Cookies.remove("accessToken");
    Cookies.remove("role");

    // Clear old localStorage authentication
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        accessToken,
        authLoading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);