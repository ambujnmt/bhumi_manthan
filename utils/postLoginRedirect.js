// Page a customer should land on after login. Kept in sessionStorage (not the URL) so it
// survives Sign Up -> Verify OTP -> Login, and cannot be set from an outside link.
const KEY = "post_login_redirect";
const BOOKING_KEY = "book_after_login";

export const rememberPostLoginRedirect = (path) => {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage blocked: the customer simply lands on the home page after login
  }
};

export const postLoginRedirect = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

// Guest clicked Book Appointment on this listing: open the booking window after login
export const rememberBookingAfterLogin = (listingKey) => {
  try {
    sessionStorage.setItem(BOOKING_KEY, String(listingKey));
  } catch {
    // Storage blocked: the customer simply clicks the button again after login
  }
};

export const isBookingAfterLogin = (listingKey) => {
  try {
    return sessionStorage.getItem(BOOKING_KEY) === String(listingKey);
  } catch {
    return false;
  }
};

export const clearPostLoginRedirect = () => {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(BOOKING_KEY);
  } catch {
    // Nothing to clear
  }
};
