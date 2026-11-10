import React from "react";
import {
    FaBath,
    FaBed,
    FaBuilding,
    FaCalendarAlt,
    FaCar,
    FaCity,
    FaCompass,
    FaCouch,
    FaFileSignature,
    FaHourglassHalf,
    FaMoneyBillWave,
    FaRulerCombined,
    FaShieldAlt,
    FaUserFriends,
    FaUsers,
    FaUtensils,
    FaVectorSquare,
    FaVenusMars,
    FaWrench,
} from "react-icons/fa";
import { getFieldRules } from "../../Admin/PropertyManagement/propertyFieldRules";

const sqft = (value) => `${Number(value).toLocaleString("en-IN")} sq. ft.`;
const rupees = (value) =>
    Number(value).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = (value) => {
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const has = (value) => value !== null && value !== undefined && value !== "";

/**
 * Rules for a saved property (same as the admin form: category -> type -> listing type)
 */
export const propertyRules = (property) =>
    getFieldRules({
        categorySlug: property?.category?.slug || "",
        subSlug: property?.sub_category?.slug || "",
        listingType: property?.listing_type || "",
    });

/**
 * Price label + "/ month" for rent ("Monthly Rent (₹)" -> "Monthly Rent")
 */
export const priceInfo = (property) => {
    const rules = propertyRules(property);
    const label = rules.labelFor("price", "Price").replace(/\s*\(₹\)\s*/, "");

    return { label, perMonth: rules.listing === "Rent" && rules.kind !== null };
};

/**
 * "3 BHK Apartment" / "Shop" / "PG" (same label as search cards)
 */
export const propertyTypeLabel = (property) => {
    const type = property?.sub_category?.name || property?.property_type;

    if (property?.configuration && type) return `${property.configuration} ${type}`;

    return property?.configuration || type || "Property";
};

/**
 * Short facts for a listing card (max 3), by property type:
 *   home -> beds, baths, area | plot -> plot area, facing | office / shop -> area, washrooms, floor
 *   PG -> sharing, PG for, meals
 */
export const cardSpecs = (property) => {
    const rules = propertyRules(property);
    const kind = rules.kind;
    const area = (value) => `${Number(value).toLocaleString("en-IN")} sq.ft`;

    const beds = has(property.bedrooms) && { icon: FaBed, text: `${property.bedrooms} Beds` };
    const baths = has(property.bathrooms) && { icon: FaBath, text: `${property.bathrooms} Baths` };
    const superArea = has(property.super_area) && Number(property.super_area) > 0 && { icon: FaVectorSquare, text: area(property.super_area) };
    const plotArea = has(property.plot_area) && Number(property.plot_area) > 0 && { icon: FaRulerCombined, text: `${area(property.plot_area)} plot` };
    const washrooms = has(property.bathrooms) && { icon: FaBath, text: `${property.bathrooms} Washroom${Number(property.bathrooms) === 1 ? "" : "s"}` };
    const floor = has(property.floor) && { icon: FaBuilding, text: Number(property.floor) === 0 ? "Ground Floor" : `Floor ${property.floor}` };

    const byKind = {
        plot: [plotArea || superArea, has(property.facing) && { icon: FaCompass, text: `${property.facing} Facing` }],
        office: [superArea, washrooms, floor],
        shop: [superArea, floor, washrooms],
        warehouse: [superArea, plotArea, washrooms],
        pg: [
            has(property.pg_sharing) && { icon: FaUsers, text: `${property.pg_sharing} Sharing` },
            has(property.pg_gender) && { icon: FaVenusMars, text: property.pg_gender },
            has(property.pg_meals) && { icon: FaUtensils, text: `Meals ${property.pg_meals.toLowerCase()}` },
        ],
        independent: [beds, baths, plotArea || superArea],
    };

    // flat / unknown type -> old card (beds, baths, area)
    return (byKind[kind] || [beds, baths, superArea]).filter(Boolean).slice(0, 3);
};

/**
 * Property Details grid: only the fields that belong to this property type,
 * and only the ones that have a value.
 */
export default function PropertySpecs({ property }) {
    const rules = propertyRules(property);
    const label = (name, base) => rules.labelFor(name, base).replace(/\s*\((sq\. ft\.|₹|₹ \/ month)\)\s*/, "");
    const show = (name) => rules.isVisible(name) && has(property[name]);

    const floorValue = has(property.floor)
        ? `${Number(property.floor) === 0 ? "Ground" : property.floor}${has(property.total_floors) ? ` (out of ${property.total_floors})` : ""}`
        : null;

    const specs = [
        show("super_area") && { icon: FaVectorSquare, label: label("super_area", "Super Area"), value: sqft(property.super_area) },
        show("carpet_area") && { icon: FaRulerCombined, label: "Carpet Area", value: sqft(property.carpet_area) },
        show("plot_area") && { icon: FaRulerCombined, label: "Plot Area", value: sqft(property.plot_area) },
        rules.isVisible("configuration") &&
            (has(property.configuration) || has(property.bedrooms)) &&
            rules.kind !== "pg" && {
                icon: FaBed,
                label: "Configuration",
                value: property.configuration || `${property.bedrooms} BHK`,
            },
        show("bedrooms") && rules.kind === "pg" && { icon: FaBed, label: label("bedrooms", "Rooms"), value: property.bedrooms },
        show("bathrooms") && { icon: FaBath, label: label("bathrooms", "Bathrooms"), value: property.bathrooms },
        show("balconies") && { icon: FaBuilding, label: "Balconies", value: property.balconies },
        rules.isVisible("floor") && floorValue && { icon: FaBuilding, label: "Floor", value: floorValue },
        !rules.isVisible("floor") && show("total_floors") && {
            icon: FaBuilding,
            label: label("total_floors", "Total Floors"),
            value: property.total_floors,
        },
        show("parking") && { icon: FaCar, label: "Parking", value: property.parking },
        show("facing") && { icon: FaCompass, label: label("facing", "Facing"), value: property.facing },
        show("furnishing") && { icon: FaCouch, label: label("furnishing", "Furnishing"), value: property.furnishing },
        show("ownership") && { icon: FaFileSignature, label: "Type of Ownership", value: property.ownership },
        show("age_of_property") && { icon: FaHourglassHalf, label: "Age of Property", value: property.age_of_property },

        // Rent / Lease
        show("security_deposit") && { icon: FaShieldAlt, label: "Security Deposit", value: rupees(property.security_deposit) },
        show("maintenance_charges") && { icon: FaWrench, label: "Maintenance", value: `${rupees(property.maintenance_charges)} / month` },
        show("available_from") && { icon: FaCalendarAlt, label: "Available From", value: date(property.available_from) },
        show("preferred_tenants") && { icon: FaUserFriends, label: "Preferred Tenants", value: property.preferred_tenants },

        // PG
        show("pg_sharing") && { icon: FaUsers, label: "Sharing Type", value: property.pg_sharing },
        show("pg_gender") && { icon: FaVenusMars, label: "PG For", value: property.pg_gender },
        show("pg_meals") && { icon: FaUtensils, label: "Meals", value: property.pg_meals },

        show("price_per_sqft") && { icon: FaMoneyBillWave, label: "Price per Sq. Ft.", value: rupees(property.price_per_sqft) },
        has(property.project) && { icon: FaCity, label: "Project", value: property.project },
    ].filter(Boolean);

    if (specs.length === 0) return null;

    return (
        <div className="mt-6 mb-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
            {specs.map(({ icon: Icon, label: name, value }) => (
                <div key={name} className="flex items-center gap-3">
                    <Icon className="shrink-0 text-[20px] text-[var(--primary-color)]" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-[14px] text-[#768198] mb-1">{name}</p>
                        <p className="text-[16px] font-bold text-[#202D47] mb-0 break-words">{value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
