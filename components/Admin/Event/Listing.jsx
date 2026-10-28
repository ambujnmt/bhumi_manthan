
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Spinner, Tooltip, Link, Button } from "@heroui/react";
import { FaEye, FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { MdLocationOn } from "react-icons/md";
import PageTitle from "../../Breadcrumb/PageTitle";
import { actionButtonClass } from "../actionButtonClass";
import { useAdminPermission } from "../../../utils/adminPermissions";
import { getAdminEvents, deleteAdminEvent } from "../../../utils/fetchApi";
import { showToast } from "../../../store/toast";
import Tmodal from "../../Tmodal/Tmodal";

export default function Listing() {
  const can = useAdminPermission();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  // Fetch events
  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminEvents(page);

      const paginationData = res?.data;

      setEvents(
        Array.isArray(paginationData?.data)
          ? paginationData.data
          : []
      );

      setCurrentPage(paginationData?.current_page ?? page);
      setLastPage(paginationData?.last_page ?? 1);
      setTotalEvents(paginationData?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch events:", err);

      setEvents([]);
      setError(err?.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return "-";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Edit action - connect when the update API is provided
  const handleEdit = (event) => {
    showToast(
      `Edit API is not connected yet for "${event.title}".`
    );
  };

  // Delete action - connect when the delete API is provided
  const handleDelete = (event) => {
    setSelectedEvent(event);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent?.id || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const result = await deleteAdminEvent(selectedEvent.id);

      setIsDeleteModalOpen(false);
      setSelectedEvent(null);

      showToast(result?.message);

      // Refresh the current page after successful deletion.
      await fetchEvents(currentPage);
    } catch (err) {
      console.error("Failed to delete event:", err);
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
          { label: "Events", active: true },
        ]}
        title="Event Management"
      />

      {/* Page summary and refresh */}
      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1A1F36]">
            Events List
          </h2>

          <p className="mt-1 text-xs text-[#62748E]">
            Total events: {totalEvents}
          </p>
        </div>


        {can("events.create") && (
          <Link
            href="/admin/event/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#E87722] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d96818]"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add Event</span>
          </Link>
        )}

      </div>

      {/* Events table */}
      <div className="w-full overflow-auto rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Event Details
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Event Date
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Time
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Location
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Status
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-left">
                Action
              </th>
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
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-red-600"
                >
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() => fetchEvents(currentPage)}
                    className="mt-3 rounded-lg bg-[#E87722] px-4 py-2 text-white"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            ) : events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="border-t transition hover:bg-gray-50">


                  {/* Event Details */}
                  <td className="min-w-[200px] px-4 py-3">
                    <p className="font-semibold text-[#1A1F36]">
                      {event.title || "-"}
                    </p>

                    <p className="mt-1 max-w-[260px] text-xs text-[#62748E]">
                      {event.description}
                    </p>


                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(event.event_date)}
                  </td>

                  {/* Time */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <p>{formatTime(event.start_time)}</p>

                    <p className="mt-1 text-xs text-[#62748E]">
                      to {formatTime(event.end_time)}
                    </p>
                  </td>

                  {/* Location */}
                  <td className="min-w-[160px] px-4 py-3">
                    <div className="flex items-start gap-1.5 text-[#62748E]">
                      <MdLocationOn
                        className="mt-0.5 shrink-0 text-[#E87722]"
                        size={17}
                      />

                      <span>{event.location || "-"}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${event.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {event.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {can("events.view") && (
                        <Tooltip content="View Event">
                          <Link
                            href={`/admin/event/detail/${event.id}`}
                            className={actionButtonClass}
                            aria-label={`View ${event.title}`}
                          >
                            <FaEye size={13} />
                          </Link>
                        </Tooltip>
                      )}

                      {can("events.edit") && (
                        <Tooltip content="Update Event">
                          <Link
                            href={`/admin/event/update/${event.id}`}
                            className={actionButtonClass}
                            aria-label={`Edit ${event.title}`}
                          >
                            <FaPen size={13} />
                          </Link>
                        </Tooltip>
                      )}

                      {can("events.delete") && (
                        <Tooltip content="Delete Event">
                          <button
                            type="button"
                            onClick={() => handleDelete(event)}
                            className={actionButtonClass}
                            aria-label={`Delete ${event.title}`}
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
                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && lastPage > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#62748E]">
            Page {currentPage} of {lastPage}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => fetchEvents(currentPage - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage >= lastPage}
              onClick={() => fetchEvents(currentPage + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Tmodal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setDeleteError("");
          }
        }}
        title="Delete Event"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="bordered"
              onPress={() => {
                setIsDeleteModalOpen(false);
                setDeleteError("");
              }}
              isDisabled={deleting}
            >
              Cancel
            </Button>

            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={deleting}
              isDisabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        }
      >
        <div className="py-1">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {selectedEvent?.title}
            </span>
            ?
          </p>

          <p className="mt-2 text-xs text-gray-500">
            This action cannot be undone.
          </p>

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
