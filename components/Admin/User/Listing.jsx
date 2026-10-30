"use client";

import React, { useEffect, useMemo, useState } from "react";
import { actionButtonClass, dangerActionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Link, Spinner } from "@heroui/react";
import { getUsers, deleteUser, permanentDeleteUser, getAdminRoles, saveAdminStaff, updateUser } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { AiOutlineEye } from "react-icons/ai";
import Pagination from "../../Pagination/Pagination";
import { FaPen, FaUserShield } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { Tooltip } from "@heroui/react";
import { FaRegTrashCan } from "react-icons/fa6";
import Tmodal from "../../Tmodal/Tmodal";
import DetailModal from "./DetailModal";

// Roles that can get admin panel access through an admin role
const PANEL_ROLES = ["staff", "seller", "broker"];

const USER_ROLES = [
    { value: "customer", label: "Customer" },
    { value: "seller", label: "Seller" },
    { value: "broker", label: "Broker" },
    { value: "staff", label: "Staff (Admin Panel)" },
];

// Tabs: customers alone, everyone else (broker / seller / staff / admin) together
const USER_TABS = [
    { key: "customers", label: "Customers", match: (u) => u?.role === "customer" },
    { key: "team", label: "Broker / Seller / Staff", match: (u) => u?.role !== "customer" },
];

const initialStaffForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    admin_role_id: "",
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "block text-sm font-medium text-[#283A86]";

