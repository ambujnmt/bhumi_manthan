"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { FiArrowDown, FiArrowUp, FiPlus } from "react-icons/fi";
import { FaRegTrashCan } from "react-icons/fa6";
import { fetchFAQs } from "../../../utils/fetchApi";
import { saveFaqs } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import RichTextEditor from "../../RichTextEditor/RichTextEditor";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// Local key for React list (FAQ id from API is only the position)
const newFaq = () => ({ key: Date.now() + Math.random(), question: "", answer: "", status: true });

export default function FaqSettings() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const applyList = (list) =>
        setFaqs(
            (Array.isArray(list) ? list : []).map((faq) => ({
                key: Date.now() + Math.random(),
                question: faq.question || "",
                answer: faq.answer || "",
                status: faq.status === 1 || faq.status === true,
            }))
        );

    useEffect(() => {
        fetchFAQs()
            .then((res) => applyList(res?.data))
            .finally(() => setLoading(false));
    }, []);

    const update = (key, changes) =>
        setFaqs((previous) => previous.map((faq) => (faq.key === key ? { ...faq, ...changes } : faq)));

    const move = (index, direction) =>
        setFaqs((previous) => {
            const next = [...previous];
            const target = index + direction;

            if (target < 0 || target >= next.length) return previous;

            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const handleSubmit = async (event) => {
        event.preventDefault();

        const incomplete = faqs.findIndex((faq) => !faq.question.trim() || !faq.answer);

        if (incomplete !== -1) {
            setMessage(`FAQ #${incomplete + 1} needs both a question and an answer.`);
            setMessageType("error");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const res = await saveFaqs(
                faqs.map(({ question, answer, status }) => ({ question, answer, status }))
            );

            applyList(res?.data);
            showToast(res?.message || "FAQs saved successfully.");
        } catch (error) {
            setMessage(error?.message || "Something went wrong while saving.");
            setMessageType("error");
            showToast(error?.message || "Something went wrong while saving.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
                <div
                    role={messageType === "error" ? "alert" : "status"}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        messageType === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {message}
                </div>
            )}

            {faqs.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-[#62748E]">
                    No FAQs yet. Click "Add FAQ" to create one.
                </div>
            )}

            {faqs.map((faq, index) => (
                <div key={faq.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#001737]">FAQ #{index + 1}</span>

                        <div className="flex items-center gap-1">
                            <label className="mr-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1A1F36]">
                                <input
                                    type="checkbox"
                                    checked={faq.status}
                                    onChange={(e) => update(faq.key, { status: e.target.checked })}
                                    className="h-4 w-4 accent-[#E87722]"
                                />
                                Active
                            </label>
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move up">
                                <FiArrowUp size={14} />
                            </button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === faqs.length - 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move down">
                                <FiArrowDown size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setFaqs((previous) => previous.filter((item) => item.key !== faq.key))}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                aria-label="Remove FAQ"
                            >
                                <FaRegTrashCan size={14} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Question</label>
                        <input
                            value={faq.question}
                            onChange={(e) => update(faq.key, { question: e.target.value })}
                            maxLength={500}
                            placeholder="How do I list my property?"
                            className={inputClass}
                        />
                    </div>

                    <div className="mt-4">
                        <p className={`${labelClass} mb-1.5`}>Answer</p>
                        <RichTextEditor
                            value={faq.answer}
                            onChange={(html) => update(faq.key, { answer: html })}
                            placeholder="Write the answer..."
                            minHeight={110}
                        />
                    </div>
                </div>
            ))}

            <div className="sticky bottom-0 -mx-4 flex flex-col-reverse justify-between gap-3 border-t border-gray-200 bg-[#f4f5fa]/95 px-4 py-4 backdrop-blur sm:flex-row">
                <button
                    type="button"
                    onClick={() => setFaqs((previous) => [...previous, newFaq()])}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#E87722] bg-white px-4 py-2.5 text-sm font-semibold text-[#E87722] hover:bg-orange-50"
                >
                    <FiPlus size={16} /> Add FAQ
                </button>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <a
                        href="/user/cms/faqs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#001737] hover:bg-gray-50"
                    >
                        View Page
                    </a>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#E87722] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#cf681b] disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" color="white" />
                                Saving...
                            </>
                        ) : (
                            "Save FAQs"
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
