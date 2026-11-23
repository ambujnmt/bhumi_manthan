import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import SignUp from "../Forms/SignUp";

/**
 * Header "Register" -> same sign-up form and design as the /signUp page, in a popup.
 * Overlay click / Escape / X closes it. Page behind does not scroll while open.
 *
 * onLogin: "Already have an account? Login" inside the popup
 */
export default function RegisterModal({ open, onClose, onLogin }) {
  // Escape closes + lock page scroll while open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center sm:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create your account"
        className="relative my-auto w-full max-w-[1050px] animate-[registerPopup_0.35s_ease-out]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close register popup"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:rotate-90 hover:bg-white hover:text-red-500"
        >
          <FiX className="text-xl" />
        </button>

        <SignUp modal onLogin={onLogin} onDone={onClose} />
      </div>

      <style jsx global>{`
        @keyframes registerPopup {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
