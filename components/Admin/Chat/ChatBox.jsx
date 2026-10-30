"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { IoSend, IoArrowBack, IoSearch } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import { BsChatDotsFill, BsCheck2, BsCheck2All, BsHouseDoor } from "react-icons/bs";
import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import { showToast } from "../../../store/toast";
import { getChatContacts, startChatConversation } from "../../../utils/chatApi";
import {
    connectFirebaseChat,
    getOlderMessages,
    markFirebaseChatRead,
    sendFirebaseMessage,
    subscribeChats,
    subscribeMessages,
} from "../../../utils/firebaseChat";

const ROLE_LABELS = {
    customer: "Customer",
    admin: "Admin",
    broker: "Broker",
    seller: "Seller",
};

const ROLE_STYLES = {
    customer: "bg-blue-50 text-blue-600",
    admin: "bg-orange-50 text-[#E87722]",
    broker: "bg-violet-50 text-violet-600",
    seller: "bg-emerald-50 text-emerald-600",
};

const AVATAR_COLORS = [
    "bg-orange-100 text-[#E87722]",
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-violet-100 text-violet-600",
    "bg-rose-100 text-rose-600",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
];

// Same name -> same color
const avatarColor = (name = "") =>
    AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];

const initials = (name) =>
    (name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("");

// Same sender within 5 min -> one group (tight spacing)
const GROUP_GAP_MS = 5 * 60 * 1000;

const isSameDay = (a, b) => a && b && new Date(a).toDateString() === new Date(b).toDateString();

const clockTime = (value) =>
    value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

// Inbox time: today -> 11:45 am, yesterday -> Yesterday, else -> 28 Oct
const formatTime = (value) => {
    if (!value) return "";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(value, new Date())) return clockTime(value);
    if (isSameDay(value, yesterday)) return "Yesterday";

    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Day separator in messages
const dayLabel = (value) => {
    if (!value) return "";

    const date = new Date(value);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });
};

const sameMessage = (a, b) =>
    a && a.message === b.message && a.sender_id === b.sender_id && a.created_at === b.created_at;

// Add / replace messages by id, keep old -> new order (same list back when nothing changed -> no re-render)
const mergeMessages = (previous, incoming) => {
    const byId = new Map(previous.map((message) => [message.id, message]));

    if (incoming.every((message) => sameMessage(byId.get(message.id), message))) return previous;

    incoming.forEach((message) => byId.set(message.id, { ...byId.get(message.id), ...message }));

    return [...byId.values()].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
};

const Avatar = ({ name, size = "h-11 w-11 text-sm" }) => (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full font-bold uppercase ${avatarColor(name)}`}>
        {initials(name)}
    </span>
);

const RoleBadge = ({ role }) =>
    role ? (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_STYLES[role] || "bg-gray-100 text-gray-600"}`}>
            {ROLE_LABELS[role] || role}
        </span>
    ) : null;

// Customer roles to pick in "New Chat" (customer side only)
const CONTACT_ROLES = [
    ["", "All"],
    ["admin", "Admin"],
    ["broker", "Broker"],
    ["seller", "Seller"],
];

// Light dotted background behind messages
const MESSAGES_BG = {
    backgroundColor: "#f6f7fb",
    backgroundImage: "radial-gradient(#e3e6ee 1px, transparent 1px)",
    backgroundSize: "18px 18px",
};

/**
 * Admin panel: <ChatBox />  (admin / staff / broker / seller -> customers) - fills its parent's height
 * Website profile: <ChatBox embedded isCustomer />  (customer -> admin / broker / seller)
 *
 * Inbox + messages are read / written directly on Firestore (utils/firebaseChat.js)
 */
