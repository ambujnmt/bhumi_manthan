import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { adminHomePath, hasAdminAccess, hasPermission, PANEL_ROLES } from "../../utils/adminPermissions";
import AdminRolePending from "../Common/AdminRolePending";

// true after the first client render: on client side navigation (sidebar click)
// the page renders right away instead of a blank screen (looked like a full refresh)
let hydrated = false;

/**
 * Access result for the logged in user:
 * { status: "loading" | "authorized" | "pending" | "redirect", to }
 */
const getAccess = (user, allowedRoles, permission, superAdminOnly) => {
  // ------------------------------------------------
  // USER NOT LOGGED IN
  // ------------------------------------------------
  if (!user) {
    return { status: "redirect", to: "/login" };
  }

  // ------------------------------------------------
  // SELLER / BROKER / STAFF WITHOUT ADMIN ROLE (yet)
  // /seller/dashboard etc. -> "admin will assign a role" message
  // ------------------------------------------------
  const isPanelRoleWithoutAccess = PANEL_ROLES.includes(user.role) && !hasAdminAccess(user);

  if (isPanelRoleWithoutAccess && allowedRoles.includes("super_admin")) {
    return { status: "pending" };
  }

  // ------------------------------------------------
  // ADMIN PANEL USER (staff / seller / broker with admin role)
  // ------------------------------------------------
  if (user.role !== "super_admin" && hasAdminAccess(user)) {
    const isAdminPage = allowedRoles.includes("super_admin");

    if (!isAdminPage || superAdminOnly || !hasPermission(user, permission)) {
      return { status: "redirect", to: adminHomePath(user) };
    }

    return { status: "authorized" };
  }

  // ------------------------------------------------
  // USER LOGGED IN BUT WRONG ROLE
  // ------------------------------------------------
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Seller
    if (user.role === "seller") {
      return { status: "redirect", to: "/seller/dashboard" };
    }

    // Broker
    if (user.role === "broker") {
      return { status: "redirect", to: "/broker/dashboard" };
    }

    // Super Admin (staff without admin role -> home, see "Unknown role")
    if (user.role === "super_admin") {
      return { status: "redirect", to: adminHomePath(user) };
    }

    // Customer / unknown role
    return { status: "redirect", to: "/" };
  }

  // ------------------------------------------------
  // USER IS AUTHORIZED
  // ------------------------------------------------
  return { status: "authorized" };
};

/**
 * allowedRoles={["super_admin"]} pages also open for staff / seller / broker
 * who have an admin role (assigned by super admin) when:
 * - permission="blogs.view" is in their admin role permissions
 * - superAdminOnly is not set (roles & staff pages)
 * Seller / broker with an admin role use the admin panel instead of their own dashboard.
 */
const PrivateRoute = ({ children, allowedRoles = [], permission = "", superAdminOnly = false }) => {
  const { user, authLoading } = useUser();
  const router = useRouter();

  // Client-side mount check (only the first page load waits for it)
  const [mounted, setMounted] = useState(hydrated);

  useEffect(() => {
    hydrated = true;
    setMounted(true);
  }, []);

  const access = !mounted || authLoading
    ? { status: "loading" }
    : getAccess(user, allowedRoles, permission, superAdminOnly);

  useEffect(() => {
    if (access.status === "redirect") {
      router.replace(access.to);
    }
  }, [access.status, access.to]);

  // ------------------------------------------------
  // NEVER SHOW DASHBOARD DURING AUTH CHECK
  // ------------------------------------------------

  if (access.status === "pending") {
    return (
      <div className="min-h-screen bg-[#f4f5fa] p-4">
        <AdminRolePending />
      </div>
    );
  }

  if (access.status !== "authorized") {
    return null;
  }

  return children;
};

export default PrivateRoute;
