"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { actionButtonClass, dangerActionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import PageTitle from "../../Breadcrumb/PageTitle";
import { Link, Spinner } from "@heroui/react";
import { getUsers, deleteUser, permanentDeleteUser, getAdminRoles, saveAdminStaff, updateUser, getBuyerCities, downloadBuyersCsv } from "../../../utils/adminFetchApi";
import { showToast } from "../../../store/toast";
import { AiOutlineEye } from "react-icons/ai";
import Pagination from "../../Pagination/Pagination";
import { FaPen, FaUserShield } from "react-icons/fa";
import { FiCheck, FiDownload, FiMapPin, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { Tooltip } from "@heroui/react";
import { FaRegTrashCan } from "react-icons/fa6";
import Tmodal from "../../Tmodal/Tmodal";
import DetailModal from "./DetailModal";
import UserUpdate from "./Update";

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
    const [editUser, setEditUser] = useState(null); // Edit user in a modal (Customers + Seller / Broker / Staff tabs)
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
    // customers / team tab: from the URL (?tab=team), so the sidebar links open the right tab
    const router = useRouter();
    const urlTab = router.query.tab === "team" ? "team" : USER_TABS[0].key;
    const [tab, setTab] = useState(urlTab);
    const activeTab = USER_TABS.find((item) => item.key === tab) || USER_TABS[0];

    useEffect(() => {
        setTab(urlTab);
        setPageIndex(0);
    }, [urlTab]);

    // Download buyers (customers) as CSV: all, one city, or one buyer (row icon)
    const [buyerModalOpen, setBuyerModalOpen] = useState(false);
    const [buyerScope, setBuyerScope] = useState("all");
    const [buyerCity, setBuyerCity] = useState("");
    const [buyerCitySearch, setBuyerCitySearch] = useState("");
    const [buyerId, setBuyerId] = useState("");
    const [buyerSearch, setBuyerSearch] = useState("");
    const [buyerCities, setBuyerCities] = useState([]);
    const [buyerCitiesLoading, setBuyerCitiesLoading] = useState(false);
    const [buyerDownloading, setBuyerDownloading] = useState(false);
    const [downloadingBuyerId, setDownloadingBuyerId] = useState(null);

    const openBuyerModal = async () => {
        setBuyerScope("all");
        setBuyerCity("");
        setBuyerCitySearch("");
        setBuyerId("");
        setBuyerSearch("");
        setBuyerModalOpen(true);
        setBuyerCitiesLoading(true);

        try {
            const res = await getBuyerCities();
            setBuyerCities(res?.data?.cities || []);
        } catch (error) {
            setBuyerCities([]);
            showToast(error?.message || "Failed to load cities.", "error");
        } finally {
            setBuyerCitiesLoading(false);
        }
    };

    const handleBuyerDownload = async () => {
        if (buyerScope === "city" && !buyerCity) {
            showToast("Please select a city.", "error");
            return;
        }

        if (buyerScope === "one" && !buyerId) {
            showToast("Please select a buyer.", "error");
            return;
        }

        setBuyerDownloading(true);

        try {
            const fileName = await downloadBuyersCsv(
                buyerScope === "city" ? { city: buyerCity } : buyerScope === "one" ? { user_id: buyerId } : {}
            );
            showToast(`Downloaded ${fileName}`);
            setBuyerModalOpen(false);
        } catch (error) {
            showToast(error?.message || "Download failed. Please try again.", "error");
        } finally {
            setBuyerDownloading(false);
        }
    };

    const downloadOneBuyer = async (user) => {
        setDownloadingBuyerId(user.id);

        try {
            const fileName = await downloadBuyersCsv({ user_id: user.id });
            showToast(`Downloaded ${fileName}`);
        } catch (error) {
            showToast(error?.message || "Download failed. Please try again.", "error");
        } finally {
            setDownloadingBuyerId(null);
        }
    };

    const changeTab = (key) => {
        setTab(key);
        setPageIndex(0);

        // Keep the URL in sync (sidebar shows the matching menu item as active)
        const basePath = router.asPath.split(/[?#]/)[0];
        router.replace(key === "team" ? `${basePath}?tab=team` : basePath, undefined, { shallow: true });
    };

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
            <div className="scrollbar-hide mt-6 flex gap-1 overflow-x-auto border-b border-gray-200">
                {USER_TABS.map((item) => {
                    const count = (Array.isArray(users) ? users : []).filter(item.match).length;
                    const isActive = item.key === tab;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => changeTab(item.key)}
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
                {!showDeleted && tab === "customers" && (
                    <button
                        type="button"
                        onClick={openBuyerModal}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#001737] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#283A86]"
                    >
                        <FiDownload size={15} />
                        Download Buyers
                    </button>
                )}

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
                                            <td className="px-4 py-2.5 whitespace-nowrap text-[#62748E]">
                                                <p className="mb-0">{user.phone || "-"}</p>
                                                {user.city && <p className="mb-0 mt-0.5 text-xs">{user.city}</p>}
                                            </td>
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

                                                {/* Download this buyer's data (CSV) */}
                                                {!showDeleted && user.role === "customer" && (
                                                    <Tooltip content="Download Buyer Data (CSV)">
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadOneBuyer(user)}
                                                            disabled={downloadingBuyerId === user.id}
                                                            aria-label={`Download data of ${user.name || user.email}`}
                                                            className={actionButtonClass}
                                                        >
                                                            {downloadingBuyerId === user.id ? <Spinner size="sm" /> : <FiDownload size={15} />}
                                                        </button>
                                                    </Tooltip>
                                                )}

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
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditUser(user)}
                                                                aria-label={`Update ${user.name || user.email}`}
                                                                className={actionButtonClass}
                                                            >
                                                                <FaPen size={13} />
                                                            </button>
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

            {/* Edit User Modal (both tabs) */}
            <Tmodal
                isOpen={Boolean(editUser)}
                onClose={() => setEditUser(null)}
                size="4xl"
                title={editUser ? `Update ${editUser.name || editUser.email}` : "Update User"}
            >
                {editUser && (
                    <UserUpdate
                        key={editUser.id}
                        userId={editUser.id}
                        inModal
                        onCancel={() => setEditUser(null)}
                        onSaved={(saved) => {
                            if (saved) setUsers((prev) => prev.map((u) => (u.id === saved.id ? { ...u, ...saved } : u)));
                            setEditUser(null);
                        }}
                    />
                )}
            </Tmodal>

            {/* Download Buyers Modal */}
            <Tmodal
                isOpen={buyerModalOpen}
                onClose={() => !buyerDownloading && setBuyerModalOpen(false)}
                size="lg"
                title="Download Buyers Data"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setBuyerModalOpen(false)}
                            disabled={buyerDownloading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyerDownload}
                            disabled={buyerDownloading || (buyerScope === "city" && !buyerCity) || (buyerScope === "one" && !buyerId)}
                            className="flex items-center gap-2 rounded-lg bg-[rgb(232,119,34)] px-4 py-2 text-white disabled:opacity-60"
                        >
                            {buyerDownloading ? <Spinner size="sm" color="white" /> : <FiDownload size={15} />}
                            {buyerDownloading ? "Preparing..." : "Download CSV"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-3">
                    {[
                        { value: "all", title: "All buyers", text: "Every customer account (deleted users not included)." },
                        { value: "city", title: "Buyers of one city", text: "Profile city, or property they wishlisted, viewed or enquired in that city." },
                        { value: "one", title: "One buyer", text: "Search a buyer by name, email or phone." },
                    ].map((option) => (
                        <label
                            key={option.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                buyerScope === option.value ? "border-[#E87722] bg-orange-50/60" : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <input
                                type="radio"
                                name="buyer_scope"
                                value={option.value}
                                checked={buyerScope === option.value}
                                onChange={() => setBuyerScope(option.value)}
                                className="mt-1 h-4 w-4 accent-[#E87722]"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-[#1A1F36]">{option.title}</span>
                                <span className="block text-xs text-[#62748E]">{option.text}</span>
                            </span>
                        </label>
                    ))}

                    {buyerScope === "city" && (() => {
                        const term = buyerCitySearch.trim().toLowerCase();
                        const cities = buyerCities.filter((item) => !term || item.city.toLowerCase().includes(term));
                        const selectedCity = buyerCities.find((item) => item.city === buyerCity);

                        return (
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="buyer_city_search" className={labelClass}>
                                        City<span className="ml-1 text-red-500">*</span>
                                    </label>
                                    {!buyerCitiesLoading && (
                                        <span className="text-xs text-[#62748E]">
                                            {cities.length} {cities.length === 1 ? "city" : "cities"}
                                        </span>
                                    )}
                                </div>

                                {/* Search */}
                                <div className="relative mt-1.5">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                                    <input
                                        id="buyer_city_search"
                                        value={buyerCitySearch}
                                        onChange={(e) => setBuyerCitySearch(e.target.value)}
                                        placeholder="Search city..."
                                        autoComplete="off"
                                        disabled={buyerCitiesLoading}
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                                    />
                                    {buyerCitySearch && (
                                        <button
                                            type="button"
                                            onClick={() => setBuyerCitySearch("")}
                                            aria-label="Clear city search"
                                            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#94A3B8] hover:bg-gray-100 hover:text-[#1A1F36]"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* City list */}
                                <div
                                    role="listbox"
                                    aria-label="Select city"
                                    className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1"
                                >
                                    {buyerCitiesLoading ? (
                                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#62748E]">
                                            <Spinner size="sm" /> Loading cities...
                                        </div>
                                    ) : buyerCities.length === 0 ? (
                                        <p className="mb-0 px-3 py-6 text-center text-sm text-[#62748E]">No buyer has a city yet.</p>
                                    ) : cities.length === 0 ? (
                                        <p className="mb-0 px-3 py-6 text-center text-sm text-[#62748E]">No city matches your search.</p>
                                    ) : (
                                        cities.map((item) => {
                                            const selected = item.city === buyerCity;

                                            return (
                                                <button
                                                    key={item.city}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selected}
                                                    onClick={() => setBuyerCity(item.city)}
                                                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${
                                                        selected ? "bg-orange-50 ring-1 ring-[#E87722]" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                            selected ? "bg-[#E87722] text-white" : "bg-orange-100 text-[#E87722]"
                                                        }`}
                                                    >
                                                        <FiMapPin size={16} />
                                                    </span>

                                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1A1F36]">
                                                        {item.city}
                                                    </span>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                            selected ? "bg-[#E87722] text-white" : "bg-gray-100 text-[#283A86]"
                                                        }`}
                                                    >
                                                        {item.buyers} {item.buyers === 1 ? "buyer" : "buyers"}
                                                    </span>

                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                            selected ? "border-[#E87722] bg-[#E87722] text-white" : "border-gray-300"
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        {selected && <FiCheck size={12} />}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Selected city summary */}
                                {selectedCity && (
                                    <p className="mb-0 mt-2 flex items-center gap-1.5 text-xs text-[#62748E]">
                                        <FiCheck className="text-[#E87722]" size={13} />
                                        Selected: <span className="font-semibold text-[#1A1F36]">{selectedCity.city}</span>
                                        · {selectedCity.buyers} {selectedCity.buyers === 1 ? "buyer" : "buyers"} will be downloaded
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {buyerScope === "one" && (() => {
                        const term = buyerSearch.trim().toLowerCase();
                        const buyers = (Array.isArray(users) ? users : [])
                            .filter((u) => u?.role === "customer" && !u?.is_deleted)
                            .filter((u) => !term || [u.name, u.email, u.phone, u.city].some((v) => String(v || "").toLowerCase().includes(term)));

                        const selectedBuyer = (Array.isArray(users) ? users : []).find((u) => String(u.id) === buyerId);

                        return (
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="buyer_search" className={labelClass}>
                                        Buyer<span className="ml-1 text-red-500">*</span>
                                    </label>
                                    <span className="text-xs text-[#62748E]">
                                        {buyers.length} {buyers.length === 1 ? "buyer" : "buyers"}
                                    </span>
                                </div>

                                {/* Search */}
                                <div className="relative mt-1.5">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                                    <input
                                        id="buyer_search"
                                        value={buyerSearch}
                                        onChange={(e) => setBuyerSearch(e.target.value)}
                                        placeholder="Search name, email, phone or city..."
                                        autoComplete="off"
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100"
                                    />
                                    {buyerSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setBuyerSearch("")}
                                            aria-label="Clear search"
                                            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#94A3B8] hover:bg-gray-100 hover:text-[#1A1F36]"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Buyer list */}
                                <div
                                    role="listbox"
                                    aria-label="Select buyer"
                                    className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1"
                                >
                                    {buyers.length === 0 ? (
                                        <p className="mb-0 px-3 py-6 text-center text-sm text-[#62748E]">No buyer matches your search.</p>
                                    ) : (
                                        buyers.map((u) => {
                                            const selected = String(u.id) === buyerId;

                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selected}
                                                    onClick={() => setBuyerId(String(u.id))}
                                                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${
                                                        selected ? "bg-orange-50 ring-1 ring-[#E87722]" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${
                                                            selected ? "bg-[#E87722] text-white" : "bg-orange-100 text-[#E87722]"
                                                        }`}
                                                    >
                                                        {(u.name || u.email || "?").trim().charAt(0)}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-semibold text-[#1A1F36]">{u.name || "-"}</span>
                                                        <span className="block truncate text-xs text-[#62748E]">
                                                            {[u.email, u.phone].filter(Boolean).join(" · ") || "-"}
                                                        </span>
                                                    </span>

                                                    {u.city && (
                                                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-[#283A86] sm:flex">
                                                            <FiMapPin size={10} /> {u.city}
                                                        </span>
                                                    )}

                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                            selected ? "border-[#E87722] bg-[#E87722] text-white" : "border-gray-300"
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        {selected && <FiCheck size={12} />}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Selected buyer summary */}
                                {selectedBuyer && (
                                    <p className="mb-0 mt-2 flex items-center gap-1.5 text-xs text-[#62748E]">
                                        <FiCheck className="text-[#E87722]" size={13} />
                                        Selected: <span className="font-semibold text-[#1A1F36]">{selectedBuyer.name || selectedBuyer.email}</span>
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    <p className="mb-0 text-xs text-[#62748E]">
                        CSV opens in Excel / Google Sheets. You can also use the download icon in a buyer&apos;s row.
                    </p>
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
