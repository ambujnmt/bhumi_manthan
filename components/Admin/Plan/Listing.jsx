"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Tooltip, Link, Button } from "@heroui/react";
import { FaCheck, FaHeadset, FaPen, FaPlus } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import PageTitle from "../../Breadcrumb/PageTitle";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { getAdminPlans, deleteAdminPlan } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import Tmodal from "../../Tmodal/Tmodal";
import { PLAN_FEATURES, featureRows } from "../../../utils/planFeatures";

const BILLING_LABELS = {
  year: "/ year",
  month: "/ month",
  one_time: "one time",
};

const formatPrice = (price) =>
  Number(price || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

// Last loaded plans: cards show right away (no loader), fresh data loads in background
const PLANS_CACHE_KEY = "admin_plans";
let plansCache = null;

const readPlansCache = () => {
  if (plansCache) return plansCache;

  try {
    const saved = JSON.parse(sessionStorage.getItem(PLANS_CACHE_KEY));
    if (Array.isArray(saved)) plansCache = saved;
  } catch (e) { }

  return plansCache;
};

const savePlansCache = (plans) => {
  plansCache = plans;

  try {
    sessionStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(plans));
  } catch (e) { }
};

export default function Listing() {
  const can = useAdminPermission();

  const [plans, setPlans] = useState(() => readPlansCache() || []);
  // Placeholder cards only on the very first load (nothing cached yet)
  const [loading, setLoading] = useState(() => !readPlansCache());
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    setError("");

    try {
      const res = await getAdminPlans();
      const list = Array.isArray(res?.data?.plans) ? res.data.plans : [];

      setPlans(list);
      savePlansCache(list);
    } catch (err) {
      console.error("Failed to fetch plans:", err);

      // Keep showing cached cards if the refresh fails
      if (!readPlansCache()) {
        setPlans([]);
        setError(err?.message || "Unable to load plans.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = (plan) => {
    setSelectedPlan(plan);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setIsDeleteModalOpen(false);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!selectedPlan?.id || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const result = await deleteAdminPlan(selectedPlan.id);

      setIsDeleteModalOpen(false);
      setSelectedPlan(null);

      showToast(result?.message);

      await fetchPlans();
    } catch (err) {
      console.error("Failed to delete plan:", err);
      setDeleteError(err?.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageTitle
        breadCrumbItems={[
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "Plans", active: true },
        ]}
        title="Plan Management"
      />

      {/* Add plan */}
      {can("plans.create") && (
        <div className="mt-6 mb-5 flex justify-end">
          <Link
            href="/admin/plan/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
          >
            <FaPlus size={12} />
            <span>Add Plan</span>
          </Link>
        </div>
      )}

      {/* Plans cards */}
      {loading ? (
        <div className={`${can("plans.create") ? "" : "mt-6"} grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3`}>
          {[1, 2, 3].map((key) => (
            <div key={key} className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-1.5 bg-gray-200" />
              <div className="p-6">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
                <div className="mt-6 h-9 w-1/2 rounded bg-gray-200" />
                <div className="mt-6 h-16 rounded-xl bg-gray-100" />
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                  <div className="h-3 w-3/5 rounded bg-gray-100" />
                  <div className="h-3 w-2/3 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl bg-white px-4 py-10 text-center text-red-600 shadow-sm">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchPlans}
            className="mt-3 rounded-lg bg-[#E87722] px-4 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      ) : plans.length > 0 ? (
        <div className={`${can("plans.create") ? "" : "mt-6"} grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3`}>
          {plans.map((plan) => {
            const included = featureRows(plan.features, PLAN_FEATURES).filter((row) => row.enabled);

            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl ${plan.is_active ? "border-gray-100" : "border-gray-100 opacity-75"}`}
              >
                {/* Top accent */}
                <div className={`h-1.5 ${plan.is_active ? "bg-gradient-to-r from-[#E87722] to-[#f5a35c]" : "bg-gray-300"}`} />

                <div className="flex flex-1 flex-col p-6">
                  {/* Name + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-[#1A1F36]">
                        {plan.name || "-"}
                      </h3>

                      {plan.support_level && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#283A86]">
                          <FaHeadset size={11} />
                          {plan.support_level} support
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${plan.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${plan.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-end gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-[#1A1F36]">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="pb-1 text-sm text-[#62748E]">
                      {BILLING_LABELS[plan.billing_period] || plan.billing_period}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[#62748E] line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Listings */}
                  <div className="mt-5 grid grid-cols-3 divide-x divide-orange-100 rounded-xl bg-orange-50/60 py-3 text-center">
                    {[
                      ["Total", plan.total_listings],
                      ["Paid", plan.paid_listings],
                      ["Free", plan.free_listings],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-lg font-bold text-[#E87722]">{value ?? 0}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#62748E]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="mt-5 flex-1">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#62748E]">
                      What's included
                    </p>

                    {included.length ? (
                      <ul className="space-y-2.5 text-sm text-[#1A1F36]">
                        {included.slice(0, 5).map((row) => (
                          <li key={row.key} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <FaCheck size={8} />
                            </span>
                            <span>{row.label}</span>
                          </li>
                        ))}
                        {included.length > 5 && (
                          <li className="pl-6 text-xs font-medium text-[#E87722]">
                            +{included.length - 5} more features
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#62748E]">No features added</p>
                    )}
                  </div>
                </div>

                {/* Footer: order + actions */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-6 py-3">
                  <span className="text-xs text-[#62748E]">
                    Display order <span className="ml-1 rounded-md bg-white px-2 py-0.5 font-semibold text-[#1A1F36] shadow-sm">{plan.sort_order}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {can("plans.edit") && (
                      <Tooltip content="Update Plan">
                        <Link
                          href={`/admin/plan/update/${plan.id}`}
                          className={`${actionButtonClass} bg-white`}
                          aria-label={`Edit ${plan.name}`}
                        >
                          <FaPen size={13} />
                        </Link>
                      </Tooltip>
                    )}

                    {can("plans.delete") && (
                      <Tooltip content="Delete Plan">
                        <button
                          type="button"
                          onClick={() => handleDelete(plan)}
                          className={`${actionButtonClass} bg-white`}
                          aria-label={`Delete ${plan.name}`}
                        >
                          <FaRegTrashCan size={14} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-14 text-center">
          <p className="text-base font-semibold text-[#1A1F36]">No plans yet</p>
          <p className="mt-1 text-sm text-[#62748E]">Create your first plan to show it here.</p>
        </div>
      )}

      <Tmodal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Plan"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="bordered" onPress={closeDeleteModal} isDisabled={deleting}>
              Cancel
            </Button>

            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={deleting}
              isDisabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Plan"}
            </Button>
          </div>
        }
      >
        <div className="py-1">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{selectedPlan?.name}</span>?
          </p>

          <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>

          {deleteError && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {deleteError}
            </p>
          )}
        </div>
      </Tmodal>
    </div>
  );
}
