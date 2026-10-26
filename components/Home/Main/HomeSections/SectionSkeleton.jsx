import React from "react";

// Grey placeholder while a home section is loading (keeps page from jumping)
export default function SectionSkeleton({
    cards = 4,
    gridClass = "grid grid-cols-12 gap-4",
    colClass = "col-span-12 md:col-span-6 lg:col-span-3",
    imageHeight = "h-48",
    centerTitle = false,
}) {
    return (
        <section className="container mt-[60px]" aria-busy="true" aria-label="Loading">
            <div className={`mb-6 animate-pulse ${centerTitle ? "flex flex-col items-center" : ""}`}>
                <div className="h-7 w-72 max-w-full rounded bg-gray-200" />
                <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
            </div>

            <div className={gridClass}>
                {Array.from({ length: cards }).map((_, index) => (
                    <div key={index} className={colClass}>
                        <div className="animate-pulse overflow-hidden rounded-lg bg-white shadow-md">
                            <div className={`${imageHeight} w-full bg-gray-200`} />
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-3/4 rounded bg-gray-200" />
                                <div className="h-3 w-1/2 rounded bg-gray-100" />
                                <div className="h-5 w-1/3 rounded bg-gray-200" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
