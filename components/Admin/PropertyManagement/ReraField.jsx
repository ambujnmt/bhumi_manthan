"use client";

import React, { useState } from "react";

/*
 * RERA registration number.
 * Every state has its own format, so the check is the common shape all of them share:
 * capital letters + numbers, parts joined by / - . or a space.
 *   Maharashtra    P51800012345
 *   Uttar Pradesh  UPRERAPRJ12345
 *   Haryana        RC/REP/HARERA/GGM/2019/45
 *   Karnataka      PRM/KA/RERA/1251/309/PR/171014/000123
 * Same rule on the backend (ManagesProperties).
 */

export const RERA_MIN = 5;
export const RERA_MAX = 60;

// Example shown under the box for the selected state
const STATE_EXAMPLES = {
    maharashtra: "P51800012345",
    "uttar pradesh": "UPRERAPRJ12345",
    haryana: "RC/REP/HARERA/GGM/2019/45",
    karnataka: "PRM/KA/RERA/1251/309/PR/171014/000123",
    delhi: "DLRERA2019P0012",
    telangana: "P02400001234",
    gujarat: "PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA01234/010119",
};

const DEFAULT_EXAMPLE = "UPRERAPRJ12345 or RC/REP/HARERA/GGM/2019/45";

export const reraExample = (state) => STATE_EXAMPLES[String(state || "").trim().toLowerCase()] || DEFAULT_EXAMPLE;

/**
 * While typing: CAPITALS, only A-Z 0-9 / - . and single spaces, max length
 */
export const formatRera = (value) =>
    String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9/\-. ]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, RERA_MAX);

/**
 * "" when empty (optional field) or valid, else the error message
 */
export const validateRera = (value) => {
    const rera = String(value || "").trim();

    if (!rera) return "";

    if (rera.length < RERA_MIN) return `RERA number is too short (at least ${RERA_MIN} characters).`;
    if (rera.length > RERA_MAX) return `RERA number can be at most ${RERA_MAX} characters.`;
    if (!/^[A-Z0-9]+(?:[/\-. ][A-Z0-9]+)*$/.test(rera)) {
        return "Use capital letters and numbers, with / - . or a space only between parts.";
    }
    if (!/[A-Z]/.test(rera) || !/\d/.test(rera)) return "RERA number must have both letters and numbers.";

    return "";
};

/**
 * RERA input with live formatting, state-wise example and inline error.
 * value / onChange(value): plain string. showError: true after a submit attempt.
 */
export default function ReraField({ value, onChange, state, inputClass, labelClass, showError = false, serverError = "" }) {
    const [touched, setTouched] = useState(false);

    const rera = String(value || "");
    const error = serverError || ((touched || showError) ? validateRera(rera) : "");
    const valid = rera.trim() !== "" && !validateRera(rera);

    return (
        <div>
            <label htmlFor="rera_number" className={labelClass}>
                RERA Number
                <span className="ml-1 text-xs font-normal text-[#62748E]">(optional)</span>
            </label>

            <div className="relative">
                <input
                    id="rera_number"
                    name="rera_number"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={RERA_MAX}
                    value={rera}
                    onChange={(e) => onChange(formatRera(e.target.value))}
                    onBlur={() => {
                        setTouched(true);
                        // Drop a trailing separator / space left while typing
                        const trimmed = rera.trim().replace(/[/\-. ]+$/, "");
                        if (trimmed !== rera) onChange(trimmed);
                    }}
                    placeholder={`e.g. ${reraExample(state).split(" or ")[0]}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby="rera_number_help"
                    className={`${
                        // Bootstrap's ".border { border-color: #dee2e6 !important }" beats every Tailwind
                        // border colour, so use border-[1px] (not ".border") and swap the colour itself
                        (error
                            ? inputClass.replace("border-gray-300", "border-red-500").replace("focus:border-[#E87722]", "focus:border-red-500").replace("focus:ring-orange-100", "focus:ring-red-100")
                            : valid
                                ? inputClass.replace("border-gray-300", "border-green-500")
                                : inputClass
                        ).replace(/(^|\s)border(\s|$)/, "$1border-[1px]$2")
                    } pr-9 font-mono uppercase tracking-wide`}
                />

                {valid && !error && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600" aria-hidden="true">
                        ✓
                    </span>
                )}
            </div>

            <p id="rera_number_help" className={`mb-0 mt-1 text-xs ${error ? "text-red-600" : "text-[#62748E]"}`}>
                {error || `As on the RERA certificate, e.g. ${reraExample(state)}`}
            </p>
        </div>
    );
}
