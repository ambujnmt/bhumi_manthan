/*
|--------------------------------------------------------------------------
| Admin property form: which fields show / are required, by
| Category (residential / commercial / rental) -> Property Type (sub category) -> Listing Type
|--------------------------------------------------------------------------
| Used by Create.jsx and Update.jsx.
| Only the "managed" fields below change; title, price, location, agent ... always show.
| Hidden fields are sent empty, so a value typed for another type is not saved.
*/

const AGE_OPTIONS = ["New Construction", "0-1 Years", "1-5 Years", "5-10 Years", "10+ Years"];

/**
 * Fields that depend on the property type (added to the Create / Update sections)
 */
const TYPE_FIELDS = {
    "Pricing and Area": [
        { name: "carpet_area", label: "Carpet Area (sq. ft.)", type: "number", placeholder: "1000" },
        { name: "plot_area", label: "Plot Area (sq. ft.)", type: "number", placeholder: "2400" },
        { name: "security_deposit", label: "Security Deposit (₹)", type: "number", placeholder: "50000" },
        { name: "maintenance_charges", label: "Maintenance (₹ / month)", type: "number", placeholder: "3000" },
        { name: "available_from", label: "Available From", type: "date" },
    ],
    "Property Details": [
        { name: "age_of_property", label: "Age of Property", type: "select", options: AGE_OPTIONS },
        {
            name: "ownership",
            label: "Ownership",
            type: "select",
            options: ["Freehold", "Leasehold", "Co-operative Society", "Power of Attorney"],
        },
        {
            name: "preferred_tenants",
            label: "Preferred Tenants",
            type: "select",
            options: ["Any", "Family", "Bachelors", "Company", "Students"],
        },
        { name: "pg_sharing", label: "Sharing Type", type: "select", options: ["Single", "Double", "Triple", "Four or More"] },
        { name: "pg_gender", label: "PG For", type: "select", options: ["Boys", "Girls", "Co-living"] },
        { name: "pg_meals", label: "Meals", type: "select", options: ["Included", "Not Included", "Optional"] },
    ],
};

// Form keys for the new fields (empty by default)
export const TYPE_FIELD_DEFAULTS = Object.values(TYPE_FIELDS)
    .flat()
    .reduce((values, field) => ({ ...values, [field.name]: "" }), {});

/**
 * Add the type fields to a form's sections (by section title; fields already there are kept)
 */
export const withTypeFields = (sections) =>
    sections.map((section) => {
        const existing = new Set(section.fields.map((field) => field.name));
        const extra = (TYPE_FIELDS[section.title] || []).filter((field) => !existing.has(field.name));

        // Saved properties may already have age / ownership as text fields -> use the select version
        const fields = section.fields.map((field) =>
            (TYPE_FIELDS[section.title] || []).find((item) => item.name === field.name) || field
        );

        return { ...section, fields: [...fields, ...extra] };
    });

// Fields controlled by the rules
const MANAGED = [
    "configuration",
    "price_per_sqft",
    "super_area",
    "carpet_area",
    "plot_area",
    "bedrooms",
    "bathrooms",
    "balconies",
    "parking",
    "floor",
    "total_floors",
    "facing",
    "furnishing",
    "age_of_property",
    "ownership",
    "security_deposit",
    "maintenance_charges",
    "available_from",
    "preferred_tenants",
    "pg_sharing",
    "pg_gender",
    "pg_meals",
];

/**
 * Sub category slug -> kind of property (admin can add new sub categories: fall back by category)
 */
export const propertyKind = (categorySlug, subSlug) => {
    switch (subSlug) {
        case "apartment":
        case "flats":
            return "flat";
        case "villa":
        case "house":
        case "houses":
        case "farmhouse":
            return "independent";
        case "plot":
        case "land":
            return "plot";
        case "office":
            return "office";
        case "shop":
        case "shops":
        case "showroom":
            return "shop";
        case "warehouse":
            return "warehouse";
        case "pg":
            return "pg";
        default:
            break;
    }

    if (!subSlug) return null;

    return categorySlug === "commercial" ? "office" : "flat";
};

/**
 * Fields per kind: { show: [...], required: [...], labels: {...} }
 */