export default function ChatBox({ embedded = false, isCustomer = false }) {
    const [conversations, setConversations] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [olderLoading, setOlderLoading] = useState(false);

    const [text, setText] = useState("");

    const [live, setLive] = useState(null); // Firebase connection { db, uid, myId, fs }
    const [connectError, setConnectError] = useState("");
    const myId = live?.myId ?? null;

    // New chat modal
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [contactRole, setContactRole] = useState("");
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [startingId, setStartingId] = useState(null);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const scrollRef = useRef(null);
    const activeIdRef = useRef(null);
    activeIdRef.current = activeId;
    const oldestRef = useRef(null); // oldest loaded message snapshot (for "Load older")
    const olderLoadedRef = useRef(false);

    const active = conversations.find((item) => item.id === activeId) || null;

    const scrollToBottom = (smooth = false) =>
        // scroll only the messages box (scrollIntoView would also scroll the whole page)
        requestAnimationFrame(() => {
            const container = scrollRef.current;
            if (container) container.scrollTo({ top: container.scrollHeight, behavior: smooth ? "smooth" : "auto" });
        });

    // Firebase login
    useEffect(() => {
        let cancelled = false;

        connectFirebaseChat()
            .then((connection) => {
                if (!cancelled) setLive(connection);
            })
            .catch((error) => {
                console.error("Firebase chat connect failed:", error);

                if (!cancelled) {
                    setConnectError(error?.message || "Chat could not be connected.");
                    setListLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    /*
    | Conversations (inbox) live
    */
    useEffect(() => {
        if (!live) return;

        return subscribeChats(
            live,
            (list) => {
                setConversations((previous) => (JSON.stringify(previous) === JSON.stringify(list) ? previous : list));
                setListLoading(false);
            },
            (error) => {
                console.error("Chat list failed:", error);
                setListLoading(false);
                showToast("Failed to load chats.", "error");
            }
        );
    }, [live]);

    /*
    | Messages of open chat (newest page live)
    */
    const openConversation = (id) => {
        if (id === activeIdRef.current) return;

        setActiveId(id);
        setMessages([]);
        setHasMore(false);
        setText("");
        setMessagesLoading(true);
        oldestRef.current = null;
        olderLoadedRef.current = false;
        lastMessageIdRef.current = null;
    };

    useEffect(() => {
        if (!live || !activeId) return;

        let first = true;

        return subscribeMessages(
            live,
            activeId,
            (list, oldest, more) => {
                if (activeIdRef.current !== activeId) return;

                setMessages((previous) => mergeMessages(previous, list));

                // older pages already loaded -> they decide oldest / hasMore
                if (!olderLoadedRef.current) {
                    oldestRef.current = oldest;
                    setHasMore(more);
                }

                if (first) setMessagesLoading(false);
                first = false;
            },
            (error) => {
                console.error("Chat messages failed:", error);
                setMessagesLoading(false);
                showToast("Failed to load messages.", "error");
            }
        );
    }, [live, activeId]);

    // Scroll only when a new message is added at the bottom (not on older pages / server ack)
    const lastMessageId = messages[messages.length - 1]?.id || null;

    useEffect(() => {
        if (!lastMessageId || lastMessageId === lastMessageIdRef.current) return;

        scrollToBottom(lastMessageIdRef.current !== null);
        lastMessageIdRef.current = lastMessageId;
    }, [lastMessageId]);

    // Open chat has unread -> mark read (on open and when new messages come)
    const activeUnread = active?.unread || 0;

    useEffect(() => {
        if (!live || !activeId || !activeUnread) return;

        markFirebaseChatRead(live, activeId).catch(() => {
            // ignore
        });
    }, [live, activeId, activeUnread]);

    // Message box grows with text (max ~5 lines)
    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!input) return;

        input.style.height = "auto";
        input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
    }, [text, activeId]);

    const loadOlder = async () => {
        if (!live || !activeId || !oldestRef.current) return;

        const id = activeId;
        const container = scrollRef.current;
        const previousHeight = container?.scrollHeight || 0;

        setOlderLoading(true);

        try {
            const res = await getOlderMessages(live, id, oldestRef.current);

            if (activeIdRef.current !== id) return;

            olderLoadedRef.current = true;
            oldestRef.current = res.oldest;
            setMessages((previous) => mergeMessages(previous, res.messages));
            setHasMore(res.hasMore);

            // keep scroll position after adding older messages on top
            requestAnimationFrame(() => {
                if (container) container.scrollTop = container.scrollHeight - previousHeight;
            });
        } catch (error) {
            showToast(error?.message || "Failed to load older messages.", "error");
        } finally {
            setOlderLoading(false);
        }
    };

    /*
    | Send (straight to Firestore)
    */
    const handleSend = async (event) => {
        event?.preventDefault();

        const message = text.trim();
        if (!message || !active || !live) return;

        // Firestore shows the message instantly (local write) -> clear box now, no spinner
        setText("");
        inputRef.current?.focus({ preventScroll: true });

        try {
            await sendFirebaseMessage(live, active, message);
        } catch (error) {
            console.error("Chat send failed:", error);
            showToast("Message could not be sent.", "error");
            setText((current) => current || message);
        }
    };

    const handleKeyDown = (event) => {
        // Enter = send, Shift + Enter = new line
        if (event.key === "Enter" && !event.shiftKey) handleSend(event);
    };

    /*
    | New chat (pick a customer)
    */
    useEffect(() => {
        if (!newChatOpen) return;

        const timer = setTimeout(async () => {
            setContactsLoading(true);

            try {
                const res = await getChatContacts(contactSearch.trim(), 20, contactRole);
                setContacts(res?.data?.contacts || []);
            } catch (error) {
                showToast(error?.message || "Failed to load customers.", "error");
                setContacts([]);
            } finally {
                setContactsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [newChatOpen, contactSearch, contactRole]);

    const startChat = async (contact) => {
        setStartingId(contact.id);

        try {
            // Laravel creates chats/{id} in Firestore (who can chat with whom)
            const res = await startChatConversation({ user_id: contact.id });
            const conversation = res?.data;

            if (conversation?.id) {
                setConversations((previous) =>
                    previous.some((item) => item.id === conversation.id)
                        ? previous
                        : [{ ...conversation, other_uid: conversation.other_user?.uid }, ...previous]
                );
                setNewChatOpen(false);
                setContactSearch("");
                openConversation(conversation.id);
            }
        } catch (error) {
            showToast(error?.message || "Chat could not be started.", "error");
        } finally {
            setStartingId(null);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleConversations = conversations.filter((item) =>
        !term || [item.other_user?.name, item.property?.title, item.last_message]
            .some((value) => String(value || "").toLowerCase().includes(term))
    );

    // open chat is marked read right away -> don't flash its badge
    const unreadOf = (item) => (item.id === activeId ? 0 : item.unread || 0);
    const totalUnread = conversations.reduce((sum, item) => sum + unreadOf(item), 0);

    // My last N messages not opened by the other person yet -> single tick, older -> double tick
    const otherUnread = active?.other_unread || 0;
    const unseenIds = new Set(
        otherUnread
            ? messages
                .filter((message) => (myId ? message.sender_id === myId : message.is_mine))
                .slice(-otherUnread)
                .map((message) => message.id)
            : []
    );

    return (
        <div className={embedded ? "" : "flex h-full min-h-0 flex-col"}>
            {/* {!embedded && (
                <PageTitle
                    breadCrumbItems={[
                        { label: "Dashboard", path: "/admin/dashboard" },
                        { label: "Chat", active: true },
                    ]}
                    title="Chat"
                />
            )} */}

            <div
                className={`${
                    embedded ? "h-[70vh] min-h-[480px] border border-gray-100" : "mt-2 min-h-0 flex-1"
                } flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5`}
            >
                {/* Conversations */}
                <aside className={`${activeId ? "hidden md:flex" : "flex"} w-full min-h-0 flex-col border-r border-gray-100 md:w-80 md:shrink-0 lg:w-[340px]`}>
                    <div className="px-4 pb-3 pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-[#001737]">Messages</h3>
                                {totalUnread > 0 && (
                                    <span className="rounded-full bg-[#E87722] px-2 py-0.5 text-[11px] font-bold text-white">
                                        {totalUnread > 99 ? "99+" : totalUnread}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewChatOpen(true)}
                                title="New chat"
                                className="flex items-center gap-1.5 rounded-full bg-[#E87722] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#d4691a]"
                            >
                                <FaPlus size={10} /> New Chat
                            </button>
                        </div>
                        <div className="relative">
                            <IoSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, property, message..."
                                className="h-10 w-full rounded-full border border-transparent bg-gray-100 pl-9 pr-4 text-sm outline-none transition focus:border-[#E87722] focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                        {listLoading ? (
                            <div className="flex justify-center py-16">
                                <Spinner size="md" />
                            </div>
                        ) : visibleConversations.length ? (
                            visibleConversations.map((item) => {
                                const isActive = item.id === activeId;
                                const lastIsMine = myId && item.last_sender_id === myId;
                                const unread = unreadOf(item);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => openConversation(item.id)}
                                        className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                            isActive ? "bg-orange-50 ring-1 ring-orange-100" : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <Avatar name={item.other_user?.name} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`truncate text-sm text-[#1A1F36] ${unread ? "font-bold" : "font-semibold"}`}>
                                                    {item.other_user?.name || "Deleted user"}
                                                </span>
                                                <span className={`shrink-0 text-[11px] ${unread ? "font-semibold text-[#E87722]" : "text-gray-400"}`}>
                                                    {formatTime(item.last_message_at || item.created_at)}
                                                </span>
                                            </div>
                                            {item.property && (
                                                <p className="flex items-center gap-1 truncate text-[11px] font-medium text-[#E87722]">
                                                    <BsHouseDoor size={11} className="shrink-0" />
                                                    <span className="truncate">{item.property.title}</span>
                                                </p>
                                            )}
                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                <p className={`truncate text-xs ${unread ? "font-semibold text-[#1A1F36]" : "text-gray-500"}`}>
                                                    {item.last_message ? (
                                                        <>
                                                            {lastIsMine && <span className="text-gray-400">You: </span>}
                                                            {item.last_message}
                                                        </>
                                                    ) : (
                                                        <span className="italic text-gray-400">No messages yet</span>
                                                    )}
                                                </p>
                                                {unread > 0 && (
                                                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#E87722] px-1.5 text-[10px] font-bold text-white">
                                                        {unread > 99 ? "99+" : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center px-6 py-16 text-center">
                                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[#E87722]">
                                    <BsChatDotsFill size={24} />
                                </span>
                                <p className="text-sm text-gray-500">
                                    {connectError
                                        ? connectError
                                        : term
                                        ? "No chats found."
                                        : isCustomer
                                            ? "No chats yet. Click New Chat to talk with admin, broker or seller."
                                            : "No chats yet. Customers' messages will show here."}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Messages */}
                <section className={`${activeId ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
                    {!active ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center" style={MESSAGES_BG}>
                            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#E87722] shadow-sm ring-8 ring-orange-50">
                                <BsChatDotsFill size={34} />
                            </span>
                            <h4 className="text-base font-bold text-[#001737]">Your messages</h4>
                            <p className="mt-1 max-w-xs text-sm text-gray-500">
                                Select a chat from the list, or start a new conversation.
                            </p>
                            <button
                                type="button"
                                onClick={() => setNewChatOpen(true)}
                                className="mt-4 flex items-center gap-1.5 rounded-full bg-[#E87722] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#d4691a]"
                            >
                                <FaPlus size={11} /> New Chat
                            </button>
                        </div>
                    ) : (
                        <>
                            <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveId(null)}
                                    className="-ml-1 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
                                    aria-label="Back"
                                >
                                    <IoArrowBack size={20} />
                                </button>
                                <Avatar name={active.other_user?.name} size="h-10 w-10 text-sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-bold text-[#001737]">{active.other_user?.name || "Deleted user"}</span>
                                        <RoleBadge role={active.other_user?.role} />
                                    </div>
                                    {active.property ? (
                                        <p className="flex items-center gap-1 truncate text-xs text-[#E87722]">
                                            <BsHouseDoor size={12} className="shrink-0" />
                                            <span className="truncate">{active.property.title}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400">Direct message</p>
                                    )}
                                </div>
                            </header>

                            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6" style={MESSAGES_BG}>
                                {messagesLoading ? (
                                    <div className="flex justify-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                ) : (
                                    <>
                                        {hasMore && (
                                            <div className="mb-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={loadOlder}
                                                    disabled={olderLoading}
                                                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm ring-1 ring-black/5 hover:text-[#E87722]"
                                                >
                                                    {olderLoading ? "Loading..." : "Load older messages"}
                                                </button>
                                            </div>
                                        )}

                                        {!messages.length && (
                                            <div className="flex flex-col items-center py-16 text-center">
                                                <span className="mb-2 text-3xl">👋</span>
                                                <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                                            </div>
                                        )}

                                        {messages.map((message, index) => {
                                            const previous = messages[index - 1];
                                            const next = messages[index + 1];
                                            const mine = myId ? message.sender_id === myId : message.is_mine;

                                            const newDay = !previous || !isSameDay(previous.created_at, message.created_at);
                                            const joinsPrevious = !newDay && previous.sender_id === message.sender_id
                                                && new Date(message.created_at) - new Date(previous.created_at) < GROUP_GAP_MS;
                                            const joinsNext = next && next.sender_id === message.sender_id
                                                && isSameDay(next.created_at, message.created_at)
                                                && new Date(next.created_at) - new Date(message.created_at) < GROUP_GAP_MS;

                                            return (
                                                <React.Fragment key={message.id}>
                                                    {newDay && (
                                                        <div className="my-3 flex justify-center">
                                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-500 shadow-sm ring-1 ring-black/5">
                                                                {dayLabel(message.created_at)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className={`flex ${mine ? "justify-end" : "justify-start"} ${joinsPrevious ? "mt-0.5" : "mt-2.5"}`}>
                                                        <div
                                                            className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-sm shadow-sm sm:max-w-[65%] ${
                                                                mine
                                                                    ? `bg-[#E87722] text-white ${joinsNext ? "" : "rounded-br-md"}`
                                                                    : `bg-white text-[#1A1F36] ring-1 ring-black/5 ${joinsNext ? "" : "rounded-bl-md"}`
                                                            }`}
                                                        >
                                                            <p className="whitespace-pre-wrap break-words leading-snug">
                                                                {message.message}
                                                                <span
                                                                    className={`relative top-1 ml-2 inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] leading-none ${
                                                                        mine ? "text-orange-100" : "text-gray-400"
                                                                    } float-right`}
                                                                >
                                                                    {clockTime(message.created_at)}
                                                                    {mine && (unseenIds.has(message.id)
                                                                        ? <BsCheck2 size={13} />
                                                                        : <BsCheck2All size={13} className="text-white" />)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        <div ref={bottomRef} />
                                    </>
                                )}
                            </div>

                            <form onSubmit={handleSend} className="border-t border-gray-100 bg-white px-3 py-2.5 sm:px-4">
                                <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-1 pl-4 pr-1 transition focus-within:border-[#E87722] focus-within:bg-white">
                                    <textarea
                                        ref={inputRef}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        maxLength={5000}
                                        placeholder="Type a message..."
                                        className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm leading-5 outline-none placeholder:text-gray-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!text.trim()}
                                        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E87722] text-white transition hover:bg-[#d4691a] disabled:bg-gray-300"
                                        aria-label="Send"
                                    >
                                        <IoSend size={15} />
                                    </button>
                                </div>
                                <p className="mt-1 hidden pl-4 text-[10px] text-gray-400 sm:block">Enter to send · Shift + Enter for new line</p>
                            </form>
                        </>
                    )}
                </section>
            </div>

            {/* New Chat Modal */}
            <Tmodal isOpen={newChatOpen} onClose={() => setNewChatOpen(false)} title="New Chat" size="md">
                <div className="relative mb-3">
                    <IoSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        autoFocus
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder={isCustomer ? "Search by name..." : "Search customer by name, phone, email..."}
                        className="h-10 w-full rounded-full border border-transparent bg-gray-100 pl-9 pr-4 text-sm outline-none transition focus:border-[#E87722] focus:bg-white"
                    />
                </div>

                {isCustomer && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {CONTACT_ROLES.map(([key, label]) => (
                            <button
                                key={key || "all"}
                                type="button"
                                onClick={() => setContactRole(key)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                    contactRole === key
                                        ? "bg-[#E87722] text-white"
                                        : "bg-gray-100 text-gray-600 hover:text-[#E87722]"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="max-h-[50vh] overflow-y-auto">
                    {contactsLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    ) : contacts.length ? (
                        contacts.map((contact) => (
                            <button
                                key={contact.id}
                                type="button"
                                disabled={startingId !== null}
                                onClick={() => startChat(contact)}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-orange-50"
                            >
                                <Avatar name={contact.name} size="h-10 w-10 text-sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-[#1A1F36]">{contact.name}</span>
                                        {isCustomer && <RoleBadge role={contact.role} />}
                                    </div>
                                    {contact.email && (
                                        <span className="truncate text-xs text-gray-500" title={contact.email}>{contact.email}</span>
                                    )}
                                </div>
                                {startingId === contact.id && <Spinner size="sm" />}
                            </button>
                        ))
                    ) : (
                        <p className="py-8 text-center text-sm text-gray-500">{isCustomer ? "No one found." : "No customers found."}</p>
                    )}
                </div>
            </Tmodal>
        </div>
    );
}
