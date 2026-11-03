"use client";

import { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";
import PropertyVideoPlayer, { resolveVideo } from "../../../Innerpages/PropertyDetails/PropertyVideo";
import { getYoutuberVideos } from "../../../../utils/fetchApi";

const YOUTUBE_EMBED = /youtube-nocookie\.com\/embed\/([\w-]+)/;

// Admin's thumbnail, else YouTube's own picture of the video
const thumbnailOf = (item, video) => {
  if (item.thumbnail) return item.thumbnail;

  const youtubeId = video?.src.match(YOUTUBE_EMBED)?.[1];

  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;
};

const VideoCard = ({ item, playing, onPlay, onClose }) => {
  const video = resolveVideo(item);
  const thumbnail = thumbnailOf(item, video);
  const label = item.title || `Video by ${item.youtuber_name}`;

  if (!video) return null;

  const cover = (
    <>
      {thumbnail ? (
        <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : video.type === "file" ? (
        // First frame of the uploaded video
        <video src={`${video.src}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
      ) : null}

      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-color)] text-white shadow-lg transition-transform group-hover:scale-110">
          <FaPlay size={18} className="ml-1" aria-hidden="true" />
        </span>
      </span>
    </>
  );

  const coverClass = "group absolute inset-0 block h-full w-full overflow-hidden";

  return (
    <article className="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
      <div className="relative aspect-video bg-gray-900">
        {playing ? (
          <PropertyVideoPlayer video={video} title={label} onClose={onClose} />
        ) : video.type === "link" ? (
          // Not a video we can play here: opens in a new tab
          <a href={video.src} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${label}`} className={coverClass}>
            {cover}
          </a>
        ) : (
          <button type="button" aria-label={`Play ${label}`} onClick={onPlay} className={coverClass}>
            {cover}
          </button>
        )}
      </div>

      <div className="p-[14px]">
        {item.title && (
          <h3 className="mb-[4px] line-clamp-2 text-[15px] font-semibold text-[var(--text-color1)]">{item.title}</h3>
        )}
        <p className="mb-0 text-[13px] font-medium text-[var(--text-color2)]">{item.youtuber_name}</p>
      </div>
    </article>
  );
};

// initialVideos: loaded on server (pages/index.jsx), null = load in browser
export default function YoutuberVideos({ initialVideos = null }) {
  const [videos, setVideos] = useState(initialVideos || []);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (initialVideos) return;

    getYoutuberVideos()
      .then((res) => setVideos(res?.data?.videos || []))
      .catch((error) => console.error("YouTuber videos fetch error:", error?.message));
  }, [initialVideos]);

  if (videos.length === 0) return null;

  return (
    <section className="w-full py-14" aria-labelledby="youtuber-videos-title">
      <div className="container">
        <div className="mb-6 text-center">
          <h2 id="youtuber-videos-title" className="text-[28px] font-bold text-[var(--text-color1)]">
            Watch What YouTubers Say About Us
          </h2>
          <p className="mb-0 text-[16px] text-[var(--text-color2)]">
            Property tours and reviews by popular creators
          </p>
        </div>

        {/* More than fit on screen: swipe / scroll sideways */}
        <div className={`flex snap-x gap-[20px] overflow-x-auto pb-[8px] ${videos.length < 3 ? "lg:justify-center" : ""}`}>
          {videos.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              playing={playingId === item.id}
              onPlay={() => setPlayingId(item.id)}
              onClose={() => setPlayingId(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
