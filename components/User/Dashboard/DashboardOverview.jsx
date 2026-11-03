import { useEffect, useState } from "react";
import NextLink from "next/link";
import { FiCalendar, FiHeart, FiMessageCircle } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { useWishlist } from "../../../context/WishlistContext";
import { getMyAppointments } from "../../../modules/appointments/api";
import { getWishlist } from "../../../utils/fetchApi";
import { subscribeChatUnread } from "../../../utils/firebaseChat";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";

const FALLBACK_IMAGE = "/assets/img/prop-1.png";

const STATUS_BADGES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
};

function StatCard({ href, icon: Icon, label, value }) {
  return (
    <NextLink href={href} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-[20px] no-underline shadow-sm transition-shadow hover:shadow-md">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
        <Icon size={22} />
      </span>
      <span>
        <span className="block text-2xl font-bold leading-tight text-[var(--secondary-color)]">{value ?? "-"}</span>
        <span className="block text-sm text-[#62748E]">{label}</span>
      </span>
    </NextLink>
  );
}

function Panel({ title, href, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-[20px] shadow-sm">
      <div className="mb-[12px] flex items-center justify-between gap-3">
        <h2 className="mb-0 text-base font-bold text-[var(--secondary-color)]">{title}</h2>
        <NextLink href={href} className="text-sm font-semibold text-[var(--primary-color)] no-underline hover:text-[var(--secondary-color)]">
          View all
        </NextLink>
      </div>
      {children}
    </section>
  );
}

const Empty = ({ text, href, action }) => (
  <div className="py-[24px] text-center">
    <p className="mb-[8px] text-sm text-[#62748E]">{text}</p>
    <NextLink href={href} className="text-sm font-semibold text-[var(--primary-color)] no-underline hover:text-[var(--secondary-color)]">
      {action}
    </NextLink>
  </div>
);

export default function DashboardOverview() {
  const { user } = useUser();
  const { ids, idsLoaded, version } = useWishlist();

  const [unread, setUnread] = useState(0);
  const [saved, setSaved] = useState(null);
  const [appointments, setAppointments] = useState(null);

  useEffect(() => subscribeChatUnread(setUnread), []);

  useEffect(() => {
    let cancelled = false;

    getWishlist(1).then((response) => {
      if (!cancelled) setSaved(response.status ? response.data.properties.slice(0, 3) : []);
    });

    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    let cancelled = false;

    getMyAppointments({ upcoming: 1, per_page: 3 })
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch(() => {
        if (!cancelled) setAppointments({ appointments: [], pagination: { total: null } });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const skeleton = <div className="h-[150px] animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div>
      <h1 className="mb-[4px] text-2xl font-bold text-[var(--secondary-color)]">Hello, {user.name}</h1>
      <p className="mb-[20px] text-sm text-[#62748E]">Here is what is happening with your account.</p>

      <div className="mb-[20px] grid grid-cols-1 gap-[16px] sm:grid-cols-3">
        <StatCard href={`/user/myWishlist/myWishlist/${user.id}`} icon={FiHeart} label="Saved properties" value={idsLoaded ? ids.length : null} />
        <StatCard href="/user/appointments" icon={FiCalendar} label="Upcoming appointments" value={appointments?.pagination.total} />
        <StatCard href={`/web/profile/${user.id}?tab=chat`} icon={FiMessageCircle} label="Unread messages" value={unread} />
      </div>

      <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-2">
        <Panel title="Upcoming appointments" href="/user/appointments">
          {!appointments ? skeleton : appointments.appointments.length === 0 ? (
            <Empty text="No upcoming appointments." href="/web/property/searchProperties" action="Find a property to visit" />
          ) : (
            <ul className="mb-0 list-none space-y-3 p-0">
              {appointments.appointments.map((item) => (
                <li key={item.id} className="rounded-xl border border-gray-100 p-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <NextLink
                      href={`/web/propertyDetail/${item.bookable_id}`}
                      className="min-w-0 break-words text-sm font-semibold text-[var(--secondary-color)] no-underline hover:text-[var(--primary-color)]"
                    >
                      {item.bookable_title}
                    </NextLink>
                    <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-[11px] font-semibold capitalize ${STATUS_BADGES[item.status] || ""}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-[4px] text-xs text-[#62748E]">{item.time_label}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recently saved" href={`/user/myWishlist/myWishlist/${user.id}`}>
          {!saved ? skeleton : saved.length === 0 ? (
            <Empty text="Your wishlist is empty." href="/web/property/searchProperties" action="Browse properties" />
          ) : (
            <ul className="mb-0 list-none space-y-3 p-0">
              {saved.map((property) => (
                <li key={property.id}>
                  <NextLink
                    href={`/web/propertyDetail/${property.slug || property.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-[8px] no-underline transition-colors hover:border-[var(--primary-color)]"
                  >
                    <img
                      src={property.main_image || FALLBACK_IMAGE}
                      onError={imageFallback(FALLBACK_IMAGE)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--secondary-color)]">{property.title}</span>
                      <span className="block text-sm font-bold text-[var(--primary-color)]">{formatPropertyPrice(property.price)}</span>
                    </span>
                  </NextLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
