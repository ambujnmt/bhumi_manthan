import React from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Quill uses window -> load only in browser
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const defaultModules = {
    toolbar: [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
    ],
};

const hasHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value || "");

const escapeHtml = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Old plain-text value -> paragraphs, so line breaks are kept
export const toEditorHtml = (value) => {
    if (!value) return "";
    if (hasHtml(value)) return value;

    return value
        .split(/\n{2,}/)
        .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
        .join("");
};

// Show saved description (HTML from editor or old plain text)
export function RichTextContent({ value, className = "", emptyText = "-" }) {
    if (!value || !String(value).replace(/<[^>]*>/g, "").trim()) {
        return <p className={className}>{emptyText}</p>;
    }

    return (
        <div className="ql-snow">
            <div
                className={`ql-editor !p-0 ${className}`}
                dangerouslySetInnerHTML={{ __html: toEditorHtml(value) }}
            />
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Write here...",
    minHeight = 200,
    modules = defaultModules,
}) {
    return (
        <div
            className="[&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg [&_.ql-container]:text-sm"
            style={{ "--editor-min-height": `${minHeight}px` }}
        >
            <ReactQuill
                theme="snow"
                value={toEditorHtml(value)}
                onChange={(html) => {
                    // Empty editor gives "<p><br></p>" -> save as empty
                    const text = html.replace(/<[^>]*>/g, "").trim();
                    onChange(text ? html : "");
                }}
                modules={modules}
                placeholder={placeholder}
                className="[&_.ql-editor]:min-h-[var(--editor-min-height)]"
            />
        </div>
    );
}
