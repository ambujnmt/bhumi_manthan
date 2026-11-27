"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FiBell } from "react-icons/fi";
import {
    getMyNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../../../../utils/adminFetchApi";

// Dot colour by property approval status
const STATUS_DOT = {
    approved: "bg-green-500",
    rejected: "bg-red-500",
    changes_requested: "bg-blue-500",
    pending: "bg-amber-500",
};

const timeAgo = (value) => {
    if (!value) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Panel header bell: property approved / rejected / changes requested (seller / broker)
export default function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const boxRef = useRef(null);

    const load = useCallback(async () => {
        try {
            const res = await getMyNotifications(20);

            setItems(Array.isArray(res?.data?.notifications) ? res.data.notifications : []);
            setUnread(Number(res?.data?.unread_count) || 0);
        } catch (error) {
            // Bell is optional: keep the header working if this fails
        }
    }, []);

    // On load + every 60 s
    useEffect(() => {
        load();

        const timer = setInterval(load, 60000);

        return () => clearInterval(timer);
    }, [load]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;

        const handle = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
        };

        document.addEventListener("mousedown", handle);

        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const openItem = async (item) => {
        setOpen(false);

        if (!item.read_at) {
            setItems((list) => list.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
            setUnread((count) => Math.max(0, count - 1));
            markNotificationRead(item.id).catch(() => {});
        }

        if (item.url) router.push(item.url);
    };

    const readAll = async () => {
        setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setUnread(0);
        markAllNotificationsRead().catch(() => {});
    };

    return (
        <div className="relative" ref={boxRef}>
            <button
                type="button"
                onClick={() => {
                    setOpen((value) => !value);
                    if (!open) load();
                }}
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#001737] transition hover:bg-orange-50 hover:text-[#E87722]"
            >
                <FiBell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E87722] px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[90vw] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                        <p className="mb-0 text-sm font-semibold text-[#1A1F36]">Notifications</p>
                        {unread > 0 && (
                            <button type="button" onClick={readAll} className="text-xs font-semibold text-[#E87722] hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="mb-0 px-4 py-8 text-center text-sm text-[#62748E]">No notifications yet</p>
                        ) : (
                            items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openItem(item)}
                                    className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-orange-50 ${item.read_at ? "" : "bg-orange-50/40"}`}
                                >
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] || "bg-gray-400"}`} />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-[13px] text-[#1A1F36] ${item.read_at ? "font-medium" : "font-semibold"}`}>
                                            {item.title}
                                        </span>
                                        <span className="mt-0.5 block text-[12px] text-[#62748E]">{item.message}</span>
                                        {item.note && (
                                            <span className="mt-1 block rounded bg-gray-50 px-2 py-1 text-[12px] text-[#1A1F36]">
                                                Note: {item.note}
                                            </span>
                                        )}
                                        <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(item.created_at)}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
