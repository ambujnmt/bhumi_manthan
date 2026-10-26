"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";

/**
 * Dropdown with search filter (State / City in property form)
 *
 * options = [{ value, label }]
 * value   = selected option value ("" = none)
 * Keyboard: Up / Down to move, Enter to select, Esc to close.
 */
export default function SearchableSelect({
    id,
    name,
    value,
    options = [],
    onChange,
    placeholder = "Select",
    searchPlaceholder = "Search...",
    emptyText = "No results found",
    loading = false,
    disabled = false,
    required = false,
    className = "mt-1.5", // wrapper (e.g. "" in website search bar)
    buttonClassName = "py-2.5",
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const boxRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();

    const selected = options.find((option) => option.value === value);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return options;

        // starting with search first, then containing
        const starts = [];
        const contains = [];

        options.forEach((option) => {
            const label = option.label.toLowerCase();

            if (label.startsWith(q)) starts.push(option);
            else if (label.includes(q)) contains.push(option);
        });

        return [...starts, ...contains];
    }, [options, query]);

    const close = () => {
        setOpen(false);
        setQuery("");
    };

    const select = (option) => {
        onChange(option.value);
        close();
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;

        const handleClick = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
                close();
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // On open: focus search, highlight selected option
    useEffect(() => {
        if (!open) return;

        searchRef.current?.focus();

        const index = options.findIndex((option) => option.value === value);
        setActiveIndex(index >= 0 ? index : 0);
    }, [open]);

    useEffect(() => {
        if (open && query) setActiveIndex(0);
    }, [query]);

    // Keep highlighted option visible
    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[activeIndex]) select(filtered[activeIndex]);
        } else if (event.key === "Escape" || event.key === "Tab") {
            close();
        }
    };

    const buttonText = loading
        ? "Loading..."
        : selected?.label || value || placeholder;

    return (
        <div ref={boxRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                disabled={disabled || loading}
                onClick={() => (open ? close() : setOpen(true))}
                onKeyDown={(event) => {
                    if (!open && ["ArrowDown", "Enter", " "].includes(event.key)) {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 ${buttonClassName} text-left text-sm outline-none transition
                    ${open ? "border-[#E87722] ring-2 ring-orange-100" : "border-gray-300 hover:border-gray-400"}
                    focus-visible:border-[#E87722] focus-visible:ring-2 focus-visible:ring-orange-100
                    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:hover:border-gray-300`}
            >
                <span className={`truncate ${value && !loading ? "text-[#1A1F36]" : "text-gray-400"}`}>
                    {buttonText}
                </span>

                <span className="flex shrink-0 items-center gap-1 text-gray-400">
                    {loading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#E87722]" />
                    )}
                    <FiChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {/* Native "required" check (hidden inputs are not validated) */}
            <input
                tabIndex={-1}
                aria-hidden="true"
                name={name}
                value={value}
                onChange={() => {}}
                required={required}
                onFocus={() => !disabled && setOpen(true)}
                className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
            />

            {open && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                    {/* Search */}
                    <div className="relative border-b border-gray-100 p-2">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={searchPlaceholder}
                            autoComplete="off"
                            role="combobox"
                            aria-expanded="true"
                            aria-controls={listId}
                            aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-8 text-sm text-[#1A1F36] outline-none focus:border-[#E87722] focus:bg-white"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    searchRef.current?.focus();
                                }}
                                aria-label="Clear search"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    <ul ref={listRef} id={listId} role="listbox" className="mb-0 max-h-60 overflow-y-auto py-1 pl-0">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-6 text-center text-sm text-gray-400">{emptyText}</li>
                        ) : (
                            filtered.map((option, index) => {
                                const isSelected = option.value === value;
                                const isActive = index === activeIndex;

                                return (
                                    <li
                                        key={option.value}
                                        id={`${listId}-${index}`}
                                        data-index={index}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => select(option)}
                                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm
                                            ${isActive ? "bg-orange-50 text-[#E87722]" : "text-[#1A1F36]"}
                                            ${isSelected ? "font-semibold" : ""}`}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && <FiCheck className="h-4 w-4 shrink-0 text-[#E87722]" />}
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {options.length > 0 && (
                        <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
                            {filtered.length} of {options.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
