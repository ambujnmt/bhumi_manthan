"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FaUserShield } from "react-icons/fa";
import { FiMail, FiPhone, FiCalendar, FiClock } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";
import { getUserDetail } from "../../../utils/adminFetchApi";

const formatDate = (date) =>
    date
        ? new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

const formatRole = (role) => (role ? role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "-");

const YesNo = ({ value, yes, no }) => (
    <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            value ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}
    >
        {value ? `✓ ${yes}` : `✕ ${no}`}
    </span>
);

const InfoRow = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#E87722]">
            <Icon size={14} />
        </span>
        <div className="min-w-0">
            <p className="mb-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mb-0 break-all text-sm font-semibold text-gray-800">{children}</p>
        </div>
    </div>
);

/**
 * User detail in a modal (User Management -> View)
 * user = row from the list (shown right away), full detail is fetched by id
 */
export default function DetailModal({ user: rowUser, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!rowUser?.id) return;

        let cancelled = false;

        setDetail(null);
        setLoading(true);

        getUserDetail(rowUser.id)
            .then((res) => {
                if (!cancelled && res?.status && res?.data?.user) setDetail(res.data.user);
            })
            .catch((error) => console.error("Failed to fetch user detail:", error))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [rowUser?.id]);

    const user = { ...rowUser, ...detail };
    const isActive = user.status === "active";

    return (
        <Tmodal isOpen={Boolean(rowUser)} onClose={onClose} title="User Detail" size="lg" noScroll classNames={{ base: "max-w-[762px]" }}>
            {rowUser && (
                <div className="space-y-4 pb-20">
                    {/* Header */}
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#001737] text-lg font-bold uppercase text-white">
                            {(user.name || user.email || "U").trim().charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="mb-0 truncate text-base font-bold text-[#001737]">{user.name || "Unknown User"}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-lg bg-[#001737] px-2 py-0.5 text-xs font-semibold text-white">
                                    {formatRole(user.role)}
                                </span>
                                {user.admin_role && (
                                    <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#E87722]">
                                        <FaUserShield size={11} />
                                        {typeof user.admin_role === "string" ? user.admin_role : user.admin_role?.name}
                                    </span>
                                )}
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    {formatRole(user.status)}
                                </span>
                            </div>
                        </div>
                        {loading && <Spinner size="sm" />}
                    </div>

                    {/* Personal info */}
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-2">
                        <InfoRow icon={FiMail} label="Email">{user.email || "-"}</InfoRow>
                        <InfoRow icon={FiPhone} label="Phone">{user.phone || "-"}</InfoRow>
                        <InfoRow icon={FiCalendar} label="Created On">{formatDate(user.created_at)}</InfoRow>
                        <InfoRow icon={FiClock} label="Last Updated">{formatDate(user.updated_at)}</InfoRow>
                    </div>

                    {/* Account info */}
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-3">
                        <div className="flex items-center justify-between gap-4 py-2.5">
                            <p className="mb-0 text-sm font-semibold text-gray-800">Email Verification</p>
                            <YesNo value={user.is_verified} yes="Verified" no="Not Verified" />
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2.5">
                            <p className="mb-0 text-sm font-semibold text-gray-800">Terms & Conditions</p>
                            <YesNo value={user.terms_accepted} yes="Accepted" no="Not Accepted" />
                        </div>
                    </div>
                </div>
            )}
        </Tmodal>
    );
}
