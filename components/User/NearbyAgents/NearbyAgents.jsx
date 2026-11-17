import { useEffect, useMemo, useState } from "react";
import { FiHome, FiMapPin, FiNavigation, FiUsers } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import useUserLocation from "../../../utils/useUserLocation";
import { getNearbyAgents } from "../../../utils/fetchApi";
import { formatDistance } from "../../../utils/formatPrice";
import AgentStars, { AgentAvatar } from "../../Home/Main/HomeSections/AgentStars";
import AgentDetailModal from "../../Home/Main/HomeSections/AgentDetailModal";

// API max per request
const LIMIT = 50;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "broker", label: "Brokers" },
  { key: "seller", label: "Sellers" },
];

/**
 * Customer dashboard: sellers / brokers active near the user (IP location).
 * Nobody nearby (or wrong IP location, e.g. VPN) -> all sellers / brokers.
 * Click a card -> same detail modal as home "Top Rated Sellers & Brokers" (rate, properties).
 */
export default function NearbyAgents() {
  const { ready, location } = useUserLocation();

  const [agents, setAgents] = useState([]);
  const [nearby, setNearby] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!ready) return;

    let active = true;
    setLoading(true);

    getNearbyAgents(location, LIMIT).then((res) => {
      if (!active) return;

      setAgents(Array.isArray(res?.data?.agents) ? res.data.agents : []);
      setNearby(Boolean(res?.status && res?.data?.nearby));
      setFailed(!res?.status);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [ready, location]);

  const counts = useMemo(() => {
    const ofType = (type) => agents.filter((agent) => String(agent.type).toLowerCase() === type).length;
    return { all: agents.length, broker: ofType("broker"), seller: ofType("seller") };
  }, [agents]);

  // Nearest first when nearby, else API order (top rated first)
  const list = useMemo(() => {
    const filtered = filter === "all" ? agents : agents.filter((agent) => String(agent.type).toLowerCase() === filter);

    return nearby
      ? [...filtered].sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
      : filtered;
  }, [agents, filter, nearby]);

  // New rating from the modal -> update the card too
  const handleRated = (key, summary) => {
    setAgents((items) => items.map((agent) => (agent.key === key ? { ...agent, ...summary } : agent)));
    setSelected((agent) => (agent?.key === key ? { ...agent, ...summary } : agent));
  };

  const city = location?.city;

  return (
    <div>
      <h1 className="mb-[4px] text-2xl font-bold text-[var(--secondary-color)]">
        {nearby ? `Brokers & Sellers Near ${city || "You"}` : "Brokers & Sellers"}
      </h1>
      <p className="mb-[20px] text-sm text-[#62748E]">
        {loading
          ? "Finding property experts around you..."
          : nearby
            ? `${counts.broker} ${counts.broker === 1 ? "broker" : "brokers"} & ${counts.seller} ${counts.seller === 1 ? "seller" : "sellers"} active within 50 km${city ? ` of ${city}` : ""}, nearest first.`
            : `No one found near ${city || "your location"} yet, showing all active brokers & sellers (top rated first).`}
      </p>

      {/* Filter */}
      <div className="mb-[16px] flex flex-wrap gap-2" role="tablist" aria-label="Filter by type">
        {FILTERS.map((item) => {
          const active = filter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-[14px] py-[6px] text-sm font-semibold transition ${
                active
                  ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                  : "border-gray-200 bg-white text-[var(--secondary-color)] hover:border-[var(--primary-color)]"
              }`}
            >
              {item.label}
              {!loading && <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-[#62748E]"}`}>{counts[item.key]}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-[200px] animate-pulse rounded-2xl border border-gray-100 bg-white" />
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-[40px] text-center text-sm text-[#62748E] shadow-sm">
          Could not load brokers & sellers. Please try again later.
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-[40px] text-center shadow-sm">
          <FiUsers className="mx-auto mb-2 text-[#94A3B8]" size={28} />
          <p className="mb-0 text-sm text-[#62748E]">
            No {filter === "all" ? "brokers or sellers" : FILTERS.find((item) => item.key === filter).label.toLowerCase()} found.
          </p>
        </div>
      ) : (
        <ul className="mb-0 grid list-none grid-cols-1 gap-[16px] p-0 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((agent) => {
            const distance = formatDistance(agent.distance_km);

            return (
              <li key={agent.key}>
                <button
                  type="button"
                  onClick={() => setSelected(agent)}
                  className="group flex h-full w-full flex-col rounded-2xl border border-gray-100 bg-white p-[16px] text-left shadow-sm transition hover:border-orange-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar agent={agent} />
                    <div className="min-w-0">
                      <p className="mb-0 flex items-center gap-1 text-[15px] font-bold text-[var(--secondary-color)]">
                        <span className="truncate">{agent.name}</span>
                        {agent.verified && <MdVerified className="shrink-0 text-[#3B82F6]" size={16} title="Verified" />}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-[#FFECD3] px-2 py-[2px] text-[11px] font-semibold text-[var(--primary-color)]">
                        {agent.type}
                        {agent.experience ? ` · ${agent.experience}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <AgentStars rating={agent.rating_avg} />
                    <span className="text-[12px] text-[#62748E]">
                      {agent.rating_count > 0
                        ? `${Number(agent.rating_avg).toFixed(1)} (${agent.rating_count} ${agent.rating_count === 1 ? "rating" : "ratings"})`
                        : "No ratings yet"}
                    </span>
                  </div>

                  <div className="mt-auto space-y-1 pt-3 text-[12px] text-[#62748E]">
                    {agent.cities?.length > 0 && (
                      <p className="mb-0 flex items-center gap-1">
                        <FiMapPin className="shrink-0" />
                        <span className="truncate">{agent.cities.join(", ")}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="mb-0 flex items-center gap-1">
                        <FiHome className="shrink-0" />
                        {agent.properties_count} {agent.properties_count === 1 ? "property" : "properties"}
                      </p>
                      {distance && (
                        <p className="mb-0 flex items-center gap-1">
                          <FiNavigation className="shrink-0" size={11} /> {distance}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="mt-3 block rounded-lg border border-[var(--primary-color)] py-2 text-center text-[13px] font-semibold text-[var(--primary-color)] transition group-hover:bg-[var(--primary-color)] group-hover:text-white">
                    View Details
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AgentDetailModal agent={selected} onClose={() => setSelected(null)} onRated={handleRated} />
    </div>
  );
}
