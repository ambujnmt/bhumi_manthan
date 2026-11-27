"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import Tmodal from "../../Tmodal/Tmodal";
import { showToast } from "../../../store/toast";
import { banUser, blockUser, restoreUser, unbanUser, unblockUser } from "../../../utils/adminFetchApi";

// Seller / broker account moderation: block, unblock, ban, unban, restore (deleted)
const ACTIONS = {
    block: {
        title: "Block Account",
        button: "Block",
        busy: "Blocking...",
        buttonClass: "bg-amber-600 hover:bg-amber-700",
        needsReason: true,
        text: "They will be logged out and cannot log in. Their properties are hidden from the website until the block ends or you unblock them.",
    },
    unblock: {
        title: "Unblock Account",
        button: "Unblock",
        busy: "Unblocking...",
        buttonClass: "bg-green-600 hover:bg-green-700",
        text: "They can log in again and their hidden properties go back on the website.",
    },
    ban: {
        title: "Ban Account Permanently",
        button: "Ban",
        busy: "Banning...",
        buttonClass: "bg-red-600 hover:bg-red-700",
        needsReason: true,
        text: "Permanent: they are logged out, cannot log in again, and all their properties are hidden from the website. Only an admin can unban.",
    },
    unban: {
        title: "Unban Account",
        button: "Unban",
        busy: "Unbanning...",
        buttonClass: "bg-green-600 hover:bg-green-700",
        text: "They can log in again and their hidden properties go back on the website.",
    },
    restore: {
        title: "Restore Deleted Account",
        button: "Restore",
        busy: "Restoring...",
        buttonClass: "bg-green-600 hover:bg-green-700",
        text: "The account becomes active again and its hidden properties go back on the website (unless it is blocked or banned).",
    },
};

// Block length presets (empty = until unblocked)
const BLOCK_PRESETS = [
    { value: "", label: "Until I unblock" },
    { value: "1", label: "1 day" },
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "custom", label: "Custom date & time" },
];

// "YYYY-MM-DDTHH:mm" in the browser's local time (India for admins)
const toLocalInput = (date) => {
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ModerationModal({ action, user, onClose, onDone }) {
    const [reason, setReason] = useState("");
    const [preset, setPreset] = useState("");
    const [customUntil, setCustomUntil] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setReason("");
        setPreset("");
        setCustomUntil("");
        setError("");
    }, [action, user?.id]);

    const config = action ? ACTIONS[action] : null;

    const close = () => {
        if (!saving) onClose();
    };

    const confirm = async () => {
        if (!config || !user) return;

        const text = reason.trim();

        if (config.needsReason && !text) {
            setError("Please write the reason.");
            return;
        }

        let until = "";

        if (action === "block" && preset === "custom") {
            if (!customUntil) {
                setError("Please pick the block end date & time.");
                return;
            }

            until = customUntil;
        } else if (action === "block" && preset) {
            until = toLocalInput(new Date(Date.now() + Number(preset) * 86400000));
        }

        setSaving(true);
        setError("");

        try {
            const res =
                action === "block" ? await blockUser(user.id, text, until)
                    : action === "unblock" ? await unblockUser(user.id)
                        : action === "ban" ? await banUser(user.id, text)
                            : action === "unban" ? await unbanUser(user.id)
                                : await restoreUser(user.id);

            showToast(res?.message || "Account updated.");
            onDone(res?.data?.user, action);
        } catch (err) {
            setError(err?.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Tmodal
            isOpen={Boolean(config && user)}
            onClose={close}
            title={config?.title}
            footer={
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={close}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={saving}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white ${config?.buttonClass || ""}`}
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" color="white" />
                                {config?.busy}
                            </>
                        ) : (
                            config?.button
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-0 text-sm font-semibold capitalize text-[#1A1F36]">
                        {user?.name || "-"} <span className="font-normal text-[#62748E]">({user?.role})</span>
                    </p>
                    <p className="mb-0 text-xs text-[#62748E]">{user?.email}</p>
                </div>

                <p className="mb-0 text-sm text-[#62748E]">{config?.text}</p>

                {action === "block" && (
                    <div>
                        <label htmlFor="block_preset" className="mb-1 block text-sm font-medium text-[#1A1F36]">Block for</label>
                        <select
                            id="block_preset"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                        >
                            {BLOCK_PRESETS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>

                        {preset === "custom" && (
                            <input
                                type="datetime-local"
                                value={customUntil}
                                min={toLocalInput(new Date())}
                                onChange={(e) => setCustomUntil(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                            />
                        )}
                    </div>
                )}

                {config?.needsReason && (
                    <div>
                        <label htmlFor="moderation_reason" className="mb-1 block text-sm font-medium text-[#1A1F36]">
                            Reason<span className="text-red-500"> *</span>
                        </label>
                        <textarea
                            id="moderation_reason"
                            rows={3}
                            maxLength={1000}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Fake listings reported by buyers"
                            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                        />
                    </div>
                )}

                {error && (
                    <p className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}
            </div>
        </Tmodal>
    );
}
