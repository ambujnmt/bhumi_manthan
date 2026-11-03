import { useEffect, useState } from "react";
import { FaRegCalendarCheck } from "react-icons/fa";
import BookingModal from "./BookingModal";

/**
 * <BookAppointmentButton bookableType="property" bookableKey={slug} title={title} user={user} />
 * bookableType must exist in the backend config "appointments.bookables".
 * user prefills the form. Booking needs login: without a user, onLoginRequired is called instead.
 * autoOpen opens the booking window for a logged in user (back from the login page).
 */
export default function BookAppointmentButton({ bookableType, bookableKey, title, user, onLoginRequired, autoOpen = false, className = "", label = "Book Appointment" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen && user) setOpen(true);
  }, [autoOpen, user]);

  const handleClick = () => {
    if (user) {
      setOpen(true);
    } else {
      onLoginRequired?.();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-color)] ${className}`}
      >
        <FaRegCalendarCheck size={15} />
        {label}
      </button>

      {open && (
        <BookingModal
          bookableType={bookableType}
          bookableKey={bookableKey}
          title={title}
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
