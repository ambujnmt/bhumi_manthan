"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Tooltip } from "@heroui/react";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus, FiSearch } from "react-icons/fi";
import { actionButtonClass } from "../actionButtonClass";
import PageTitle from "../../Breadcrumb/PageTitle";
import Tmodal from "../../Tmodal/Tmodal";
import { BadgePill } from "../../Common/PropertyCardBadge";
import { showToast } from "../../../store/toast";
import { deleteAdminPropertyBadge, getAdminPropertyBadges, saveAdminPropertyBadge } from "../../../utils/adminFetchApi";
import { useAdminPermission } from "../../../utils/adminPermissions";

const MAX_NAME = 50;

const EMPTY_FORM = { name: "", sort_order: "", is_active: true };

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

// Same look as the badge on the website property card (and "Ready to Move" on Admin -> Property List)
function BadgeChip({ name }) {
    return <BadgePill text={name || "Badge"} />;
}

const cleanName = (value) => String(value || "").replace(/\s+/g, " ").trim();

const sortBadges = (list) => [...list].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

/**
 * Admin: Card Badge master. Badges here are the options of "Card Badge" on the
 * property add / edit form (active ones only). Rename updates properties using it,
 * delete puts them back on the automatic badge.
 */
export default function Listing() {
    const can = useAdminPermission();

    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Add / edit modal
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete modal + status toggle in progress
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        getAdminPropertyBadges()
            .then((res) => setBadges(sortBadges(res?.data?.badges || [])))
            .catch((error) => showToast(error?.message || "Failed to load badges.", "error"))
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return term ? badges.filter((badge) => badge.name.toLowerCase().includes(term)) : badges;
    }, [badges, search]);

    const replaceBadge = (saved) => setBadges((previous) => sortBadges([...previous.filter((item) => item.id !== saved.id), saved]));

    const openForm = (badge = null) => {
        setEditing(badge);
        setForm(
            badge
                ? { name: badge.name, sort_order: String(badge.sort_order ?? 0), is_active: Boolean(badge.is_active) }
                : EMPTY_FORM
        );
        setFormError("");
        setFormOpen(true);
    };

    const closeForm = () => {
        if (saving) return;
        setFormOpen(false);
        setEditing(null);
    };

    const handleSave = async (event) => {
        event?.preventDefault();

        const name = cleanName(form.name);

        if (!name) {
            setFormError("Please enter the badge text.");
            return;
        }

        if (name.toLowerCase() === "none") {
            setFormError('"None" is reserved for "No badge". Use a different text.');
            return;
        }

        if (badges.some((badge) => badge.name.toLowerCase() === name.toLowerCase() && badge.id !== editing?.id)) {
            setFormError("This badge already exists.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const payload = { name, is_active: form.is_active };
            if (form.sort_order !== "") payload.sort_order = Number(form.sort_order);

            const res = await saveAdminPropertyBadge(payload, editing?.id);
            replaceBadge(res.data.badge);
            showToast(res.message);
            setFormOpen(false);
            setEditing(null);
        } catch (error) {
            setFormError(error?.message || "Something went wrong while saving the badge.");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (badge) => {
        if (!can("property_badges.edit") || togglingId) return;

        setTogglingId(badge.id);

        try {
            const res = await saveAdminPropertyBadge({ is_active: !badge.is_active }, badge.id);
            replaceBadge(res.data.badge);
            showToast(res.data.badge.is_active ? "Badge is active: it shows in the property form." : "Badge is inactive: hidden from the property form.");
        } catch (error) {
            showToast(error?.message || "Could not change the status.", "error");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await deleteAdminPropertyBadge(deleteTarget.id);
            setBadges((previous) => previous.filter((badge) => badge.id !== deleteTarget.id));
            showToast(res.message);
            setDeleteTarget(null);
        } catch (error) {
            showToast(error?.message || "Could not delete the badge.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const renamed = editing && cleanName(form.name) !== editing.name;

    return (
        <div className="min-h-screen">
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Card Badges", active: true },
                ]}
                title="Card Badges"
            />

            <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search badges"
                        aria-label="Search badges"
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none focus:border-[#E87722]"
                    />
                </div>

                {can("property_badges.create") && (
                    <button
                        type="button"
                        onClick={() => openForm()}
                        disabled={loading}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:opacity-60"
                    >
                        <FiPlus size={16} />
                        <span>Add Badge</span>
                    </button>
                )}
            </div>

            <p className="mb-3 text-xs text-[#62748E]">
                Active badges are the options of &ldquo;Card Badge&rdquo; when adding or editing a property. Order = order in that list.
                &ldquo;Auto&rdquo; and &ldquo;No badge&rdquo; are always there.
            </p>

            <div className="w-full overflow-auto rounded-xl bg-white shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Badge</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Properties</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Order</th>
                            <th className="whitespace-nowrap px-4 py-3 text-left">Status</th>
                            <th className="whitespace-nowrap px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 4 }, (_, index) => (
                                <tr key={index} className="border-t">
                                    {Array.from({ length: 5 }, (__, cell) => (
                                        <td key={cell} className="px-4 py-3">
                                            <span className="block h-4 w-20 animate-pulse rounded bg-gray-100" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : visible.length > 0 ? (
                            visible.map((badge) => (
                                <tr key={badge.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <BadgeChip name={badge.name} />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-[#62748E]">
                                        {badge.properties_count} {badge.properties_count === 1 ? "property" : "properties"}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{badge.sort_order}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(badge)}
                                            disabled={!can("property_badges.edit") || togglingId === badge.id}
                                            title={can("property_badges.edit") ? "Click to change status" : ""}
                                            aria-label={`${badge.name}: ${badge.is_active ? "active" : "inactive"}${can("property_badges.edit") ? ", click to change" : ""}`}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:cursor-default ${
                                                badge.is_active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                        >
                                            {togglingId === badge.id && <Spinner size="sm" />}
                                            {badge.is_active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            {can("property_badges.edit") && (
                                                <Tooltip content="Update" placement="top" showArrow>
                                                    <button type="button" aria-label={`Update badge ${badge.name}`} onClick={() => openForm(badge)} className={actionButtonClass}>
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                            {can("property_badges.delete") && (
                                                <Tooltip content="Delete" placement="top" showArrow>
                                                    <button type="button" aria-label={`Delete badge ${badge.name}`} onClick={() => setDeleteTarget(badge)} className={actionButtonClass}>
                                                        <FaRegTrashCan size={14} />
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-10 text-center text-gray-500">
                                    {search.trim() ? "No badge matches your search." : "No badges yet. Add one to use it on property cards."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={formOpen}
                onClose={closeForm}
                title={editing ? "Update Badge" : "Add Badge"}
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-[rgb(232,119,34)] px-4 py-2 text-white disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleSave} noValidate className="space-y-4">
                    <div>
                        <label htmlFor="badge_name" className={labelClass}>
                            Badge Text<span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            id="badge_name"
                            value={form.name}
                            onChange={(event) => {
                                setForm((previous) => ({ ...previous, name: event.target.value }));
                                setFormError("");
                            }}
                            maxLength={MAX_NAME}
                            placeholder="e.g. Hot Deal"
                            aria-invalid={Boolean(formError)}
                            className={inputClass}
                            autoFocus
                        />
                        <p className="mb-0 mt-1 text-xs text-[#62748E]">
                            Shown exactly as typed (e.g. "Hot Deal"), max {MAX_NAME} characters.
                        </p>
                    </div>

                    <div>
                        <p className="mb-1.5 text-sm font-medium text-[#283A86]">Preview</p>
                        <BadgeChip name={cleanName(form.name)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="badge_sort_order" className={labelClass}>Display Order</label>
                            <input
                                id="badge_sort_order"
                                value={form.sort_order}
                                onChange={(event) => setForm((previous) => ({ ...previous, sort_order: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                                inputMode="numeric"
                                placeholder={editing ? "0" : "Last in the list"}
                                className={inputClass}
                            />
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 self-end pb-2.5 text-sm font-medium text-[#283A86]">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                                className="h-4 w-4 accent-[#E87722]"
                            />
                            Active (show in the property form)
                        </label>
                    </div>

                    {renamed && editing.properties_count > 0 && (
                        <p className="mb-0 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9a4a0f]">
                            {editing.properties_count} {editing.properties_count === 1 ? "property uses" : "properties use"} this badge. They will show the new text.
                        </p>
                    )}

                    {formError && (
                        <p role="alert" className="mb-0 text-sm text-red-600">
                            {formError}
                        </p>
                    )}
                </form>
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                title="Delete Badge"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                        >
                            {deleting ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                }
            >
                {deleteTarget && (
                    <div className="space-y-3 text-sm text-[#1A1F36]">
                        <p className="mb-0">
                            Delete the badge <BadgeChip name={deleteTarget.name} />?
                        </p>
                        {deleteTarget.properties_count > 0 ? (
                            <p className="mb-0 text-[#62748E]">
                                {deleteTarget.properties_count} {deleteTarget.properties_count === 1 ? "property uses" : "properties use"} it.
                                They will go back to the automatic badge (Featured / New / Ultra Luxury).
                            </p>
                        ) : (
                            <p className="mb-0 text-[#62748E]">No property uses this badge.</p>
                        )}
                    </div>
                )}
            </Tmodal>
        </div>
    );
}
