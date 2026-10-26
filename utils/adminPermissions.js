import { useUser } from "../context/UserContext";

// Roles that can get admin panel access through an admin role
// (seller / broker keep their own role, customer never)
export const PANEL_ROLES = ["staff", "seller", "broker"];

// Super admin, or staff / seller / broker with an admin role assigned
export const hasAdminAccess = (user) => {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (!PANEL_ROLES.includes(user.role)) return false;

  return Boolean(user.admin_role_id || user.admin_role);
};

// "users.view" or "users.edit|users.delete" (any one)
export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (!hasAdminAccess(user)) return false;
  if (!permission) return true;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  return permission.split("|").some((item) => permissions.includes(item));
};

// First admin page the user can open (login redirect)
const ADMIN_PAGES = [
  ["dashboard.view", "/admin/dashboard"],
  ["properties.view", "/admin/propertyManagement/propertyList"],
  ["enquiries.view", "/admin/enquiry/enquiryList"],
  ["contact_messages.view", "/admin/contact/contactList"],
  ["users.view", "/admin/user/userManagement"],
  ["projects.view", "/admin/project/projectList"],
  ["blogs.view", "/admin/blog/blogList"],
  ["locations.view", "/admin/location/locationList"],
  ["banners.view", "/admin/banner/bannerList"],
  ["settings.view", "/admin/settings/siteSettings"],
];

// URL prefix of admin panel pages by logged in role:
// super admin -> /admin/..., seller -> /seller/..., broker -> /broker/..., staff -> /staff/...
// (next.config.js rewrites /seller|broker|staff/* to the same /admin/* pages)
export const PANEL_URL_PREFIX = /^\/(admin|seller|broker|staff)(?=\/|$|\?|#)/;

export const rolePrefix = (user) => (user && PANEL_ROLES.includes(user.role) ? user.role : "admin");

// "/admin/blog/blogList" -> "/seller/blog/blogList" for a seller
export const toRolePath = (user, path) => {
  if (typeof path !== "string" || !PANEL_URL_PREFIX.test(path)) return path;

  return path.replace(PANEL_URL_PREFIX, `/${rolePrefix(user)}`);
};

export const adminHomePath = (user) => {
  if (user?.role === "super_admin") return "/admin/dashboard";

  const page = ADMIN_PAGES.find(([permission]) => hasPermission(user, permission));

  return toRolePath(user, page ? page[1] : `/admin/profile/${user?.id ?? ""}`);
};

// const can = useAdminPermission();  can("blogs.edit")
export const useAdminPermission = () => {
  const { user } = useUser();

  return (permission) => hasPermission(user, permission);
};
