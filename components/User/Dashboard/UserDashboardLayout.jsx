import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiCalendar, FiGrid, FiHeart, FiLogOut, FiMessageCircle, FiUser } from "react-icons/fi";
import Header from "../../Home/Menu/Header";
import PrivateRoute from "../../PrivateRoute/PrivateRoute";
import { useUser } from "../../../context/UserContext";
import { useWishlist } from "../../../context/WishlistContext";
import { subscribeChatUnread } from "../../../utils/firebaseChat";
import LogoutConfirm from "../../Common/LogoutConfirm";

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

  useEffect(() => subscribeChatUnread(setUnread), []);

  if (!user) return null;

  const isChat = router.query.tab === "chat";
  // Chat fills the page and scrolls inside its own list and messages
  const isChatPage = router.pathname === "/web/profile/[id]" && isChat;
  const items = [
    { label: "Dashboard", href: "/user/dashboard", icon: FiGrid, active: router.pathname === "/user/dashboard" },
    { label: "My Profile", href: `/web/profile/${user.id}`, icon: FiUser, active: router.pathname === "/web/profile/[id]" && !isChat },
    { label: "Messages", href: `/web/profile/${user.id}?tab=chat`, icon: FiMessageCircle, active: router.pathname === "/web/profile/[id]" && isChat, count: unread },
    { label: "My Wishlist", href: `/user/myWishlist/myWishlist/${user.id}`, icon: FiHeart, active: router.pathname.startsWith("/user/myWishlist"), count: ids.length },
    { label: "My Appointments", href: "/user/appointments", icon: FiCalendar, active: router.pathname === "/user/appointments" },
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

      <div className="container flex min-h-0 flex-1 flex-col gap-[16px] pt-[24px] lg:flex-row lg:gap-[20px]">
        <aside className="w-full shrink-0 self-start rounded-2xl border border-gray-100 bg-white shadow-sm lg:max-h-[calc(100%-24px)] lg:w-[260px] lg:overflow-y-auto">
          <div className="hidden items-center gap-3 border-b border-gray-100 p-[16px] lg:flex">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-color)] text-lg font-bold text-white" aria-hidden="true">
              {user.name?.trim().charAt(0).toUpperCase() || "U"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[var(--secondary-color)]">{user.name}</div>
              {user.email && <div className="truncate text-xs text-[#62748E]">{user.email}</div>}
            </div>
          </div>

          {/* Phone: one scrolling row. Desktop: column. */}
          <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto p-[8px] lg:flex-col lg:overflow-visible">
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

            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-[12px] py-[10px] text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 lg:mt-[4px]"
            >
              <FiLogOut size={18} aria-hidden="true" />
              Logout
            </button>
          </nav>
        </aside>

        <div data-dashboard-content className={`min-h-0 min-w-0 w-full flex-1 px-[2px] pb-[24px] ${isChatPage ? "overflow-hidden" : "overflow-y-auto"}`}>{children}</div>
      </div>

      <LogoutConfirm isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleLogout} />
    </div>
  );
}

// Customer dashboard page: site header + sidebar, no footer
export default function UserDashboardLayout({ children }) {
  return (
    <PrivateRoute allowedRoles={["customer"]}>
      <DashboardShell>{children}</DashboardShell>
    </PrivateRoute>
  );
}
