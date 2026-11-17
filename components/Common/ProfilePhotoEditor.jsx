import { useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiCamera } from "react-icons/fi";
import UserAvatar from "./UserAvatar";
import { removeProfilePhoto, uploadProfilePhoto } from "../../utils/fetchApi";
import { showToast } from "../../store/toast";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Profile photo with a camera button (choose -> uploads at once) and "Remove photo".
 * Used on every profile page (website, admin, seller, broker).
 *
 * onProfileUpdated(user): fresh user from the API -> page state + UserContext,
 * so the header avatar changes right away.
 *
 * avatarClassName: size / colors of the photo circle
 * className: wrapper classes (position, margins)
 * removeClassName: "Remove photo" text color (e.g. white on a dark card)
 */
export default function ProfilePhotoEditor({
  profile,
  onProfileUpdated,
  avatarClassName = "h-20 w-20 bg-[var(--primary-color)] text-3xl text-white",
  className = "",
  removeClassName = "text-[#62748E] hover:text-red-600",
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const run = async (request, fallbackError) => {
    setBusy(true);

    try {
      const res = await request();
      showToast(res?.message || "Profile photo updated successfully.");
      onProfileUpdated?.(res?.data?.user);
    } catch (error) {
      showToast(error?.message || fallbackError, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // same file can be chosen again

    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      showToast("Please choose a JPG, PNG or WEBP image.", "error");
      return;
    }

    if (file.size > PHOTO_MAX_BYTES) {
      showToast("Photo must be 2 MB or smaller.", "error");
      return;
    }

    run(() => uploadProfilePhoto(file), "Unable to update profile photo.");
  };

  const hasPhoto = Boolean(profile?.profile_image);

  return (
    <div className={`flex shrink-0 flex-col items-center gap-1 ${className}`}>
      <div className="relative">
        <UserAvatar user={profile} className={avatarClassName} />

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Spinner size="sm" color="white" />
          </span>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
          title={hasPhoto ? "Change photo" : "Upload photo"}
          className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--secondary-color,#001737)] text-white shadow transition hover:bg-[var(--primary-color,#E87722)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiCamera size={14} />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {hasPhoto && (
        <button
          type="button"
          onClick={() => run(removeProfilePhoto, "Unable to remove profile photo.")}
          disabled={busy}
          className={`text-xs font-semibold transition disabled:opacity-60 ${removeClassName}`}
        >
          Remove photo
        </button>
      )}
    </div>
  );
}
