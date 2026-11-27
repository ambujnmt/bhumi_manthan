import { useEffect, useState } from "react";

/**
 * Recommended upload size of each property image (how it shows on the website):
 * main  : detail page slider (~800 x 350, cropped to fill) + listing cards (~300 x 190)
 * gallery: detail page slider + 4:3 thumbnails
 * floor : floor plan (admin view) - keep text readable
 * agent : round avatar on the property page (64 x 64)
 */
export const PROPERTY_IMAGE_SIZES = {
    main: {
        width: 1600,
        height: 900,
        ratio: "16:9",
        note: "Landscape photo. Keep the main subject in the centre: the edges can be cropped on cards and the slider.",
    },
    gallery: {
        width: 1600,
        height: 900,
        ratio: "16:9",
        note: "Landscape photo, same as the main image, so the slider looks even.",
    },
    floor: {
        width: 1200,
        height: 900,
        ratio: "4:3",
        note: "Clear floor plan with readable text and room labels.",
    },
    agent: {
        width: 400,
        height: 400,
        ratio: "1:1",
        note: "Square photo with the face in the centre (shown in a circle).",
    },
    // Admin -> Banner: home slider (ratio 1922 / 818, full screen height on desktop)
    banner_home: {
        width: 1920,
        height: 818,
        ratio: "about 2.35:1",
        note: "Home page slider. Phones show the whole picture; big screens fill the screen height, so the left / right edges can be cropped - keep text and key parts in the centre.",
    },
    // Admin -> Banner: Events / Plans page hero background (page heading written on top)
    banner_page: {
        width: 1920,
        height: 818,
        ratio: "about 2.35:1",
        note: "Background behind the page heading (text is written on top). Top and bottom can be cropped; a calm, slightly dark picture keeps the heading readable.",
    },
    // Admin -> Events: event page image (full width x 420), event cards (~350 x 190), list highlight
    event: {
        width: 1600,
        height: 900,
        ratio: "16:9",
        note: "Landscape banner. Keep text and faces in the centre: edges can be cropped on cards and the event page.",
    },
    // Admin -> Projects: project page hero (~900 x 480, name + location written on the bottom) + project cards
    project: {
        width: 1600,
        height: 900,
        ratio: "16:9",
        note: "Landscape photo. Keep the building in the centre / top: the project name is written over the bottom part, and edges can be cropped.",
    },
};

// Picture shape this far off the recommended one -> warning
const RATIO_TOLERANCE = 0.2;

/**
 * Checks a picture size against a recommended size.
 * -> { offShape, tooSmall, ok } (all false while the size is not known)
 */
export const checkImageSize = (size, actual) => {
    if (!size || !actual) return { offShape: false, tooSmall: false, ok: false };

    const expected = size.width / size.height;
    const offShape = Math.abs(actual.width / actual.height - expected) / expected > RATIO_TOLERANCE;
    const tooSmall = !offShape && actual.width < size.width * 0.6;

    return { offShape, tooSmall, ok: !offShape && !tooSmall };
};

/**
 * Recommended width x height for an image field + the size of the chosen picture
 * (warning when its shape is very different or it is too small).
 *
 * size: PROPERTY_IMAGE_SIZES.main | gallery | floor | agent
 * file: chosen File (optional)
 */
export default function ImageSizeNote({ size, file = null }) {
    const [actual, setActual] = useState(null);

    useEffect(() => {
        setActual(null);
        if (!(file instanceof Blob)) return undefined;

        let active = true;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => active && setActual({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;

        return () => {
            active = false;
            URL.revokeObjectURL(url);
        };
    }, [file]);

    if (!size) return null;

    const { offShape, tooSmall } = checkImageSize(size, actual);

    return (
        <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#62748E]">
            <p className="mb-0">
                <span className="font-semibold text-[#E87722]">
                    Recommended: {size.width} × {size.height} px
                </span>{" "}
                (width × height, {size.ratio}). {size.note}
            </p>

            {actual && (
                <p className={`mb-0 mt-1 font-medium ${offShape || tooSmall ? "text-red-600" : "text-green-700"}`}>
                    Selected image: {actual.width} × {actual.height} px
                    {offShape
                        ? ` - different shape, it may look cropped. Use about ${size.width} × ${size.height} px.`
                        : tooSmall
                          ? " - small, it may look blurry."
                          : " - looks good."}
                </p>
            )}
        </div>
    );
}
