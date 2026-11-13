import { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";

const ID_PATTERN = /^[\w-]+$/;

/**
 * Video link -> silent, looping embed (an ad plays by itself, like a GIF).
 * Only the video id from the link reaches the iframe, never the link itself.
 * Not YouTube / Vimeo -> null (shown as a "Watch video" link)
 */
export const adEmbedUrl = (link) => {
  let url;

  try {
    url = new URL(link);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parts.find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1` : null;
  }

  let id = null;

  if (host === "youtu.be") {
    id = parts[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = ["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1] : url.searchParams.get("v");
  }

  return id && ID_PATTERN.test(id)
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0`
    : null;
};

const isVideoFile = (link) => /\.(mp4|webm|mov)$/i.test(String(link).split(/[?#]/)[0]);

// Click link: "/web/plans" = page of this website (same tab), "https://..." = other website (new tab).
// Anything else (javascript:, //host ...) is ignored.
const clickTarget = (link) => {
  const value = typeof link === "string" ? link.trim() : "";

  if (/^\/(?!\/)/.test(value)) return { href: value, external: false };
  if (/^https?:\/\//i.test(value)) return { href: value, external: true };

  return null;
};

// Wraps the ad in its click link (when it has one)
function AdLink({ target, label, className = "", children }) {
  if (!target) return children;

  const props = target.external ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {};

  return (
    <a href={target.href} aria-label={label} className={`block no-underline ${className}`} {...props}>
      {children}
    </a>
  );
}

/**
 * Main media of an ad (desktop, or every screen when there is no mobile image).
 */
function MainMedia({ ad, className = "", alt = "Advertisement", shape = "tall" }) {
  if (!ad) return null;

  const box = `block w-full overflow-hidden rounded-lg bg-black ${className}`;
  // Video embeds / link box: tall = side column, wide = page banner
  const aspect = shape === "wide" ? "aspect-video max-h-[420px]" : "aspect-[9/16]";
  const target = clickTarget(ad.link_url);
  const label = target ? `${alt} - open link` : undefined;

  if (ad.image) {
    return (
      <AdLink target={target} label={label}>
        <img
          src={ad.image}
          alt={alt}
          decoding="async"
          className={`block h-auto w-full rounded-lg ${shape === "wide" ? "max-h-[420px] object-contain" : "object-cover"} ${className}`}
        />
      </AdLink>
    );
  }

  const videoSrc = ad.video_file || (ad.video_url && isVideoFile(ad.video_url) ? ad.video_url : null);

  if (videoSrc) {
    return (
      <AdLink target={target} label={label}>
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          className={`${box} h-auto ${shape === "wide" ? "max-h-[420px] object-contain" : ""}`}
        />
      </AdLink>
    );
  }

  const embed = ad.video_url ? adEmbedUrl(ad.video_url) : null;

  if (embed) {
    return (
      <div className={`${box} relative ${aspect}`}>
        <iframe
          src={embed}
          title={alt}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
        {/* Clicks on an iframe never reach the page -> transparent link on top */}
        {target && <AdLink target={target} label={label} className="absolute inset-0 z-10 cursor-pointer" />}
      </div>
    );
  }

  if (ad.video_url) {
    // Not YouTube / Vimeo: click link if set, else the video itself
    const fallbackTarget = target || clickTarget(ad.video_url);

    return (
      <AdLink target={fallbackTarget} label={label || `${alt} - watch video`}>
        <span className={`${box} flex ${aspect} flex-col items-center justify-center gap-2 text-[12px] font-semibold text-white`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--primary-color,#E87722)]">
            <FaPlay size={13} className="ml-0.5" />
          </span>
          {target ? "Learn more" : "Watch video"}
        </span>
      </AdLink>
    );
  }

  return null;
}

// lg breakpoint (1024px): below it = phones / tablets
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * true (desktop) / false (phone, tablet) / null (not known yet: server render + first paint)
 */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(null);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return desktop;
}

/**
 * One ad: image, uploaded video (autoplay, muted, loop) or video link (YouTube / Vimeo embed).
 * ad = { image, video_file, video_url, link_url, mobile_image }
 * link_url set     -> clicking the ad opens it.
 * mobile_image set -> phones / tablets show that image instead (the video is not even loaded there).
 */
export default function AdMedia({ ad, className = "", alt = "Advertisement", shape = "tall" }) {
  const desktop = useIsDesktop();

  if (!ad) return null;
  if (!ad.mobile_image) return <MainMedia ad={ad} className={className} alt={alt} shape={shape} />;

  const mobile = (
    <AdLink target={clickTarget(ad.link_url)} label={ad.link_url ? `${alt} - open link` : undefined}>
      <img src={ad.mobile_image} alt={alt} decoding="async" className={`mx-auto block h-auto max-h-[220px] w-full rounded-lg object-contain ${className}`} />
    </AdLink>
  );

  // Screen known -> only the one that shows (no hidden video downloading on phones)
  if (desktop === true) return <MainMedia ad={ad} className={className} alt={alt} shape={shape} />;
  if (desktop === false) return mobile;

  // First paint (server HTML): pick by CSS until the screen size is known
  return (
    <>
      <div className="lg:hidden">{mobile}</div>
      <div className="hidden lg:block">
        <MainMedia ad={{ ...ad, video_file: null, video_url: ad.image ? null : ad.video_url }} className={className} alt={alt} shape={shape} />
      </div>
    </>
  );
}
