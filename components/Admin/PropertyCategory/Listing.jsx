"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Tooltip, Button } from "@heroui/react";
import { FaBuilding, FaChevronDown, FaHome, FaKey, FaLayerGroup, FaPen, FaPlus } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import PageTitle from "../../Breadcrumb/PageTitle";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import {
  getAdminPropertyCategories,
  addAdminPropertyCategory,
  updateAdminPropertyCategory,
  deleteAdminPropertyCategory,
} from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import Tmodal from "../../Tmodal/Tmodal";

// Group icon by slug (other groups get the layers icon)
const GROUP_ICONS = {
  residential: FaHome,
  commercial: FaBuilding,
  rental: FaKey,
};

// Last loaded categories: cards show right away (no loader), fresh data loads in background
const CATEGORIES_CACHE_KEY = "admin_property_categories";
let categoriesCache = null;

const readCategoriesCache = () => {
  if (categoriesCache) return categoriesCache;

  try {
    const saved = JSON.parse(sessionStorage.getItem(CATEGORIES_CACHE_KEY));
    if (Array.isArray(saved)) categoriesCache = saved;
  } catch (e) { }

  return categoriesCache;
};

const saveCategoriesCache = (categories) => {
  categoriesCache = categories;

  try {
    sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
  } catch (e) { }
};

const EMPTY_FORM = { id: null, parent_id: null, parentName: "", name: "", is_active: true };

