import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiMapPin, FiX } from "react-icons/fi";
import { MdCompareArrows } from "react-icons/md";
import { useCompare } from "../../../context/CompareContext";
import { useUser } from "../../../context/UserContext";
import { showToast } from "../../../store/toast";
import { getCompareTable } from "../../../utils/fetchApi";
import { formatPropertyPrice, imageFallback } from "../../../utils/formatPrice";
import { rememberPostLoginRedirect } from "../../../utils/postLoginRedirect";

const FALLBACK_IMAGE = "/assets/img/prop-1.png";
const SEARCH_PATH = "/web/property/searchProperties";
const MIN_TO_COMPARE = 2;

const propertyPath = (property) => `/web/propertyDetail/${property.slug || property.id}`;

const inRupees = (value) => (value ? `₹${Number(value).toLocaleString("en-IN")}` : null);

const floorText = ({ floor, total_floors: total }) =>
  floor && total ? `${floor} of ${total}` : floor || (total ? `${total} floors` : null);

// A row is left out when no property in the table has a value for it
const TABLE_ROWS = [
  ["Price", (p) => (p.price ? formatPropertyPrice(p.price) : null)],
  ["Price per Sq. Ft.", (p) => inRupees(p.price_per_sqft)],
  ["Super Area", (p) => (p.area ? `${Number(p.area).toLocaleString("en-IN")} sq. ft.` : null)],
  ["Listing Type", (p) => p.listing_type],
  ["Configuration", (p) => p.configuration],
  ["Bedrooms", (p) => p.bedrooms],
  ["Bathrooms", (p) => p.bathrooms],
  ["Balconies", (p) => p.balconies],
  ["Status", (p) => p.status],
  ["Furnishing", (p) => p.furnishing],
  ["Floor", floorText],
  ["Facing", (p) => p.facing],
  ["Parking", (p) => p.parking],
  ["Age of Property", (p) => p.age_of_property],
  ["Ownership", (p) => p.ownership],
  ["Location", (p) => p.location],
  ["City", (p) => p.city],
];

const hasValue = (value) => value !== null && value !== undefined && value !== "";

const Message = ({ title, text, children }) => (
  <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-[20px] py-[56px] text-center shadow-sm">
    <span className="mb-[16px] flex h-16 w-16 items-center justify-center rounded-full bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
      <MdCompareArrows size={30} />
    </span>
    <h2 className="mb-[8px] text-lg font-bold text-[var(--secondary-color)]">{title}</h2>
    <p className="mb-[20px] text-sm text-[#62748E]">{text}</p>
    {children}
  </div>
);

const actionClass =
  "rounded-lg bg-[var(--primary-color)] px-[20px] no-underline py-[10px] text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-color)]";

