import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { adminHomePath, hasAdminAccess, hasPermission, PANEL_ROLES } from "../../utils/adminPermissions";
import AdminRolePending from "../Common/AdminRolePending";

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

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  // Seller / broker / staff on their panel URL before admin assigns a role
  const [rolePending, setRolePending] = useState(false);

  // Client-side mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Do nothing until component is mounted
    if (!mounted) {
      return;
    }

    // Wait until UserContext finishes checking cookies
    if (authLoading) {
      return;
    }

    // ------------------------------------------------
    // USER NOT LOGGED IN
    // ------------------------------------------------
    if (!user) {
      setAuthorized(false);
      setRolePending(false);
      router.replace("/login");
      return;
    }

    // ------------------------------------------------
    // SELLER / BROKER / STAFF WITHOUT ADMIN ROLE (yet)
    // /seller/dashboard etc. -> "admin will assign a role" message
    // ------------------------------------------------
    const isPanelRoleWithoutAccess = PANEL_ROLES.includes(user.role) && !hasAdminAccess(user);

    setRolePending(isPanelRoleWithoutAccess && allowedRoles.includes("super_admin"));

    if (isPanelRoleWithoutAccess && allowedRoles.includes("super_admin")) {
      setAuthorized(false);
      return;
    }

    // ------------------------------------------------
    // ADMIN PANEL USER (staff / seller / broker with admin role)
    // ------------------------------------------------
    if (user.role !== "super_admin" && hasAdminAccess(user)) {
      const isAdminPage = allowedRoles.includes("super_admin");

      if (!isAdminPage || superAdminOnly || !hasPermission(user, permission)) {
        setAuthorized(false);
        router.replace(adminHomePath(user));
        return;
      }

      setAuthorized(true);
      return;
    }

    // ------------------------------------------------
    // USER LOGGED IN BUT WRONG ROLE
    // ------------------------------------------------
    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role)
    ) {
      setAuthorized(false);

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

      // Super Admin (staff without admin role -> home, see "Unknown role")
      if (user.role === "super_admin") {
        router.replace(adminHomePath(user));
        return;
      }

      // Customer
      if (user.role === "customer") {
        router.replace("/");
        return;
      }

      // Unknown role
      router.replace("/");
      return;
    }

    // ------------------------------------------------
    // USER IS AUTHORIZED
    // ------------------------------------------------
    setAuthorized(true);
  }, [
    mounted,
    authLoading,
    user,
    allowedRoles,
    permission,
    superAdminOnly,
    router,
  ]);

  // ------------------------------------------------
  // NEVER SHOW DASHBOARD DURING AUTH CHECK
  // ------------------------------------------------

  if (!mounted) {
    return null;
  }

  if (authLoading) {
    return null;
  }

  if (rolePending) {
    return (
      <div className="min-h-screen bg-[#f4f5fa] p-4">
        <AdminRolePending />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return children;
};

export default PrivateRoute;