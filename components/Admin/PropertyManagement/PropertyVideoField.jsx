import React, { useEffect, useRef, useState } from "react";
import { FiLink, FiUploadCloud, FiX } from "react-icons/fi";
import { showToast } from "../../../store/toast";

const MAX_VIDEO_MB = 30;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// A property has one video: an uploaded file or a link
export const emptyVideo = () => ({ mode: "file", file: null, url: "", savedFile: "", savedUrl: "", removed: false });

export const videoFromProperty = (property) => ({
    ...emptyVideo(),
    mode: property?.video_url ? "link" : "file",
    url: property?.video_url || "",
    savedFile: property?.video_file || "",
    savedUrl: property?.video_url || "",
});

export const appendVideo = (formData, video) => {
    const url = video.url.trim();

    if (video.mode === "file" && video.file) {
        formData.append("video", video.file);
    } else if (video.mode === "link" && url) {
        if (url !== video.savedUrl) formData.append("video_url", url);
    } else if (video.removed || (video.mode === "link" && video.savedUrl)) {
        // Saved video removed, or the saved link was cleared
        formData.append("remove_video", "1");
    }
};

const TABS = [
    ["file", "Upload Video", FiUploadCloud],
    ["link", "Video Link", FiLink],
];

export default function PropertyVideoField({
    value,
    onChange,
    labelClass,
    inputClass,
    fileInputClass,
    description = "Optional. Add one video: upload a file or paste a link, not both.",
}) {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (!value.file) {
            setPreviewUrl("");
            return undefined;
        }

        const url = URL.createObjectURL(value.file);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value.file]);

    // After Reset / save the file input must be empty too
    useEffect(() => {
        if (!value.file && inputRef.current) inputRef.current.value = "";
    }, [value.file]);

    const update = (changes) => onChange({ ...value, ...changes });

    // Only one at a time: choosing a tab drops what was entered in the other one
    const changeMode = (mode) => {
        if (mode === value.mode) return;

        update({ mode, file: null, url: mode === "link" && !value.removed ? value.savedUrl : "" });
    };

    const handleFile = (event) => {
        const file = event.target.files?.[0] || null;

        if (!file) return;

        if (!VIDEO_TYPES.includes(file.type)) {
            event.target.value = "";
            showToast("Upload an MP4, WEBM or MOV video.", "error");
            return;
        }

        if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
            event.target.value = "";
            showToast(`Video must be ${MAX_VIDEO_MB} MB or smaller.`, "error");
            return;
        }

        update({ file });
    };

    const hasSaved = Boolean(value.savedFile || value.savedUrl) && !value.removed;
    const replaceNote = hasSaved && (
        (value.mode === "file" && value.savedUrl) || (value.mode === "link" && value.savedFile)
    );

    return (
        <section className="mb-8">
            <h3 className="mb-2 border-b border-gray-100 pb-3 text-base font-bold text-[#001737]">
                Upload Videos
            </h3>

            <p className="mb-5 text-sm text-[#62748E]">
                {description}
            </p>

            <div role="group" aria-label="Video source" className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
                {TABS.map(([mode, label, Icon]) => (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={value.mode === mode}
                        onClick={() => changeMode(mode)}
                        className={`flex items-center gap-2 rounded-md px-[14px] py-[8px] text-sm font-semibold transition-colors ${
                            value.mode === mode ? "bg-[var(--primary-color)] text-white" : "text-[#62748E] hover:text-[var(--primary-color)]"
                        }`}
                    >
                        <Icon size={15} aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>

            {replaceNote && (
                <p className="mb-3 text-sm text-amber-700">
                    Your saved {value.savedUrl ? "link" : "video"} stays until you add a new {value.mode === "file" ? "video" : "link"} here and save.
                </p>
            )}

            {value.mode === "file" ? (
                <div>
                    <label htmlFor="property_video" className={labelClass}>
                        Video File
                    </label>
                    <input
                        ref={inputRef}
                        id="property_video"
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleFile}
                        className={fileInputClass}
                    />
                    <p className="mb-0 mt-1 text-xs text-[#62748E]">MP4, WEBM or MOV, max {MAX_VIDEO_MB} MB.</p>

                    {value.file ? (
                        <div className="relative mt-3 w-full max-w-md">
                            <video src={previewUrl} controls className="w-full rounded-lg bg-black" />
                            <p className="mb-0 mt-1 break-words text-xs text-gray-500">Selected: {value.file.name}</p>
                            <button
                                type="button"
                                aria-label="Remove selected video"
                                onClick={() => update({ file: null })}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                            >
                                <FiX size={15} aria-hidden="true" />
                            </button>
                        </div>
                    ) : (
                        value.savedFile && !value.removed && (
                            <div className="relative mt-3 w-full max-w-md">
                                <video src={value.savedFile} controls preload="metadata" className="w-full rounded-lg bg-black" />
                                <p className="mb-0 mt-1 text-xs text-gray-500">Saved video. Choosing a new file replaces it.</p>
                                <button
                                    type="button"
                                    aria-label="Remove saved video"
                                    onClick={() => update({ removed: true })}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"
                                >
                                    <FiX size={15} aria-hidden="true" />
                                </button>
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div className="max-w-xl">
                    <label htmlFor="property_video_url" className={labelClass}>
                        Video Link
                    </label>
                    <input
                        id="property_video_url"
                        type="url"
                        value={value.url}
                        onChange={(event) => update({ url: event.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        maxLength={1000}
                        className={inputClass}
                    />
                    <p className="mb-0 mt-1 text-xs text-[#62748E]">YouTube, Vimeo or any video link starting with http or https.</p>
                </div>
            )}
        </section>
    );
}
