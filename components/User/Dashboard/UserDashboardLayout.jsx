import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiCalendar, FiChevronRight, FiClock, FiGrid, FiHeart, FiLogOut, FiMenu, FiMessageCircle, FiSend, FiUser, FiUsers, FiX } from "react-icons/fi";
import Header from "../../Home/Menu/Header";
import PrivateRoute from "../../PrivateRoute/PrivateRoute";
import { useUser } from "../../../context/UserContext";
import { useWishlist } from "../../../context/WishlistContext";
import { subscribeChatUnread } from "../../../utils/firebaseChat";
import { getMyEnquiryCount } from "../../../utils/fetchApi";
import LogoutConfirm from "../../Common/LogoutConfirm";
import SideAds from "../../Common/Ads/SideAds";
import UserAvatar from "../../Common/UserAvatar";

const Badge = ({ count }) =>
  count > 0 ? (
    <span className="ml-auto rounded-full bg-[var(--primary-color)] px-[7px] py-[1px] text-[11px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

function DashboardShell({ children }) {
  const router = useRouter();
  const { user, logout } = useUser();
  const { ids } = useWishlist();
  const [unread, setUnread] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);
  // Phone: menu slides in from the left (closed after moving to another page / Esc)
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => subscribeChatUnread(setUnread), []);

  // How many properties I sent an enquiry for (sidebar badge)
  const [enquiryCount, setEnquiryCount] = useState(0);

  useEffect(() => {
    getMyEnquiryCount()
      .then((res) => setEnquiryCount(res?.data?.properties_count || 0))
      .catch(() => setEnquiryCount(0));
  }, [router.pathname]);

  if (!user) return null;

  const isChat = router.query.tab === "chat";
  // Chat fills the page and scrolls inside its own list and messages
  const isChatPage = router.pathname === "/web/profile/[id]" && isChat;
  const items = [
    { label: "Dashboard", href: "/user/dashboard", icon: FiGrid, active: router.pathname === "/user/dashboard" },
    { label: "My Profile", href: `/web/profile/${user.id}`, icon: FiUser, active: router.pathname === "/web/profile/[id]" && !isChat },
    { label: "Messages", href: `/web/profile/${user.id}?tab=chat`, icon: FiMessageCircle, active: router.pathname === "/web/profile/[id]" && isChat, count: unread },
    { label: "My Wishlist", href: `/user/myWishlist/myWishlist/${user.id}`, icon: FiHeart, active: router.pathname.startsWith("/user/myWishlist"), count: ids.length },
    { label: "My Enquiries", href: "/user/myEnquiries", icon: FiSend, active: router.pathname === "/user/myEnquiries", count: enquiryCount },
    { label: "Recent View", href: "/user/recentView", icon: FiClock, active: router.pathname === "/user/recentView" },
    { label: "My Appointments", href: "/user/appointments", icon: FiCalendar, active: router.pathname === "/user/appointments" },
    { label: "Brokers & Sellers", href: "/user/nearbyAgents", icon: FiUsers, active: router.pathname === "/user/nearbyAgents" },
  ];

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    // Only the page area scrolls: the window never does, so header and sidebar stay in place
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F7F8FA]">
      <Header />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-gray-200 bg-white lg:flex lg:h-full lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r">
          {/* Phone: bar with the current page; tap to slide the menu in from the left */}
          {(() => {
            const current = items.find((item) => item.active) || items[0];
            const CurrentIcon = current.icon;
            const totalBadge = items.reduce((sum, item) => sum + (item.active ? 0 : item.count || 0), 0);

            return (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-controls="dashboard-drawer"
                className="flex w-full items-center gap-3 px-[16px] py-[12px] text-left text-sm font-semibold text-[var(--secondary-color)] lg:hidden"
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFECD3] text-[var(--primary-color)]">
                  <FiMenu size={18} aria-hidden="true" />
                  {totalBadge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--primary-color)]" aria-label="New items" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-[#62748E]">My Dashboard</span>
                  <span className="flex items-center gap-1.5 truncate">
                    <CurrentIcon size={14} className="shrink-0 text-[var(--primary-color)]" aria-hidden="true" />
                    {current.label}
                  </span>
                </span>
                <FiChevronRight size={18} aria-hidden="true" className="shrink-0 text-[#62748E]" />
              </button>
            );
          })()}

          {/* Phone: dark backdrop behind the drawer (tap to close) */}
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className={`fixed inset-0 z-[1040] bg-black/40 transition-opacity duration-300 lg:hidden ${
              menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          {/* Phone: drawer sliding in from the left. Desktop: the normal full-height sidebar. */}
          <div
            id="dashboard-drawer"
            className={`fixed inset-y-0 left-0 z-[1050] flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            } lg:static lg:z-auto lg:w-full lg:max-w-none lg:min-h-0 lg:flex-1 lg:translate-x-0 lg:shadow-none lg:transition-none`}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 p-[16px]">
              <UserAvatar user={user} className="h-11 w-11 bg-[var(--primary-color)] text-lg text-white" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-[var(--secondary-color)]">{user.name}</div>
                {user.email && <div className="truncate text-xs text-[#62748E]">{user.email}</div>}
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#62748E] transition hover:bg-gray-100 hover:text-[var(--secondary-color)] lg:hidden"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Dashboard" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-[8px] py-[8px]">
              {items.map(({ label, href, icon: Icon, active, count }) => (
                <NextLink
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-[12px] py-[10px] text-sm font-semibold no-underline transition-colors ${
                    active
                      ? "bg-[#FFECD3] text-[var(--primary-color)]"
                      : "text-[var(--secondary-color)] hover:bg-gray-50 hover:text-[var(--primary-color)]"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                  <Badge count={count} />
                </NextLink>
              ))}

              {/* Logout: card at the bottom of the menu */}
              <div className="mt-auto border-t border-gray-100 pt-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLogoutOpen(true);
                  }}
                  className="group flex w-full items-center gap-3 whitespace-nowrap rounded-xl border border-red-100 bg-red-50/40 px-[12px] py-[10px] text-left text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                    <FiLogOut size={16} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span>Logout</span>
                    <span className="text-[11px] font-normal text-red-400">Sign out of your account</span>
                  </span>
                  <FiChevronRight className="ml-auto shrink-0 text-red-300 transition-transform group-hover:translate-x-0.5" size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          </div>
        </aside>

        <div data-dashboard-content className={`min-h-0 min-w-0 w-full flex-1 px-[16px] pb-[24px] pt-[20px] lg:px-[24px] lg:pt-[24px] ${isChatPage ? "overflow-hidden" : "overflow-y-auto"}`}>{/* Side ads (Admin -> Ads, Customer Dashboard). Chat keeps the full width */}
          {isChatPage ? children : <SideAds page="user_dashboard" top="top-0" wrapClass="">{children}</SideAds>}
        </div>
      </div>

      <LogoutConfirm isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleLogout} />
    </div>
  );
}

// Customer dashboard page: site header + sidebar, no footer.
// onlyCustomers: other roles get the page as it is (e.g. /web/profile for sellers / brokers).
export default function UserDashboardLayout({ children, onlyCustomers = false }) {
  const { user, authLoading } = useUser();

  if (onlyCustomers && (authLoading || user?.role !== "customer")) {
    return children;
  }

  return (
    <PrivateRoute allowedRoles={["customer"]}>
      <DashboardShell>{children}</DashboardShell>
    </PrivateRoute>
  );
}

// Use as Page.getLayout: the layout stays mounted when moving between dashboard pages
// (header + sidebar don't reload, so the page doesn't blink). Same layout type on every page.
export const userDashboardLayout = (page) => <UserDashboardLayout>{page}</UserDashboardLayout>;

export const customerOnlyDashboardLayout = (page) => <UserDashboardLayout onlyCustomers>{page}</UserDashboardLayout>;