export default function Listing() {
    const can = useAdminPermission();

    // Roles & Permissions (assign role / add staff) - super admin only
    const { user: loggedInUser } = useUser();
    const isSuperAdmin = loggedInUser?.role === "super_admin";
    const [adminRoles, setAdminRoles] = useState([]);

    const [roleUser, setRoleUser] = useState(null);
    const [viewUser, setViewUser] = useState(null); // View -> detail modal
    const [roleForm, setRoleForm] = useState({ role: "customer", admin_role_id: "" });
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [staffForm, setStaffForm] = useState(initialStaffForm);
    const [modalError, setModalError] = useState("");
    const [modalSaving, setModalSaving] = useState(false);

    useEffect(() => {
        if (!isSuperAdmin) return;

        getAdminRoles()
            .then((res) => {
                setAdminRoles(res?.data?.roles || []);
            })
            .catch(() => setAdminRoles([]));
    }, [isSuperAdmin]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);
const [deleteLoading, setDeleteLoading] = useState(false);
    // deleted users toggle
    const [showDeleted, setShowDeleted] = useState(false);
    // search
    const [search, setSearch] = useState("");
    // customers / team tab
    const [tab, setTab] = useState(USER_TABS[0].key);
    const activeTab = USER_TABS.find((item) => item.key === tab) || USER_TABS[0];

    // pagination state
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

useEffect(() => {
    const fetchUsers = async () => {
        setLoading(true);

        try {
            const res = await getUsers(showDeleted);

            console.log("Users API Response:", res);

            if (res?.status && Array.isArray(res?.data?.users)) {
                setUsers(res.data.users);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    fetchUsers();
}, [showDeleted]);

    // 🔎 SEARCH FILTER
const filteredUsers = useMemo(() => {
    const userList = (Array.isArray(users) ? users : []).filter(activeTab.match);

    if (!search) return userList;

    return userList.filter((u) =>
        `${u?.name ?? ""} ${u?.email ?? ""} ${u?.role ?? ""} ${u?.admin_role ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );
}, [users, search, activeTab]);

    // 📄 PAGINATION CALC
    const pageCount = Math.ceil(filteredUsers.length / pageSize);

    const currentPageUsers = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, pageIndex, pageSize]);

    // 👇 Adapter for your Pagination component
    const tableProps = {
        pageCount,
        pageOptions: Array.from({ length: pageCount }),
        state: { pageIndex, pageSize },

        gotoPage: (page) => setPageIndex(page),
        setPageSize: (size) => {
            setPageSize(size);
            setPageIndex(0);
        }
    };

    const sizePerPageList = [
        { text: "10", value: 10 },
        { text: "25", value: 25 },
        { text: "50", value: 50 },
    ];


    const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
};

const handleDeleteConfirm = async () => {
    if (!selectedUser?.id) return;

    setDeleteLoading(true);

    try {
        const res = showDeleted
            ? await permanentDeleteUser(selectedUser.id)
            : await deleteUser(selectedUser.id);

        if (res?.status) {
            setDeleteModalOpen(false);
            setSelectedUser(null);

            showToast(res.message || "User deleted successfully.");

            // Remove soft deleted user from list
            setUsers((prev) =>
                prev.filter((u) => u.id !== selectedUser.id)
            );
        } else {
            showToast(res?.message || "Failed to delete user.", "error");
        }
    } catch (error) {
        console.error("Failed to delete user:", error);
        showToast(error?.message || "Something went wrong while deleting the user.", "error");
    } finally {
        setDeleteLoading(false);
    }
};

    /* =======================================================
       ASSIGN ROLE (customer / seller / broker / staff + admin role)
    ======================================================= */

    const openRoleModal = (user) => {
        setRoleUser(user);
        setRoleForm({
            role: user.role || "customer",
            admin_role_id: user.admin_role_id ? String(user.admin_role_id) : "",
        });
        setModalError("");
    };

    const handleRoleSave = async () => {
        if (roleForm.role === "staff" && !roleForm.admin_role_id) {
            setModalError("Please select an admin role for staff.");
            return;
        }

        setModalSaving(true);
        setModalError("");

        try {
            const payload = new FormData();
            payload.append("role", roleForm.role);

            // Admin role for staff / seller / broker (empty = no admin access)
            if (PANEL_ROLES.includes(roleForm.role)) {
                payload.append("admin_role_id", roleForm.admin_role_id || "");
            }

            const res = await updateUser(roleUser.id, payload);

            if (!res?.status) {
                const errors = res?.errors ? Object.values(res.errors).flat().join(" ") : "";
                throw new Error(errors || res?.message || "Failed to update role.");
            }

            setUsers((prev) => prev.map((u) => (u.id === roleUser.id ? { ...u, ...res.data.user } : u)));
            showToast(res.message || "Role updated successfully.");
            setRoleUser(null);
        } catch (error) {
            setModalError(error?.message || "Something went wrong.");
        } finally {
            setModalSaving(false);
        }
    };

    /* =======================================================
       ADD STAFF USER
    ======================================================= */

    const openStaffModal = () => {
        setStaffForm({ ...initialStaffForm, admin_role_id: adminRoles[0] ? String(adminRoles[0].id) : "" });
        setModalError("");
        setStaffModalOpen(true);
    };

    const handleStaffSave = async () => {
        setModalSaving(true);
        setModalError("");

        try {
            const res = await saveAdminStaff({ ...staffForm, admin_role_id: Number(staffForm.admin_role_id) || "" });
            const staff = res.data.staff;

            setUsers((prev) => [
                { ...staff, role: "staff", admin_role: staff.admin_role?.name, is_verified: true },
                ...prev,
            ]);
            showToast(res.message || "Staff user created successfully.");
            setStaffModalOpen(false);
        } catch (error) {
            setModalError(error?.message || "Something went wrong.");
        } finally {
            setModalSaving(false);
        }
    };

    const colCount = 5;


    const modalFooter = (onCancel, onSave) => (
        <div className="flex gap-3">
            <button
                type="button"
                onClick={onCancel}
                disabled={modalSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
            >
                Cancel
            </button>

            <button
                type="button"
                onClick={onSave}
                disabled={modalSaving}
                className="px-4 py-2 rounded-lg bg-[rgb(232,119,34)] text-white flex items-center gap-2"
            >
                {modalSaving ? (
                    <>
                        <Spinner size="sm" color="white" />
                        Saving...
                    </>
                ) : (
                    "Save"
                )}
            </button>
        </div>
    );

    // required: staff must have a role, seller / broker can stay "not assigned"
    const adminRoleSelect = (value, onChange, required = true) => (
        <div>
            <label htmlFor="admin_role_id" className={labelClass}>
                Admin Role (Dashboard Access){required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <select id="admin_role_id" value={value} onChange={onChange} className={inputClass}>
                <option value="">{required ? "Select admin role" : "Not assigned (dashboard locked)"}</option>
                {adminRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                        {role.name}{role.is_active ? "" : " (inactive)"}
                    </option>
                ))}
            </select>
            <p className="mb-0 mt-1 text-xs text-[#62748E]">
                {adminRoles.length === 0 ? (
                    <>
                        No admin role yet.{" "}
                        <Link href="/admin/role/roleList" className="text-xs text-[#E87722]">
                            Create one in Roles & Permissions
                        </Link>
                    </>
                ) : (
                    "Dashboard and menu will open as per this role's permissions."
                )}
            </p>
        </div>
    );

    return (
        <div >
            <PageTitle
                breadCrumbItems={[
                    { label: "Dashboard", path: "/admin/dashboard" },
                    { label: "User", active: true },
                ]}
                title="User Management"
            />

            {/* Tabs */}
            <div className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200">
                {USER_TABS.map((item) => {
                    const count = (Array.isArray(users) ? users : []).filter(item.match).length;
                    const isActive = item.key === tab;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                                setTab(item.key);
                                setPageIndex(0);
                            }}
                            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                                isActive
                                    ? "border-[#E87722] text-[#E87722]"
                                    : "border-transparent text-[#62748E] hover:text-[#1A1F36]"
                            }`}
                        >
                            {item.label}
                            {!loading && (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? "bg-orange-100 text-[#E87722]" : "bg-gray-100 text-[#62748E]"}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="mt-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPageIndex(0);
                    }}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#E87722] sm:w-72"
                />

                <div className="flex flex-wrap gap-2">
                {isSuperAdmin && !showDeleted && tab === "team" && (
                    <button
                        type="button"
                        onClick={openStaffModal}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
                    >
                        <FiPlus size={16} />
                        Add Staff User
                    </button>
                )}

                {/* Deleted Users Toggle */}
                <button
                    type="button"
                    onClick={() => {
                        setShowDeleted((prev) => !prev);
                        setSearch("");
                        setPageIndex(0);
                    }}
                    className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition
                    ${showDeleted
                            ? "bg-[#E87722] text-white hover:bg-[#d96818]"
                            : "border border-[#E87722] text-[#E87722] hover:bg-orange-50"
                        }`}
                >
                    <FaRegTrashCan size={14} />
                    {showDeleted ? "Show Active Users" : "Show Deleted Users"}
                </button>
                </div>
            </div>

            <div className="w-full bg-white rounded-xl shadow overflow-auto">

                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {/* w-full: Name / Email takes the extra width */}
                            <th className="px-4 py-3 text-left whitespace-nowrap w-full">Name / Email</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Phone</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Role</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-left whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    {loading ? (
                        <tbody>
                            <tr>
                                <td colSpan={colCount}>
                                    <div className="flex justify-center items-center py-16">
                                        <Spinner size="md" />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <>
                            <tbody>
                                {currentPageUsers.length > 0 ? (
                                    currentPageUsers.map((user, index) => (
                                        <tr key={user.id} className="border-t align-middle hover:bg-gray-50">

                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    {/* First letter avatar */}
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                                                        {(user.name || user.email || "?").trim().charAt(0)}
                                                    </span>
                                                    <div className="min-w-0 leading-tight">
                                                        <p className="mb-0 font-medium text-[#1A1F36]">{user.name || "-"}</p>
                                                        <p className="mb-0 mt-0.5 max-w-[280px] truncate text-xs text-[#62748E]" title={user.email}>
                                                            {user.email || "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap text-[#62748E]">{user.phone || "-"}</td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${
                                                            user.role === "staff" ? "bg-[#001737] text-white" : "bg-gray-100 text-[#1A1F36]"
                                                        }`}
                                                    >
                                                        {user.role?.replace(/_/g, " ") || "-"}
                                                    </span>

                                                    {/* Admin role (staff / seller / broker) */}
                                                    {user.admin_role && (
                                                        <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#E87722]">
                                                            <FaUserShield size={11} />
                                                            {user.admin_role}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* ✅ STATUS BADGE */}
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                ${user.status === "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : user.status === "inactive"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-gray-100 text-gray-600"
                                                        }
            `}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">

                                                {/* 👁 View User */}
                                                <Tooltip content="View User Detail">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewUser(user)}
                                                        className={actionButtonClass}
                                                    >
                                                        <AiOutlineEye size={18} />
                                                    </button>
                                                </Tooltip>

                                                {showDeleted ? (
                                                    can('users.delete') && (
                                                    <Tooltip content="Permanently Delete User">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteClick(user)}
                                                            className={dangerActionButtonClass}
                                                        >
                                                            <FaRegTrashCan size={14} />
                                                        </button>
                                                    </Tooltip>
                                                    )
                                                ) : (
                                                    <>
                                                        {isSuperAdmin && (
                                                        <Tooltip content="Assign Role & Permissions">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRoleModal(user)}
                                                                className={actionButtonClass}
                                                            >
                                                                <FaUserShield size={14} />
                                                            </button>
                                                        </Tooltip>
                                                        )}

                                                        {can('users.edit') && (
                                                        <Tooltip content="Update User">
                                                            <Link
                                                                href={`/admin/user/userUpdate/${user.id}`}
                                                                className={actionButtonClass}
                                                            >
                                                                <FaPen size={13} />
                                                            </Link>
                                                        </Tooltip>
                                                        )}

                                                        {can('users.delete') && (
                                                        <Tooltip content="Delete User">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteClick(user)}
                                                                className={actionButtonClass}
                                                            >
                                                                <FaRegTrashCan size={14} />
                                                            </button>
                                                        </Tooltip>
                                                        )}
                                                    </>
                                                )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={colCount} className="text-center py-6 text-gray-500">
                                            {showDeleted
                                                ? `No deleted ${tab === "customers" ? "customers" : "broker / seller / staff"} found`
                                                : `No ${tab === "customers" ? "customers" : "broker / seller / staff"} found`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </>
                    )}

                </table>

                {/* PAGINATION */}
                <div className="p-3 border-t">
                    <Pagination
                        tableProps={tableProps}
                        sizePerPageList={sizePerPageList}
                    />
                </div>


            </div>

            {/* View User Modal */}
            <DetailModal user={viewUser} onClose={() => setViewUser(null)} />

            {/* Assign Role Modal */}
            <Tmodal
                isOpen={Boolean(roleUser)}
                onClose={() => !modalSaving && setRoleUser(null)}
                title="Assign Role & Permissions"
                footer={modalFooter(() => setRoleUser(null), handleRoleSave)}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold uppercase text-[#E87722]">
                            {(roleUser?.name || roleUser?.email || "?").trim().charAt(0)}
                        </span>
                        <div className="min-w-0 leading-tight">
                            <p className="mb-0 truncate text-sm font-semibold text-[#1A1F36]">{roleUser?.name}</p>
                            <p className="mb-0 truncate text-xs text-[#62748E]">{roleUser?.email}</p>
                        </div>
                    </div>

                    {modalError && (
                        <p className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {modalError}
                        </p>
                    )}

                    <div>
                        <label htmlFor="assign_role" className={labelClass}>Role</label>
                        <select
                            id="assign_role"
                            value={roleForm.role}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, role: e.target.value }))}
                            className={inputClass}
                        >
                            {USER_ROLES.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {PANEL_ROLES.includes(roleForm.role) &&
                        adminRoleSelect(
                            roleForm.admin_role_id,
                            (e) => setRoleForm((prev) => ({ ...prev, admin_role_id: e.target.value })),
                            roleForm.role === "staff"
                        )}

                    {roleForm.role === "customer" && (
                        <p className="mb-0 text-xs text-[#62748E]">
                            Customer does not get admin dashboard access.
                        </p>
                    )}

                    {(roleForm.role !== roleUser?.role || String(roleForm.admin_role_id || "") !== String(roleUser?.admin_role_id || "")) && (
                        <p className="mb-0 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-[#9a4a10]">
                            User stays logged in. The new dashboard and menus open on their next page refresh.
                        </p>
                    )}
                </div>
            </Tmodal>

            {/* Add Staff Modal */}
            <Tmodal
                isOpen={staffModalOpen}
                onClose={() => !modalSaving && setStaffModalOpen(false)}
                size="lg"
                title="Add Staff User"
                footer={modalFooter(() => setStaffModalOpen(false), handleStaffSave)}
            >
                <div className="space-y-4">
                    {modalError && (
                        <p className="mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {modalError}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                            { name: "name", label: "Name", placeholder: "Enter name" },
                            { name: "email", label: "Email", type: "email", placeholder: "Enter email" },
                            { name: "phone", label: "Phone", type: "tel", placeholder: "Enter phone" },
                            { name: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
                        ].map((field) => (
                            <div key={field.name}>
                                <label htmlFor={`new_staff_${field.name}`} className={labelClass}>
                                    {field.label}<span className="ml-1 text-red-500">*</span>
                                </label>
                                <input
                                    id={`new_staff_${field.name}`}
                                    type={field.type || "text"}
                                    value={staffForm[field.name]}
                                    onChange={(e) => setStaffForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    autoComplete={field.name === "password" ? "new-password" : "off"}
                                    className={inputClass}
                                />
                            </div>
                        ))}
                    </div>

                    {adminRoleSelect(staffForm.admin_role_id, (e) =>
                        setStaffForm((prev) => ({ ...prev, admin_role_id: e.target.value }))
                    )}
                </div>
            </Tmodal>

            <Tmodal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteModalOpen(false);
                        setSelectedUser(null);
                    }
                }}
                title={showDeleted ? "Permanently Delete User" : "Delete User"}
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setSelectedUser(null);
                            }}
                            disabled={deleteLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2
                            ${showDeleted ? "bg-red-600" : "bg-[rgb(232,119,34)]"}`}
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
                    Are you sure you want to {showDeleted ? "permanently delete" : "delete"}{" "}
                    <span className="font-semibold text-gray-900">
                        {selectedUser?.name}
                    </span>
                    ?
                </p>

                {showDeleted && (
                    <p className="mt-3 text-sm text-red-600">
                        This cannot be undone. The user and all related data
                        (properties, images, login sessions, OTPs) will be removed.
                    </p>
                )}
            </Tmodal>
        </div>
    );
      
}
