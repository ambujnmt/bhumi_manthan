import { useEffect, useState } from "react";

/**
 * User photo (profile_image) or the name initial when there is no photo / it fails to load.
 * Size, colors and font come from className, e.g.
 *   <UserAvatar user={user} className="h-10 w-10 bg-[var(--primary-color)] text-base text-white" />
 */
export default function UserAvatar({ user, className = "", alt }) {
  const image = user?.profile_image || null;
  const [failed, setFailed] = useState(false);

  // New photo -> try loading it again
  useEffect(() => setFailed(false), [image]);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${className}`}>
      {image && !failed ? (
        <img
          src={image}
          alt={alt || user?.name || "Profile photo"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
