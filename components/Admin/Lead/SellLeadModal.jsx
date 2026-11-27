"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiCheck, FiSearch } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";
import { showToast } from "../../../store/toast";
import { sellLead } from "../../../utils/adminFetchApi";

const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#1A1F36]";

/**
 * Sell a lead to a seller / broker.
 * options = { prices, payment_methods, buyers } from getLeadSaleOptions()
 */
export default function SellLeadModal({ lead, options, onClose, onSold }) {
    const [buyerId, setBuyerId] = useState("");
    const [buyerSearch, setBuyerSearch] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("paid");
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Already sold to (not cancelled) -> hidden from the buyer list
    const soldTo = useMemo(
        () => new Set((lead?.sales?.buyers || []).map((item) => item.buyer_id)),
        [lead]
    );

    useEffect(() => {
        if (!lead) return;

        setBuyerId("");
        setBuyerSearch("");
        setAmount(String(options?.prices?.[lead.lead_type] ?? ""));
        setPaymentStatus("paid");
        setPaymentMethod("upi");
        setReference("");
        setNote("");
        setError("");
    }, [lead, options]);

    const buyers = useMemo(() => {
        const term = buyerSearch.trim().toLowerCase();

        return (options?.buyers || [])
            .filter((buyer) => !soldTo.has(buyer.id) && buyer.id !== lead?.agent?.id)
            .filter((buyer) => !term || [buyer.name, buyer.phone, buyer.email, buyer.city].some((value) => String(value || "").toLowerCase().includes(term)));
    }, [options, buyerSearch, soldTo, lead]);

    const close = () => {
        if (!saving) onClose();
    };

    const submit = async () => {
        if (!buyerId) {
            setError("Please select the seller / broker buying this lead.");
            return;
        }

        if (amount === "" || Number(amount) < 0 || Number.isNaN(Number(amount))) {
            setError("Please enter a valid price.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await sellLead(lead.id, {
                buyer_id: Number(buyerId),
                amount: Number(amount),
                payment_status: paymentStatus,
                payment_method: paymentStatus === "paid" ? paymentMethod : null,
                payment_reference: reference.trim() || null,
                note: note.trim() || null,
            });

            showToast(res?.message || "Lead sold.");
            onSold(res?.data?.sale);
        } catch (err) {
            setError(err?.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Tmodal
            isOpen={Boolean(lead)}
            onClose={close}
            size="lg"
            title="Sell Lead"
            footer={
                <div className="flex gap-3">
                    <button type="button" onClick={close} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-[#E87722] px-4 py-2 text-white hover:bg-[#d96818] disabled:opacity-60"
                    >
                        {saving && <Spinner size="sm" color="white" />}
                        {paymentStatus === "paid" ? "Sell & Mark Paid" : "Create Sale (Payment Pending)"}
                    </button>
                </div>
            }
        >
            {lead && (
                <div className="space-y-4">
                    {/* Lead */}
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="mb-0 font-semibold text-[#1A1F36]">
                            {lead.name} · {lead.phone}
                        </p>
                        <p className="mb-0 mt-0.5 text-xs text-[#62748E]">
                            {lead.lead_type === "profile" && `Get Number: ${lead.agent?.name || "-"}`}
                            {lead.lead_type === "property" && `Property: ${lead.property?.title || "-"}`}
                            {lead.lead_type === "project" && `Project: ${lead.project?.name || "-"}`}
                        </p>
                        {lead.sales?.sold_count > 0 && (
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">Already sold to {lead.sales.sold_count} buyer(s).</p>
                        )}
                    </div>

                    {/* Buyer */}
                    <div>
                        <label htmlFor="sell_buyer_search" className={labelClass}>
                            Sell to (seller / broker)<span className="text-red-500"> *</span>
                        </label>
                        <div className="relative mt-1">
                            <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                                id="sell_buyer_search"
                                value={buyerSearch}
                                onChange={(e) => setBuyerSearch(e.target.value)}
                                placeholder="Search name, phone, email or city..."
                                autoComplete="off"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                        <div role="listbox" aria-label="Select buyer" className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-1">
                            {buyers.length === 0 ? (
                                <p className="mb-0 px-3 py-4 text-center text-sm text-[#62748E]">No seller / broker found.</p>
                            ) : (
                                buyers.map((buyer) => {
                                    const selected = String(buyer.id) === buyerId;

                                    return (
                                        <button
                                            key={buyer.id}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => setBuyerId(String(buyer.id))}
                                            className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${selected ? "bg-orange-50 ring-1 ring-[#E87722]" : "hover:bg-gray-50"}`}
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-[#1A1F36]">{buyer.name}</span>
                                                <span className="block truncate text-xs text-[#62748E]">
                                                    {[buyer.role && buyer.role.charAt(0).toUpperCase() + buyer.role.slice(1), buyer.phone, buyer.city].filter(Boolean).join(" · ")}
                                                </span>
                                            </span>
                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#E87722] bg-[#E87722] text-white" : "border-gray-300"}`} aria-hidden="true">
                                                {selected && <FiCheck size={12} />}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="sell_amount" className={labelClass}>
                                Price (₹)<span className="text-red-500"> *</span>
                            </label>
                            <input
                                id="sell_amount"
                                type="number"
                                min="0"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={inputClass}
                            />
                            <p className="mb-0 mt-1 text-xs text-[#62748E]">Default from Lead Revenue → Pricing.</p>
                        </div>

                        <div>
                            <label htmlFor="sell_status" className={labelClass}>Payment</label>
                            <select id="sell_status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputClass}>
                                <option value="paid">Received (Paid)</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {paymentStatus === "paid" && (
                            <div>
                                <label htmlFor="sell_method" className={labelClass}>
                                    Payment Method<span className="text-red-500"> *</span>
                                </label>
                                <select id="sell_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                                    {Object.entries(options?.payment_methods || {}).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label htmlFor="sell_reference" className={labelClass}>Reference / Txn ID</label>
                            <input id="sell_reference" value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sell_note" className={labelClass}>Note</label>
                        <textarea id="sell_note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
                    </div>

                    <p className="mb-0 text-xs text-[#62748E]">
                        {paymentStatus === "paid"
                            ? "The buyer sees this lead in their Leads right away."
                            : "The buyer gets this lead when you mark the payment as received (Lead Revenue → Sales)."}
                    </p>

                    {error && <p className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                </div>
            )}
        </Tmodal>
    );
}
