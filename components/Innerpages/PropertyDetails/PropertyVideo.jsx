import { FiX } from "react-icons/fi";

const ID_PATTERN = /^[\w-]+$/;

// Only the video id from the link reaches the iframe, never the link itself
const embedUrl = (link) => {
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

        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }

    let id = null;

    if (host === "youtu.be") {
        id = parts[0];
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        id = ["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1] : url.searchParams.get("v");
    }

    return id && ID_PATTERN.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
};

const isVideoFile = (link) => /\.(mp4|webm|mov)$/i.test(link.split(/[?#]/)[0]);

/**
 * A property has one video: an uploaded file or a link.
 * file = plays in <video>, embed = YouTube / Vimeo player, link = only opens in a new tab
 */
export const resolveVideo = (property) => {
    if (property?.video_file) return { type: "file", src: property.video_file };

    const link = property?.video_url;

    if (!link) return null;
    if (isVideoFile(link)) return { type: "file", src: link };

    const embed = embedUrl(link);

    return embed ? { type: "embed", src: embed } : { type: "link", src: link };
};

// Fills its parent (the image area), with a button to go back to the images
export default function PropertyVideoPlayer({ video, title, onClose }) {
    return (
        <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl bg-black">
            {video.type === "file" ? (
                <video src={video.src} controls autoPlay playsInline className="h-full w-full object-contain">
                    <a href={video.src}>Download the video</a>
                </video>
            ) : (
                <iframe
                    src={video.src}
                    title={`Video of ${title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full border-0"
                />
            )}

            <button
                type="button"
                aria-label="Close video"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-[var(--primary-color)]"
            >
                <FiX size={18} aria-hidden="true" />
            </button>
        </div>
    );
}
