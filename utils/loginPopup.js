// Login is a popup only (components/Innerpages/StickyLoginForm, mounted for every page in _app).
// There is no login page: /login just opens this popup.
//
//   openLogin()                -> open the popup here (falls back to "/?login=1" if not ready yet)
//   loginUrl("/admin/leads")   -> "/?login=1&next=/admin/leads" for redirects / links
//   openLoginPopup()           -> true when a popup opened (low level)

/**
 * URL that opens the login popup, then goes to `next` after login
 */
export const loginUrl = (next = "") => {
  const safe = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "";

  return safe && safe !== "/" ? `/?login=1&next=${encodeURIComponent(safe)}` : "/?login=1";
};

/**
 * Open the login popup on the current page. router: Next.js router (pages or navigation).
 */
export const openLogin = (router = null, next = "") => {
  if (openLoginPopup()) return true;

  // Popup script not loaded yet (first paint): go through the URL instead
  const url = loginUrl(next || (typeof window !== "undefined" ? window.location.pathname + window.location.search : ""));

  if (router?.push) router.push(url);
  else if (typeof window !== "undefined") window.location.href = url;

  return false;
};

const EVENT = "bm:open-login-popup";

export const openLoginPopup = () => {
  if (typeof window === "undefined") return false;

  const detail = { handled: false };
  window.dispatchEvent(new CustomEvent(EVENT, { detail })); // listeners run right away
  return detail.handled;
};

// Used by the popup: open() when the header asks. Returns a cleanup function.
export const onOpenLoginPopup = (open) => {
  const handler = (event) => {
    event.detail.handled = true;
    open();
  };

  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
