import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { adminHomePath, hasAdminAccess } from "../../utils/adminPermissions";
import { postLoginRedirect } from "../../utils/postLoginRedirect";

const GuestRoute = ({ children }) => {
  const { user, authLoading } = useUser();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  // Make sure this runs only on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) {
      return;
    }

    // User is already logged in
    if (user) {
      // Super admin / seller / broker / staff with admin role -> admin panel
      if (hasAdminAccess(user)) {
        router.replace(adminHomePath(user));
        return;
      }

      // Seller
      if (user.role === "seller") {
        router.replace("/seller/dashboard");
        return;
      }

      // Broker
      if (user.role === "broker") {
        router.replace("/broker/dashboard");
        return;
      }

      // Customer
      if (user.role === "customer") {
        // Runs right after login too, so it must go to the same place as the login form
        router.replace(postLoginRedirect() || "/");
        return;
      }

      // Unknown role
      router.replace("/");
    }
  }, [user, authLoading, router, mounted]);

  // Wait until authentication is checked
  if (!mounted || authLoading) {
    return null;
  }

  // Logged-in user should not see guest pages
  if (user) {
    return null;
  }

  // Not logged in → show Login / Signup page
  return children;
};

export default GuestRoute;