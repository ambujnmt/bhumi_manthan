"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Spinner, Tooltip, Link, Button } from "@heroui/react";
import { FaPen } from "react-icons/fa";
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

export default function Listing() {
  const can = useAdminPermission();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminPlans();

      setPlans(Array.isArray(res?.data?.plans) ? res.data.plans : []);
    } catch (err) {
      console.error("Failed to fetch plans:", err);

      setPlans([]);
      setError(err?.message || "Unable to load plans.");
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

      {/* Page summary */}
      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1A1F36]">
            Plans List
          </h2>

          <p className="mt-1 text-xs text-[#62748E]">
            Total plans: {plans.length}
          </p>
        </div>

        {can("plans.create") && (
          <Link
            href="/admin/plan/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add Plan</span>
          </Link>
        )}
      </div>

      {/* Plans table */}
      <div className="w-full overflow-auto rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left">Plan</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Price</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Listings</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Features</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Order</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex items-center justify-center py-16">
                    <Spinner size="md" />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={fetchPlans}
                    className="mt-3 rounded-lg bg-[#E87722] px-4 py-2 text-white"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            ) : plans.length > 0 ? (
              plans.map((plan) => (
                <tr key={plan.id} className="border-t transition hover:bg-gray-50">
                  {/* Plan */}
                  <td className="min-w-[200px] px-4 py-3">
                    <p className="font-semibold text-[#1A1F36]">{plan.name || "-"}</p>

                    {plan.description && (
                      <p className="mt-1 max-w-[260px] text-xs text-[#62748E] line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {plan.support_level && (
                      <p className="mt-1 text-xs text-[#283A86]">
                        Support: {plan.support_level}
                      </p>
                    )}
                  </td>

                  {/* Price */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-semibold text-[#1A1F36]">{formatPrice(plan.price)}</p>
                    <p className="mt-1 text-xs text-[#62748E]">
                      {BILLING_LABELS[plan.billing_period] || plan.billing_period}
                    </p>
                  </td>

                  {/* Listings */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-semibold text-[#1A1F36]">{plan.total_listings} total</p>
                    <p className="mt-1 text-xs text-[#62748E]">
                      {plan.paid_listings} paid · {plan.free_listings} free
                    </p>
                  </td>

                  {/* Features */}
                  <td className="min-w-[200px] px-4 py-3">
                    {(() => {
                      const included = featureRows(plan.features, PLAN_FEATURES).filter((row) => row.enabled);

                      return included.length ? (
                        <ul className="list-disc space-y-0.5 pl-4 text-xs text-[#62748E]">
                          {included.slice(0, 3).map((row) => (
                            <li key={row.key}>{row.label}</li>
                          ))}
                          {included.length > 3 && (
                            <li className="list-none text-[#E87722]">
                              +{included.length - 3} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        "-"
                      );
                    })()}
                  </td>

                  {/* Sort order */}
                  <td className="whitespace-nowrap px-4 py-3">{plan.sort_order}</td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plan.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {can("plans.edit") && (
                        <Tooltip content="Update Plan">
                          <Link
                            href={`/admin/plan/update/${plan.id}`}
                            className={actionButtonClass}
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
                            className={actionButtonClass}
                            aria-label={`Delete ${plan.name}`}
                          >
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
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  No plans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