const KIND_FIELDS = {
    flat: {
        show: ["configuration", "super_area", "carpet_area", "bedrooms", "bathrooms", "balconies", "parking", "floor", "total_floors", "facing", "furnishing", "age_of_property"],
        required: ["super_area", "bedrooms", "bathrooms", "floor", "total_floors", "furnishing"],
    },
    independent: {
        show: ["configuration", "super_area", "carpet_area", "plot_area", "bedrooms", "bathrooms", "balconies", "parking", "total_floors", "facing", "furnishing", "age_of_property"],
        required: ["super_area", "plot_area", "bedrooms", "bathrooms", "furnishing"],
        labels: { super_area: "Built-up Area (sq. ft.)", total_floors: "Floors in the House" },
    },
    plot: {
        show: ["plot_area", "facing"],
        required: ["plot_area"],
        labels: { facing: "Plot Facing" },
    },
    office: {
        show: ["super_area", "carpet_area", "bathrooms", "parking", "floor", "total_floors", "facing", "furnishing", "age_of_property"],
        required: ["super_area", "floor", "furnishing"],
        labels: { bathrooms: "Washrooms", furnishing: "Furnishing / Fit-out" },
    },
    shop: {
        show: ["super_area", "carpet_area", "bathrooms", "parking", "floor", "total_floors", "facing", "furnishing", "age_of_property"],
        required: ["super_area", "floor"],
        labels: { bathrooms: "Washrooms", floor: "Floor (0 = Ground)" },
    },
    warehouse: {
        show: ["super_area", "plot_area", "bathrooms", "parking", "facing", "age_of_property"],
        required: ["super_area"],
        labels: { super_area: "Covered Area (sq. ft.)", bathrooms: "Washrooms" },
    },
    pg: {
        show: ["bedrooms", "bathrooms", "floor", "total_floors", "parking", "furnishing", "pg_sharing", "pg_gender", "pg_meals"],
        required: ["bedrooms", "furnishing", "pg_sharing", "pg_gender", "pg_meals"],
        labels: { bedrooms: "Total Rooms", bathrooms: "Bathrooms" },
    },
};

// Residential homes / PG can ask for a tenant type; commercial cannot
const TENANT_KINDS = ["flat", "independent", "pg"];

/**
 * Rules for the selected Category + Property Type + Listing Type.
 *
 * Returns:
 *   kind            -> "flat" | "independent" | "plot" | "office" | "shop" | "warehouse" | "pg" | null (nothing selected)
 *   listingOptions  -> allowed Listing Type values
 *   statusOptions   -> allowed Property Status values
 *   isVisible(name) / isRequired(name, baseRequired) / labelFor(name, baseLabel)
 */
export const getFieldRules = ({ categorySlug = "", subSlug = "", listingType = "" } = {}) => {
    const kind = propertyKind(categorySlug, subSlug);

    const listingOptions =
        kind === "pg"
            ? ["Rent"]
            : categorySlug === "rental"
                ? kind === "office" || kind === "shop"
                    ? ["Rent", "Lease"]
                    : ["Rent"]
                : ["Sale", "Rent", "Lease"];

    const listing = listingOptions.includes(listingType) ? listingType : listingOptions[0];
    const isSale = listing === "Sale";

    // Nothing selected yet -> old form (every field, original required marks)
    if (!kind) {
        return {
            kind: null,
            listing,
            listingOptions,
            statusOptions: ["Ready to Move", "Under Construction", "Upcoming"],
            isVisible: (name) => !["carpet_area", "plot_area", "security_deposit", "maintenance_charges", "available_from", "preferred_tenants", "pg_sharing", "pg_gender", "pg_meals"].includes(name),
            isRequired: (name, base) => Boolean(base),
            labelFor: (name, base) => base,
        };
    }

    const { show, required, labels = {} } = KIND_FIELDS[kind];
    const visible = new Set(show);
    const needed = new Set(required);

    if (isSale) {
        // Price per sq. ft. makes sense for area based sale listings
        if (kind !== "pg") visible.add("price_per_sqft");
        visible.add("ownership");
    } else {
        visible.add("security_deposit");
        visible.add("available_from");
        needed.add("security_deposit");
        needed.add("available_from");

        if (kind !== "plot") visible.add("maintenance_charges");
        if (TENANT_KINDS.includes(kind)) visible.add("preferred_tenants");

        // Age matters for sale, not much for rent
        visible.delete("age_of_property");
    }

    const priceLabel = isSale ? "Price (₹)" : listing === "Lease" ? "Lease Amount (₹)" : "Monthly Rent (₹)";

    const statusOptions = isSale
        ? kind === "plot"
            ? ["Ready to Register", "Under Development", "Upcoming"]
            : ["Ready to Move", "Under Construction", "Upcoming"]
        : ["Ready to Move", "Available Soon"];

    return {
        kind,
        listing,
        listingOptions,
        statusOptions,
        isVisible: (name) => !MANAGED.includes(name) || visible.has(name),
        isRequired: (name, base) => (MANAGED.includes(name) ? needed.has(name) : Boolean(base)),
        labelFor: (name, base) => (name === "price" ? priceLabel : labels[name] || base),
    };
};

/**
 * Sections with only the visible fields, required marks / labels / options from the rules.
 * Sections left with no fields are dropped (except ones with their own content).
 */
export const applyFieldRules = (sections, rules, keepTitles = []) =>
    sections
        .map((section) => ({
            ...section,
            fields: section.fields
                .filter((field) => rules.isVisible(field.name))
                .map((field) => ({
                    ...field,
                    label: rules.labelFor(field.name, field.label),
                    required: rules.isRequired(field.name, field.required),
                    options:
                        field.name === "listing_type"
                            ? rules.listingOptions
                            : field.name === "status"
                                ? rules.statusOptions
                                : field.options,
                })),
        }))
        .filter((section) => section.fields.length > 0 || keepTitles.includes(section.title));

/**
 * Form values to send: hidden type fields become empty (not saved for this type)
 */
export const cleanHiddenFields = (form, rules) =>
    Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, MANAGED.includes(key) && !rules.isVisible(key) ? "" : value])
    );
