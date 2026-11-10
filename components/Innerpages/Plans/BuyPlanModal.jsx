import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FaCheckCircle, FaMoneyBillWave, FaMobileAlt, FaUniversity, FaMoneyCheckAlt, FaTimes } from "react-icons/fa";
import { createPlanOrder } from "../../../utils/fetchApi";

const NAVY = "#12305F";

const METHODS = [
    { value: "cash", label: "Cash", text: "Pay at our office", Icon: FaMoneyBillWave },
    { value: "upi", label: "UPI", text: "GPay / PhonePe / Paytm", Icon: FaMobileAlt },
    { value: "bank_transfer", label: "Bank Transfer", text: "NEFT / IMPS / RTGS", Icon: FaUniversity },
    { value: "cheque", label: "Cheque", text: "Submit at our office", Icon: FaMoneyCheckAlt },
];

const REFERENCE_LABEL = {
    upi: "UPI Transaction ID",
    bank_transfer: "Bank Reference / UTR No.",
    cheque: "Cheque No.",
};

const PERIOD_TEXT = {
    month: "per month · valid for 1 month",
    year: "per year · valid for 1 year",
    one_time: "one time",
    free: "free",
};

export const formatInr = (value) =>
    Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const isFreePlan = (plan) => plan?.billing_period === "free" || Number(plan?.price) <= 0;

/**
 * Buy a plan: free plan is activated at once,
 * paid plan creates a request that admin approves after cash / offline payment.
 */
export default function BuyPlanModal({ plan, onClose, onDone }) {
    const free = isFreePlan(plan);
    const [method, setMethod] = useState("cash");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // Page behind does not scroll while the modal is open
    useEffect(() => {
        const { overflow, paddingRight } = document.body.style;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        // Keep the page from jumping sideways when its scrollbar disappears
        if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

        return () => {
            document.body.style.overflow = overflow;
            document.body.style.paddingRight = paddingRight;
        };
    }, []);

    // Esc closes (not while submitting)
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, submitting]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await createPlanOrder({
                plan_id: plan.id,
                ...(free
                    ? {}
                    : {
                        payment_method: method,
                        payment_reference: REFERENCE_LABEL[method] ? reference.trim() || undefined : undefined,
                        note: note.trim() || undefined,
                    }),
            });

            setResult(res);
            onDone?.(res);
        } catch (err) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="scrollbar-hide fixed inset-0 z-[1000] flex items-end justify-center overflow-y-auto overscroll-contain bg-black/50 p-0 sm:items-center sm:p-4"
            onClick={() => !submitting && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="buy_plan_title"
                className="w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-3 text-white" style={{ background: `linear-gradient(120deg, ${NAVY} 0%, #1B4380 100%)` }}>
                    <div>
                        <p id="buy_plan_title" className="mb-0 text-[18px] font-bold">
                            {free ? "Activate" : "Buy"} {plan.name}
                        </p>
                        <p className="mb-0 mt-0.5 text-[14px] text-white/80">
                            <span className="text-[20px] font-extrabold text-white">{free ? "Free" : formatInr(plan.price)}</span>{" "}
                            {!free && (PERIOD_TEXT[plan.billing_period] || "")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                {result ? (
                    <div className="px-6 py-6 text-center">
                        <FaCheckCircle className="mx-auto text-[44px] text-green-500" />
                        <p className="mb-0 mt-3 text-[16px] font-semibold text-[#1A1F36]">{result.message}</p>
                        {!free && (
                            <p className="mb-0 mt-2 text-[14px] text-[#62748E]">
                                Order No: <span className="font-semibold text-[#1A1F36]">{result.data?.order?.order_no}</span>. Keep it for your payment.
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 rounded-lg px-6 py-2.5 text-[15px] font-semibold text-white"
                            style={{ backgroundColor: NAVY }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
                        {free ? (
                            <p className="mb-0 rounded-lg bg-[#EEF4FB] px-4 py-3 text-[14px] text-[#1F2A44]">
                                This plan is free. It will be active right away and you can list up to{" "}
                                <b>{Number(plan.total_listings) || Number(plan.paid_listings) + Number(plan.free_listings)}</b> properties.
                            </p>
                        ) : (
                            <>
                                <div>
                                    <p className="mb-2 text-[14px] font-semibold text-[#1A1F36]">How will you pay?</p>
                                    <div role="radiogroup" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                        {METHODS.map(({ value, label, text, Icon }) => {
                                            const selected = method === value;

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={selected}
                                                    onClick={() => setMethod(value)}
                                                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                                                        selected ? "border-[var(--primary-color)] bg-orange-50 ring-1 ring-[var(--primary-color)]" : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                >
                                                    <Icon className={`mt-0.5 shrink-0 text-[18px] ${selected ? "text-[var(--primary-color)]" : "text-[#62748E]"}`} />
                                                    <span>
                                                        <span className="block text-[14px] font-semibold text-[#1A1F36]">{label}</span>
                                                        <span className="block text-[12px] text-[#62748E]">{text}</span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 gap-4 ${REFERENCE_LABEL[method] ? "md:grid-cols-2" : ""}`}>
                                {REFERENCE_LABEL[method] && (
                                    <div>
                                        <label htmlFor="plan_payment_reference" className="mb-1.5 block text-[14px] font-semibold text-[#1A1F36]">
                                            {REFERENCE_LABEL[method]} <span className="font-normal text-[#62748E]">(if already paid)</span>
                                        </label>
                                        <input
                                            id="plan_payment_reference"
                                            value={reference}
                                            onChange={(event) => setReference(event.target.value)}
                                            maxLength={255}
                                            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-[14px] outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-orange-100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="plan_note" className="mb-1.5 block text-[14px] font-semibold text-[#1A1F36]">
                                        Note <span className="font-normal text-[#62748E]">(optional)</span>
                                    </label>
                                    <textarea
                                        id="plan_note"
                                        rows={1}
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        maxLength={1000}
                                        placeholder="e.g. Will visit the office on Monday"
                                        className="h-11 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-[14px] outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-orange-100"
                                    />
                                </div>
                                </div>

                                <p className="mb-0 rounded-lg bg-[#FFF8E6] px-4 py-3 text-[13px] leading-5 text-[#5B4A1A]">
                                    No online payment is taken here. Our team will contact you, and your plan becomes active as soon as
                                    the payment of <b>{formatInr(plan.price)}</b> is confirmed.
                                </p>
                            </>
                        )}

                        {error && (
                            <p role="alert" className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[16px] font-bold text-white transition hover:opacity-90 disabled:opacity-70"
                            style={{ backgroundColor: "var(--primary-color)" }}
                        >
                            {submitting ? <Spinner size="sm" color="white" /> : null}
                            {submitting ? "Please wait..." : free ? "Activate Free Plan" : "Send Plan Request"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
