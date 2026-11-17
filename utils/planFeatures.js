// Plan features / marketing services are stored as { key: true|false }
// (same keys on every plan, so the website can show a ✓ / ✗ comparison).

export const PLAN_FEATURES = {
  property_photos_details: "Property Photos & Details",
  project_location_map: "Project Location on Map",
  contact_leads_dashboard: "Contact Leads via Dashboard",
  featured_search_results: "Featured Listings in Search Results",
  videos_brochure: "Property Videos & Brochure",
  homepage_banner_visibility: "Top Banner Visibility on Homepage",
  lead_contact_details: "Lead Contact Details (Phone/Email)",
  company_profile: "Company Profile Page",
};

// Shorter names for the website comparison table
export const PLAN_FEATURES_SHORT = {
  property_photos_details: "Photos & Details",
  project_location_map: "Location on Map",
  contact_leads_dashboard: "Leads Dashboard",
  featured_search_results: "Featured in Search Results",
  videos_brochure: "Videos & Brochure",
  homepage_banner_visibility: "Homepage / Banner Visibility",
  lead_contact_details: "Lead Contact Details",
  company_profile: "Company Profile Page",
};

export const PLAN_MARKETING = {
  google_ads: "Google Ads",
  facebook: "Facebook",
  twitter: "Twitter",
  linkedin: "LinkedIn",
};

// Flag inside marketing_services, shown as a note instead of a service
export const EXTRA_CHARGES_KEY = "extra_charges_apply";

// "Site Visit Support" -> "site_visit_support"
export const toFeatureKey = (label) =>
  String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// "site_visit_support" -> "Site Visit Support"
const humanize = (key) =>
  String(key)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Old plans may have a list of strings -> { key: true }
export const toFeatureMap = (value) => {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.filter(Boolean).map((item) => [toFeatureKey(item), true])
    );
  }

  return value && typeof value === "object" ? { ...value } : {};
};

// Known keys first (fixed order), then any custom keys of this plan
// -> [{ key, label, enabled }]
export const featureRows = (value, labels, skip = []) => {
  const map = toFeatureMap(value);
  const keys = [...Object.keys(labels), ...Object.keys(map).filter((key) => !(key in labels))];

  return keys
    .filter((key) => !skip.includes(key))
    .map((key) => ({
      key,
      label: labels[key] || humanize(key),
      enabled: Boolean(map[key]),
    }));
};
