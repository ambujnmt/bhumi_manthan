// Header Buyer / Broker / Seller -> same login popup as the floating "Login" button
// (components/Innerpages/StickyLoginForm). The popup is only on some pages (home),
// so openLoginPopup() returns false when no popup is on the page -> caller opens /login instead.

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