export default function Listing() {
  const can = useAdminPermission();

  const [categories, setCategories] = useState(() => readCategoriesCache() || []);
  // Placeholder cards only on the very first load (nothing cached yet)
  const [loading, setLoading] = useState(() => !readCategoriesCache());
  const [error, setError] = useState("");

  // Add / edit modal
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Closed group rows (all open by default)
  const [collapsed, setCollapsed] = useState([]);

  const toggleGroup = (id) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const fetchCategories = useCallback(async () => {
    setError("");

    try {
      const res = await getAdminPropertyCategories();
      const list = Array.isArray(res?.data?.categories) ? res.data.categories : [];

      setCategories(list);
      saveCategoriesCache(list);
    } catch (err) {
      console.error("Failed to fetch property categories:", err);

      // Keep showing cached cards if the refresh fails
      if (!readCategoriesCache()) {
        setCategories([]);
        setError(err?.message || "Unable to load categories.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ------------------------------------------------
  // ADD / EDIT
  // ------------------------------------------------

  const openAddGroup = () => {
    setFormError("");
    setForm({ ...EMPTY_FORM });
  };

  const openAddSub = (group) => {
    setFormError("");
    setForm({ ...EMPTY_FORM, parent_id: group.id, parentName: group.name });
  };

  const openEdit = (category, group = null) => {
    setFormError("");
    setForm({
      id: category.id,
      parent_id: category.parent_id,
      parentName: group?.name || "",
      name: category.name,
      is_active: category.is_active,
    });
  };

  const closeForm = () => {
    if (saving) return;

    setForm(null);
    setFormError("");
  };

  const saveForm = async (e) => {
    e?.preventDefault();

    if (!form || saving) return;

    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = { name: form.name.trim(), is_active: form.is_active };

      const res = form.id
        ? await updateAdminPropertyCategory(form.id, payload)
        : await addAdminPropertyCategory({ ...payload, parent_id: form.parent_id });

      setForm(null);
      showToast(res?.message);

      await fetchCategories();
    } catch (err) {
      setFormError(err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Active / inactive pill click
  const toggleActive = async (category) => {
    if (!can("property_categories.edit")) return;

    try {
      const res = await updateAdminPropertyCategory(category.id, { is_active: !category.is_active });

      showToast(res?.message);
      await fetchCategories();
    } catch (err) {
      showToast(err?.message || "Unable to update category.", "error");
    }
  };

  // ------------------------------------------------
  // DELETE
  // ------------------------------------------------

  const confirmDelete = async () => {
    if (!selectedCategory?.id || deleting) return;

    setDeleting(true);

    try {
      const res = await deleteAdminPropertyCategory(selectedCategory.id);

      setSelectedCategory(null);
      showToast(res?.message);

      await fetchCategories();
    } catch (err) {
      showToast(err?.message || "Something went wrong while deleting.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------------------------
  // FILTERS (search / category / status)
  // ------------------------------------------------

  const term = search.trim().toLowerCase();
  const statusMatch = (category) =>
    statusFilter === "all" || (statusFilter === "active" ? category.is_active : !category.is_active);
  const isFiltering = Boolean(term) || statusFilter !== "all";

  const filteredCategories = categories
    .filter((group) => groupFilter === "all" || group.id === groupFilter)
    .map((group) => {
      const children = Array.isArray(group.children) ? group.children : [];
      const groupNameMatch = !term || group.name.toLowerCase().includes(term);

      // Group name matches search -> all its types (by status), else only matching types
      const matchedChildren = children.filter(
        (child) => statusMatch(child) && (groupNameMatch || child.name.toLowerCase().includes(term))
      );

      return { ...group, children: matchedChildren, totalChildren: children.length, groupNameMatch };
    })
    .filter((group) => {
      if (!isFiltering) return true;
      if (group.children.length > 0) return true;

      // No matching types: show the group itself if it matches
      return group.groupNameMatch && statusMatch(group);
    });

  const resetFilters = () => {
    setSearch("");
    setGroupFilter("all");
    setStatusFilter("all");
  };

  const isGroupForm = form && !form.parent_id;
  const selectedIsGroup = selectedCategory && !selectedCategory.parent_id;

  const statusPill = (category, small = false) => (
    <button
      type="button"
      onClick={() => toggleActive(category)}
      disabled={!can("property_categories.edit")}
      title={can("property_categories.edit") ? "Click to change status" : ""}
      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full font-semibold transition ${small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} ${category.is_active
        ? "bg-green-50 text-green-700 hover:bg-green-100"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        } disabled:cursor-default`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${category.is_active ? "bg-green-500" : "bg-gray-400"}`} />
      {category.is_active ? "Active" : "Inactive"}
    </button>
  );

  return (
    <div>
      <PageTitle
        breadCrumbItems={[
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "Property Categories", active: true },
        ]}
        title="Property Categories"
      />

      {/* Filters + add category */}
      <div className="mt-6 mb-4 space-y-3">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", name: "All", count: categories.reduce((sum, group) => sum + (group.children?.length || 0), 0) },
            ...categories.map((group) => ({ id: group.id, name: group.name, count: group.children?.length || 0 })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGroupFilter(tab.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${groupFilter === tab.id
                ? "border-[#E87722] bg-[#E87722] text-white"
                : "border-gray-200 bg-white text-[#62748E] hover:border-[#E87722] hover:text-[#E87722]"
                }`}
            >
              {tab.name}
              <span className={`rounded-full px-1.5 text-[10px] ${groupFilter === tab.id ? "bg-white/25" : "bg-gray-100"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + status + add */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category or type..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#1A1F36] outline-none focus:border-[#E87722]"
              aria-label="Status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {(isFiltering || groupFilter !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 rounded-lg px-3 text-sm font-medium text-[#62748E] transition hover:bg-gray-100 hover:text-[#E87722]"
              >
                Clear
              </button>
            )}

            {can("property_categories.create") && (
              <button
                type="button"
                onClick={openAddGroup}
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
              >
                <FaPlus size={12} />
                <span className="hidden sm:inline">Add Category</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grouped table: group row + its types below */}
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-[#62748E]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="w-[120px] px-4 py-3 text-left font-semibold">Status</th>
                <th className="w-[90px] px-4 py-3 text-left font-semibold">Order</th>
                <th className="w-[150px] px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((row) => (
                  <tr key={row} className="animate-pulse border-t border-gray-100">
                    <td className="px-4 py-3"><div className={`h-4 rounded bg-gray-200 ${row % 3 === 1 ? "w-40" : "ml-8 w-28"}`} /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-gray-100" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-6 rounded bg-gray-100" /></td>
                    <td className="px-4 py-3"><div className="h-8 w-20 rounded bg-gray-100" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-red-600">
                    <p>{error}</p>

                    <button
                      type="button"
                      onClick={fetchCategories}
                      className="mt-3 rounded-lg bg-[#E87722] px-4 py-2 text-white"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((group) => {
                  const GroupIcon = GROUP_ICONS[group.slug] || FaLayerGroup;
                  const children = Array.isArray(group.children) ? group.children : [];
                  // Filtered results always open
                  const isOpen = isFiltering || !collapsed.includes(group.id);

                  return (
                    <React.Fragment key={group.id}>
                      {/* Group row */}
                      <tr className="border-t border-gray-200 bg-orange-50/40">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className="flex items-center gap-2.5 text-left"
                            aria-expanded={isOpen}
                          >
                            <FaChevronDown
                              size={11}
                              className={`flex-shrink-0 text-[#62748E] transition-transform ${isOpen ? "" : "-rotate-90"}`}
                            />

                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#E87722]">
                              <GroupIcon size={14} />
                            </span>

                            <span className={`font-bold ${group.is_active ? "text-[#1A1F36]" : "text-gray-400"}`}>
                              {group.name}
                            </span>

                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#62748E] shadow-sm">
                              {isFiltering ? `${children.length} / ${group.totalChildren}` : children.length}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3">{statusPill(group)}</td>

                        <td className="px-4 py-3 font-semibold text-[#1A1F36]">{group.sort_order}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {can("property_categories.edit") && (
                              <Tooltip content="Update Category">
                                <button
                                  type="button"
                                  onClick={() => openEdit(group)}
                                  className={`${actionButtonClass} bg-white`}
                                  aria-label={`Edit ${group.name}`}
                                >
                                  <FaPen size={12} />
                                </button>
                              </Tooltip>
                            )}

                            {can("property_categories.delete") && (
                              <Tooltip content="Delete Category">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategory(group)}
                                  className={`${actionButtonClass} bg-white`}
                                  aria-label={`Delete ${group.name}`}
                                >
                                  <FaRegTrashCan size={13} />
                                </button>
                              </Tooltip>
                            )}

                            {can("property_categories.create") && (
                              <Tooltip content={`Add ${group.name} Type`}>
                                <button
                                  type="button"
                                  onClick={() => openAddSub(group)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E87722] text-white transition hover:bg-[#d96818]"
                                  aria-label={`Add ${group.name} type`}
                                >
                                  <FaPlus size={11} />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Type rows */}
                      {isOpen && (children.length > 0 ? (
                        children.map((child) => (
                          <tr key={child.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                            <td className="py-2.5 pl-[4.25rem] pr-4">
                              <span className={`flex items-center gap-2 font-medium ${child.is_active ? "text-[#1A1F36]" : "text-gray-400 line-through"}`}>
                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E87722]" />
                                {child.name}
                              </span>
                            </td>

                            <td className="px-4 py-2.5">{statusPill(child, true)}</td>

                            <td className="px-4 py-2.5 text-[#62748E]">{child.sort_order}</td>

                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {can("property_categories.edit") && (
                                  <Tooltip content="Update Type">
                                    <button
                                      type="button"
                                      onClick={() => openEdit(child, group)}
                                      className={actionButtonClass}
                                      aria-label={`Edit ${child.name}`}
                                    >
                                      <FaPen size={12} />
                                    </button>
                                  </Tooltip>
                                )}

                                {can("property_categories.delete") && (
                                  <Tooltip content="Delete Type">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedCategory(child)}
                                      className={actionButtonClass}
                                      aria-label={`Delete ${child.name}`}
                                    >
                                      <FaRegTrashCan size={13} />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-gray-100">
                          <td colSpan={4} className="py-3 pl-[4.25rem] pr-4 text-xs text-[#62748E]">
                            No types added yet
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#62748E]">
                    {categories.length > 0 ? (
                      <>
                        No matching categories found.{" "}
                        <button type="button" onClick={resetFilters} className="font-semibold text-[#E87722] hover:underline">
                          Clear filters
                        </button>
                      </>
                    ) : (
                      "No categories yet. Add a category like Residential, Commercial or Rental."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Tmodal
        isOpen={!!form}
        onClose={closeForm}
        title={
          form?.id
            ? (isGroupForm ? "Update Category" : `Update ${form.parentName} Type`)
            : (isGroupForm ? "Add Category" : `Add ${form?.parentName} Type`)
        }
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="bordered" onPress={closeForm} isDisabled={saving}>
              Cancel
            </Button>

            <Button
              className="bg-[#E87722] text-white"
              onPress={saveForm}
              isLoading={saving}
              isDisabled={saving}
            >
              {saving ? "Saving..." : form?.id ? "Update" : "Add"}
            </Button>
          </div>
        }
      >
        {form && (
          <form onSubmit={saveForm} className="space-y-4 py-1">
            {!isGroupForm && (
              <p className="mb-0 text-xs text-[#62748E]">
                Category: <span className="font-semibold text-[#1A1F36]">{form.parentName}</span>
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1A1F36]">
                {isGroupForm ? "Category Name" : "Type Name"} <span className="text-red-500">*</span>
              </label>

              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={isGroupForm ? "e.g. Residential" : "e.g. Apartment"}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1F36]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 accent-[#E87722]"
              />
              Active
            </label>

            {formError && (
              <p className="mb-0 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}
          </form>
        )}
      </Tmodal>

      {/* Delete Modal */}
      <Tmodal
        isOpen={!!selectedCategory}
        onClose={() => {
          if (!deleting) setSelectedCategory(null);
        }}
        title={selectedIsGroup ? "Delete Category" : "Delete Type"}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="bordered" onPress={() => setSelectedCategory(null)} isDisabled={deleting}>
              Cancel
            </Button>

            <Button color="danger" onPress={confirmDelete} isLoading={deleting} isDisabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <div className="py-1">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{selectedCategory?.name}</span>?
          </p>

          {selectedIsGroup && selectedCategory?.children?.length > 0 && (
            <p className="mt-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-[#E87722]">
              Its {selectedCategory.children.length} types will also be deleted.
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
        </div>
      </Tmodal>
    </div>
  );
}
