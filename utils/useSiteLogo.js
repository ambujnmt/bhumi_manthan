import { useEffect, useState } from "react";
import { getHeader } from "./fetchApi";

export const DEFAULT_HEADER_LOGO = "/assets/img/logo.png";
// Site icon: fixed backend URL, so the icon is in page HTML from the start (no blink).
// Not saved -> 404 -> browser shows no icon.
export const SITE_FAVICON_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}settings/favicon`;

// One request per page load, shared by every component using the hooks
let headerRequest = null;

// Call after saving logo / site icon in admin
export const refreshSiteLogo = () => {
  headerRequest = null;
};

const loadHeader = () => {
  if (!headerRequest) {
    headerRequest = getHeader()
      .then((res) => res?.data?.header || {})
      .catch(() => ({}));
  }

  return headerRequest;
};

const useHeaderValue = (field, fallback) => {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let active = true;

    loadHeader().then((header) => {
      if (active) setValue(header[field] || fallback);
    });

    return () => {
      active = false;
    };
  }, [field, fallback]);

  return value;
};

// Header logo set from Admin → Site Settings → Header
export default function useSiteLogo() {
  return useHeaderValue("logo", DEFAULT_HEADER_LOGO);
}
