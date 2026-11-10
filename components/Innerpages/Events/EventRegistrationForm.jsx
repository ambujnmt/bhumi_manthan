import React, { useState } from "react";
import { Spinner } from "@heroui/react";
import { FaCalendarCheck, FaCheckCircle } from "react-icons/fa";
import { submitEnquiryForm } from "../../../utils/fetchApi";
import { formatEventDateRange } from "./eventUtils";

const initialForm = {
    event: "",
    name: "",
    phone: "",
    email: "",
    attendees: "1",
    message: "",
};

const inputClass =
    "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-[14px] text-[var(--text-color1)] outline-none transition focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-[var(--text-color1)]";

/**
 * Register for an event, or send a general event enquiry.
 * fixedEvent: event detail page -> form is only for that event (no event dropdown).
 * Saved with the property enquiries (POST /api/enquiry with `event`).
 */
export default function EventRegistrationForm({ events = [], fixedEvent = null, idPrefix = "er" }) {
    const fixedValue = fixedEvent ? fixedEvent.slug || String(fixedEvent.id) : "";
    const startForm = { ...initialForm, event: fixedValue };

    const [form, setForm] = useState(startForm);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
        if (result && !result.ok) setResult(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!/^[0-9+\-\s]{8,20}$/.test(form.phone.trim())) {
            setResult({ ok: false, message: "Enter a valid phone number." });
            return;
        }

        setSubmitting(true);
        setResult(null);

        const res = await submitEnquiryForm({
            event: form.event || undefined,
            attendees: form.event ? Number(form.attendees) || 1 : undefined,
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            message: form.message.trim() || undefined,
        });

        setSubmitting(false);

        if (res?.status) {
            setForm(startForm);
            setResult({ ok: true, message: res.message });
        } else {
            setResult({ ok: false, message: res?.message || "Something went wrong. Please try again." });
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_14px_40px_rgba(18,48,95,0.12)]">
            <div className="px-5 py-4" style={{ background: "linear-gradient(120deg, #12305F 0%, #1B4380 100%)" }}>
                <p className="mb-0 flex items-center gap-2 text-[17px] font-bold text-white">
                    <FaCalendarCheck className="text-[#F2B544]" /> {fixedEvent ? "Register for this Event" : "Register for an Event"}
                </p>
                <p className="mb-0 mt-1 text-[13px] text-white/70">
                    {fixedEvent
                        ? "Book your spot. Our team will call you back with the details."
                        : "Book your spot or ask us anything. Our team will call you back."}
                </p>
            </div>

            {result?.ok ? (
                <div className="px-5 py-10 text-center">
                    <FaCheckCircle className="mx-auto text-[40px] text-green-500" />
                    <p className="mb-0 mt-3 text-[15px] font-semibold text-[var(--text-color1)]">{result.message}</p>
                    <button
                        type="button"
                        onClick={() => setResult(null)}
                        className="mt-5 rounded-xl border border-[var(--primary-color)] px-5 py-2.5 text-[14px] font-semibold text-[var(--primary-color)] transition hover:bg-[var(--primary-color)] hover:text-white"
                    >
                        {fixedEvent ? "Register another person" : "Register for another event"}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
                    {!fixedEvent && (
                    <div>
                        <label htmlFor={`${idPrefix}_event`} className={labelClass}>Event</label>
                        <select id={`${idPrefix}_event`} name="event" value={form.event} onChange={handleChange} className={inputClass}>
                            <option value="">General enquiry (no specific event)</option>
                            {events.map((item) => (
                                <option key={item.id} value={item.slug || String(item.id)}>
                                    {item.title}
                                    {item.event_date ? ` · ${formatEventDateRange(item, { day: "2-digit", month: "short" })}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    )}

                    <div>
                        <label htmlFor={`${idPrefix}_name`} className={labelClass}>
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id={`${idPrefix}_name`}
                            name="name"
                            required
                            maxLength={100}
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            autoComplete="name"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}_phone`} className={labelClass}>
                            Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                            id={`${idPrefix}_phone`}
                            name="phone"
                            type="tel"
                            required
                            maxLength={20}
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            autoComplete="tel"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}_email`} className={labelClass}>
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id={`${idPrefix}_email`}
                            name="email"
                            type="email"
                            required
                            maxLength={255}
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={inputClass}
                        />
                    </div>

                    {form.event && (
                        <div>
                            <label htmlFor={`${idPrefix}_attendees`} className={labelClass}>Number of Attendees</label>
                            <select
                                id={`${idPrefix}_attendees`}
                                name="attendees"
                                value={form.attendees}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((value) => (
                                    <option key={value} value={value}>
                                        {value} {value === "1" ? "Person" : "People"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor={`${idPrefix}_message`} className={labelClass}>Message</label>
                        <textarea
                            id={`${idPrefix}_message`}
                            name="message"
                            rows={3}
                            maxLength={3000}
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Any question about the event?"
                            className={`${inputClass} h-auto resize-none py-2.5`}
                        />
                    </div>

                    {result && !result.ok && (
                        <p role="alert" className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                            {result.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] text-[15px] font-semibold text-white transition hover:bg-[#d96818] disabled:opacity-70"
                    >
                        {submitting ? (
                            <>
                                <Spinner size="sm" color="white" /> Submitting...
                            </>
                        ) : form.event ? (
                            "Register Now"
                        ) : (
                            "Send Enquiry"
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
