"use client";

import React, { useEffect, useState } from "react";
import { actionButtonClass } from "../actionButtonClass";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Spinner, Tooltip } from "@heroui/react";
import {
    deleteAdminRole,
    deleteAdminStaff,
    getAdminRoles,
    getAdminStaff,
    saveAdminRole,
    saveAdminStaff,
} from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import Tmodal from "../../Tmodal/Tmodal";

const ACTIONS = ["view", "create", "edit", "delete"];

const initialRoleForm = {
    name: "",
    description: "",
    is_active: true,
    permissions: [],
};

const initialStaffForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    admin_role_id: "",
    status: "active",
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

const thClass = "px-4 py-3 text-left whitespace-nowrap";

export default function Listing() {
    const [tab, setTab] = useState("roles");

    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add / Edit modal (role or staff)
    const [formType, setFormType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [roleForm, setRoleForm] = useState(initialRoleForm);
    const [staffForm, setStaffForm] = useState(initialStaffForm);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete modal
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);

        try {
            const [rolesRes, staffRes] = await Promise.all([getAdminRoles(), getAdminStaff()]);

            setRoles(rolesRes?.data?.roles || []);
            setModules(rolesRes?.data?.modules || []);
            setStaff(staffRes?.data?.staff || []);
        } catch (error) {
            showToast(error?.message || "Failed to load roles.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    /* =======================================================
       ADD / EDIT
    ======================================================= */

    const openRoleModal = (role = null) => {
        setEditingItem(role);
        setRoleForm(
            role
                ? {
                      name: role.name || "",
                      description: role.description || "",
                      is_active: role.is_active,
                      permissions: role.permissions || [],
                  }
                : initialRoleForm
        );
        setFormError("");
        setFormType("role");
    };

    const openStaffModal = (user = null) => {
        setEditingItem(user);
        setStaffForm(
            user
                ? {
                      name: user.name || "",
                      email: user.email || "",
                      phone: user.phone || "",
                      password: "",
                      admin_role_id: user.admin_role_id ? String(user.admin_role_id) : "",
                      status: user.status || "active",
                  }
                : { ...initialStaffForm, admin_role_id: roles[0] ? String(roles[0].id) : "" }
        );
        setFormError("");
        setFormType("staff");
    };

    const closeFormModal = () => {
        if (saving) return;

        setFormType(null);
        setEditingItem(null);
    };

    const handleStaffChange = (event) => {
        const { name, value } = event.target;

        setStaffForm((previous) => ({ ...previous, [name]: value }));
    };

    /* =======================================================
       PERMISSION MATRIX
       create / edit / delete also give view of that module
    ======================================================= */

    const togglePermission = (module, action) => {
        const key = `${module}.${action}`;

        setRoleForm((previous) => {
            const current = new Set(previous.permissions);

            if (current.has(key)) {
                current.delete(key);

                // No view -> nothing else of this module
                if (action === "view") {
                    ACTIONS.forEach((item) => current.delete(`${module}.${item}`));
                }
            } else {
                current.add(key);
                current.add(`${module}.view`);
            }

            return { ...previous, permissions: [...current] };
        });
    };

    const moduleKeys = (module) => module.actions.map((action) => `${module.key}.${action}`);

    const toggleModule = (module, checked) => {
        setRoleForm((previous) => {
            const current = new Set(previous.permissions);

            moduleKeys(module).forEach((key) => (checked ? current.add(key) : current.delete(key)));

            return { ...previous, permissions: [...current] };
        });
    };

    const allKeys = modules.flatMap(moduleKeys);
    const allSelected = allKeys.length > 0 && allKeys.every((key) => roleForm.permissions.includes(key));

    const toggleAll = (checked) => {
        setRoleForm((previous) => ({ ...previous, permissions: checked ? allKeys : [] }));
    };

    /* =======================================================
       SAVE
    ======================================================= */

    const handleSave = async () => {
        setSaving(true);
        setFormError("");

        try {
            if (formType === "role") {
                if (!roleForm.name.trim()) {
                    throw new Error("Role name is required.");
                }

                const res = await saveAdminRole(roleForm, editingItem?.id);
                showToast(res.message || "Role saved successfully.");
            } else {
                const payload = { ...staffForm, admin_role_id: Number(staffForm.admin_role_id) || "" };

                if (editingItem && !payload.password) {
                    delete payload.password;
                }

                const res = await saveAdminStaff(payload, editingItem?.id);
                showToast(res.message || "Staff user saved successfully.");
            }

            setFormType(null);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            setFormError(error?.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       DELETE
    ======================================================= */

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;

        setDeleteLoading(true);

        try {
            const res = deleteItem.type === "role"
                ? await deleteAdminRole(deleteItem.item.id)
                : await deleteAdminStaff(deleteItem.item.id);

            showToast(res.message || "Deleted successfully.");
            setDeleteItem(null);
            fetchData();
        } catch (error) {
            showToast(error?.message || "Failed to delete.", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    // "Blogs, Users +3" summary for roles table
    const permissionSummary = (role) => {
        const names = modules
            .filter((module) => role.permissions?.some((permission) => permission.startsWith(`${module.key}.`)))
            .map((module) => module.label);

        if (names.length === 0) return "No access";
        if (names.length === modules.length) return "All modules";

        return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ");
    };

    return (
        <div>
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "Roles & Permissions", active: true },
                ]}
                title="Roles & Permissions"
            />

            <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {[
                        ["roles", `Roles (${roles.length})`],
                        ["staff", `Staff Users (${staff.length})`],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                tab === key
                                    ? "bg-[#E87722] text-white"
                                    : "bg-white text-[#62748E] border border-gray-200 hover:text-[#E87722]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => (tab === "roles" ? openRoleModal() : openStaffModal())}
                    disabled={tab === "staff" && roles.length === 0}
                    title={tab === "staff" && roles.length === 0 ? "Create a role first" : ""}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiPlus size={16} />
                    {tab === "roles" ? "Add Role" : "Add Staff User"}
                </button>
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">
                {tab === "roles" ? (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className={thClass}>Role</th>
                                <th className={`${thClass} w-full`}>Access</th>
                                <th className={thClass}>Assigned Users</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="flex justify-center items-center py-16">
                                            <Spinner size="md" />
                                        </div>
                                    </td>
                                </tr>
                            ) : roles.length > 0 ? (
                                roles.map((role) => (
                                    <tr key={role.id} className="border-t align-middle hover:bg-gray-50">
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <p className="mb-0 font-semibold text-[#1A1F36]">{role.name}</p>
                                            {role.description && (
                                                <p className="mb-0 max-w-[260px] truncate text-xs text-[#62748E]">
                                                    {role.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-[#62748E]">
                                            {permissionSummary(role)}
                                            <span className="ml-1 text-xs text-gray-400">
                                                ({role.permissions?.length || 0} permissions)
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">{role.users_count}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    role.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {role.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Tooltip content="Update Role">
                                                    <button
                                                        type="button"
                                                        onClick={() => openRoleModal(role)}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip content="Delete Role">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteItem({ type: "role", item: role })}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaRegTrashCan size={14} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-500">
                                        No roles found. Click "Add Role" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className={thClass}>Name</th>
                                <th className={`${thClass} w-full`}>Email</th>
                                <th className={thClass}>Phone</th>
                                <th className={thClass}>Role</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="flex justify-center items-center py-16">
                                            <Spinner size="md" />
                                        </div>
                                    </td>
                                </tr>
                            ) : staff.length > 0 ? (
                                staff.map((user) => (
                                    <tr key={user.id} className="border-t align-middle hover:bg-gray-50">
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                {/* First letter avatar */}
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                                                    {(user.name || user.email || "?").trim().charAt(0)}
                                                </span>
                                                <span className="font-medium text-[#1A1F36]">{user.name || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 max-w-[260px] truncate whitespace-nowrap text-[#62748E]">{user.email}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap text-[#62748E]">{user.phone || "-"}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            {user.admin_role ? (
                                                <span
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                        user.admin_role.is_active
                                                            ? "bg-[#001737] text-white"
                                                            : "bg-gray-100 text-gray-500 line-through"
                                                    }`}
                                                >
                                                    {user.admin_role.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-red-500">No role</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                                    user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Tooltip content="Update Staff User">
                                                    <button
                                                        type="button"
                                                        onClick={() => openStaffModal(user)}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaPen size={13} />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip content="Delete Staff User">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteItem({ type: "staff", item: user })}
                                                        className={actionButtonClass}
                                                    >
                                                        <FaRegTrashCan size={14} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">
                                        {roles.length === 0
                                            ? "Create a role first, then add staff users."
                                            : 'No staff users found. Click "Add Staff User" to create one.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add / Edit Modal */}
            <Tmodal
                isOpen={Boolean(formType)}
                onClose={closeFormModal}
                size={formType === "role" ? "3xl" : "lg"}
                title={
                    formType === "role"
                        ? editingItem ? "Update Role" : "Add Role"
                        : editingItem ? "Update Staff User" : "Add Staff User"
                }
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeFormModal}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
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
                <div className="space-y-4">
                    {formError && (
                        <p className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    {formType === "role" ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="role_name" className={labelClass}>
                                        Role Name<span className="ml-1 text-red-500">*</span>
                                    </label>
                                    <input
                                        id="role_name"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm((previous) => ({ ...previous, name: e.target.value }))}
                                        placeholder="Content Editor"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="role_description" className={labelClass}>Description</label>
                                    <input
                                        id="role_description"
                                        value={roleForm.description}
                                        onChange={(e) => setRoleForm((previous) => ({ ...previous, description: e.target.value }))}
                                        placeholder="Manages blogs and banners"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Permission matrix */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className={labelClass}>Permissions</span>

                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#E87722]">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(e) => toggleAll(e.target.checked)}
                                            className="h-4 w-4 accent-[#E87722]"
                                        />
                                        Select All
                                    </label>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2.5 text-left font-semibold text-[#1A1F36]">Module</th>
                                                {ACTIONS.map((action) => (
                                                    <th key={action} className="px-3 py-2.5 text-center font-semibold capitalize text-[#1A1F36]">
                                                        {action}
                                                    </th>
                                                ))}
                                                <th className="px-3 py-2.5 text-center font-semibold text-[#1A1F36]">All</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {modules.map((module) => {
                                                const keys = moduleKeys(module);
                                                const moduleAll = keys.every((key) => roleForm.permissions.includes(key));

                                                return (
                                                    <tr key={module.key} className="border-t border-gray-100">
                                                        <td className="px-3 py-2 whitespace-nowrap font-medium text-[#1A1F36]">
                                                            {module.label}
                                                        </td>

                                                        {ACTIONS.map((action) => (
                                                            <td key={action} className="px-3 py-2 text-center">
                                                                {module.actions.includes(action) ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        aria-label={`${module.label} ${action}`}
                                                                        checked={roleForm.permissions.includes(`${module.key}.${action}`)}
                                                                        onChange={() => togglePermission(module.key, action)}
                                                                        className="h-4 w-4 cursor-pointer accent-[#E87722]"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-300">—</span>
                                                                )}
                                                            </td>
                                                        ))}

                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                aria-label={`${module.label} all`}
                                                                checked={moduleAll}
                                                                onChange={(e) => toggleModule(module, e.target.checked)}
                                                                className="h-4 w-4 cursor-pointer accent-[#001737]"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <p className="mb-0 mt-1.5 text-xs text-[#62748E]">
                                    Create / Edit / Delete automatically include View. Roles & Permissions page is only for Super Admin.
                                </p>
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#1A1F36]">
                                <input
                                    type="checkbox"
                                    checked={roleForm.is_active}
                                    onChange={(e) => setRoleForm((previous) => ({ ...previous, is_active: e.target.checked }))}
                                    className="h-4 w-4 accent-[#E87722]"
                                />
                                Active (inactive role blocks all its staff users)
                            </label>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[
                                { name: "name", label: "Name", placeholder: "Enter name", required: true },
                                { name: "email", label: "Email", type: "email", placeholder: "Enter email", required: true },
                                { name: "phone", label: "Phone", type: "tel", placeholder: "Enter phone", required: true },
                                {
                                    name: "password",
                                    label: "Password",
                                    type: "password",
                                    placeholder: editingItem ? "Leave blank to keep current" : "Min 8 characters",
                                    required: !editingItem,
                                },
                            ].map((field) => (
                                <div key={field.name}>
                                    <label htmlFor={`staff_${field.name}`} className={labelClass}>
                                        {field.label}
                                        {field.required && <span className="ml-1 text-red-500">*</span>}
                                    </label>
                                    <input
                                        id={`staff_${field.name}`}
                                        name={field.name}
                                        type={field.type || "text"}
                                        value={staffForm[field.name]}
                                        onChange={handleStaffChange}
                                        placeholder={field.placeholder}
                                        autoComplete={field.name === "password" ? "new-password" : "off"}
                                        className={inputClass}
                                    />
                                </div>
                            ))}

                            <div>
                                <label htmlFor="staff_role" className={labelClass}>
                                    Role<span className="ml-1 text-red-500">*</span>
                                </label>
                                <select
                                    id="staff_role"
                                    name="admin_role_id"
                                    value={staffForm.admin_role_id}
                                    onChange={handleStaffChange}
                                    className={inputClass}
                                >
                                    <option value="">Select role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}{role.is_active ? "" : " (inactive)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="staff_status" className={labelClass}>Status</label>
                                <select
                                    id="staff_status"
                                    name="status"
                                    value={staffForm.status}
                                    onChange={handleStaffChange}
                                    className={inputClass}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </Tmodal>

            {/* Delete Modal */}
            <Tmodal
                isOpen={Boolean(deleteItem)}
                onClose={() => !deleteLoading && setDeleteItem(null)}
                title={deleteItem?.type === "role" ? "Delete Role" : "Delete Staff User"}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setDeleteItem(null)}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
                        >
                            {deleteLoading ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </button>
                    </div>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">{deleteItem?.item?.name}</span>?
                </p>

                {deleteItem?.type === "staff" && (
                    <p className="mt-1 text-sm text-red-600">
                        This staff user will be logged out and cannot login again.
                    </p>
                )}
            </Tmodal>
        </div>
    );
}