const RemoveButton = ({ property, className }) => {
  const { toggleCompare } = useCompare();

  return (
    <button
      type="button"
      aria-label={`Remove ${property.title} from compare`}
      title="Remove from compare"
      onClick={() => toggleCompare(property.id)}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:text-red-500 ${className}`}
    >
      <FiX size={16} aria-hidden="true" />
    </button>
  );
};

const CompareTable = ({ properties }) => {
  const rows = TABLE_ROWS
    .map(([label, read]) => [label, properties.map(read)])
    .filter(([, values]) => values.some(hasValue));

  return (
    <div className="mt-[20px] overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[640px] table-fixed border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b border-gray-200 align-top">
            <th scope="col" className="w-[150px] bg-gray-50 p-[12px] text-left font-semibold text-[var(--secondary-color)]">
              Property
            </th>
            {properties.map((property) => (
              <th key={property.id} scope="col" className="p-[12px] text-left font-semibold">
                <div className="relative">
                  <img
                    src={property.image || FALLBACK_IMAGE}
                    onError={imageFallback(FALLBACK_IMAGE)}
                    alt={property.title}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                  <RemoveButton property={property} className="absolute right-[6px] top-[6px]" />
                </div>
                <NextLink href={propertyPath(property)} className="mt-[8px] line-clamp-2 text-[var(--text-color1)] no-underline hover:text-[var(--primary-color)]">
                  {property.title}
                </NextLink>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values]) => (
            <tr key={label} className="border-b border-gray-100 last:border-b-0">
              <th scope="row" className="bg-gray-50 p-[12px] text-left font-medium text-[#62748E]">
                {label}
              </th>
              {values.map((value, index) => (
                <td key={properties[index].id} className="break-words p-[12px] text-[var(--text-color1)]">
                  {hasValue(value) ? value : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CompareGroup = ({ group, table, opening, onToggleTable }) => {
  const type = group.property_type;
  const missing = MIN_TO_COMPARE - group.count;

  // A property removed here leaves the open table straight away
  const tableProperties = table?.filter((property) => group.property_ids.includes(property.id));
  const showTable = tableProperties?.length >= MIN_TO_COMPARE;

  return (
    <section aria-labelledby={`compare-${group.property_ids[0]}`} className="rounded-2xl border border-gray-100 bg-white p-[20px] shadow-sm">
      <div className="mb-[16px] flex flex-wrap items-center justify-between gap-3">
        <h2 id={`compare-${group.property_ids[0]}`} className="mb-0 text-lg font-bold text-[var(--secondary-color)]">
          {type} <span className="text-sm font-medium text-[#62748E]">({group.count} of {group.max})</span>
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {group.can_add && (
            <NextLink href={SEARCH_PATH} className="rounded-lg border border-[var(--primary-color)] bg-white px-[20px] py-[10px] text-sm font-semibold text-[var(--primary-color)] no-underline transition-colors hover:bg-[#FFECD3] hover:no-underline">
              Add More
            </NextLink>
          )}
          <button
            type="button"
            disabled={!group.can_compare || opening}
            aria-expanded={showTable}
            onClick={() => onToggleTable(type)}
            className={`${actionClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {opening ? "Loading..." : showTable ? "Hide Comparison" : "Compare"}
          </button>
        </div>
      </div>

      {!group.can_compare && (
        <p className="mb-[16px] text-sm text-amber-700">
          Add {missing} more {type} {missing === 1 ? "property" : "properties"} to compare.
        </p>
      )}

      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
        {group.properties.map((property) => (
          <div key={property.id} className="relative overflow-hidden rounded-xl border border-gray-100">
            <NextLink href={propertyPath(property)} className="block no-underline">
              <img
                src={property.main_image || FALLBACK_IMAGE}
                onError={imageFallback(FALLBACK_IMAGE)}
                alt={property.title}
                className="h-40 w-full object-cover"
              />
              <div className="p-[12px]">
                <h3 className="mb-0 line-clamp-1 text-[15px] font-semibold text-[var(--text-color1)]">{property.title}</h3>
                <p className="mb-0 mt-[6px] flex items-center gap-1 text-[12px] text-[var(--text-color2)]">
                  <FiMapPin className="shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{[property.location, property.city].filter(Boolean).join(", ") || "-"}</span>
                </p>
                <p className="mb-0 mt-[4px] text-[16px] font-bold text-[var(--primary-color)]">{formatPropertyPrice(property.price)}</p>
              </div>
            </NextLink>
            <RemoveButton property={property} className="absolute right-[8px] top-[8px]" />
          </div>
        ))}
      </div>

      {showTable && <CompareTable properties={tableProperties} />}
    </section>
  );
};

export default function CompareProperties() {
  const router = useRouter();
  const { user, authLoading } = useUser();
  const { groups, loaded, error } = useCompare();

  // Property type -> its table rows (open tables only)
  const [tables, setTables] = useState({});
  const [openingType, setOpeningType] = useState("");

  const toggleTable = async (type) => {
    const isOpen = tables[type]?.length >= MIN_TO_COMPARE
      && groups.find((group) => group.property_type === type)?.can_compare;

    if (isOpen) {
      setTables((current) => ({ ...current, [type]: null }));
      return;
    }

    setOpeningType(type);

    const response = await getCompareTable(type);

    setOpeningType("");

    if (response.status) {
      setTables((current) => ({ ...current, [type]: response.data.properties }));
    } else {
      showToast(response.message, "error");
    }
  };

  const goToLogin = () => {
    rememberPostLoginRedirect("/web/compare");
    router.push("/login");
  };

  const renderBody = () => {
    if (authLoading || (user && !loaded)) {
      return <div className="h-[320px] animate-pulse rounded-2xl bg-gray-100" aria-label="Loading compare list" />;
    }

    if (!user) {
      return (
        <Message title="Log in to compare properties" text="Your compare list is saved to your account.">
          <button type="button" onClick={goToLogin} className={actionClass}>Log In</button>
        </Message>
      );
    }

    if (error) {
      return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-[20px] text-red-600">{error}</div>;
    }

    if (groups.length === 0) {
      return (
        <Message title="Your compare list is empty" text="Open a property and click Add to Compare.">
          <NextLink href={SEARCH_PATH} className={actionClass}>Browse Properties</NextLink>
        </Message>
      );
    }

    return (
      <div className="flex flex-col gap-[24px]">
        {groups.map((group) => (
          <CompareGroup
            key={group.property_type}
            group={group}
            table={tables[group.property_type]}
            opening={openingType === group.property_type}
            onToggleTable={toggleTable}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container min-h-[60vh] py-[32px]">
      <h1 className="mb-[6px] text-2xl font-bold text-[var(--secondary-color)]">Compare Properties</h1>
      <p className="mb-[24px] text-sm text-[#62748E]">
        Properties are grouped by type. Compare up to 3 of the same type.
      </p>
      {renderBody()}
    </div>
  );
}
