import { appointmentConfig } from "./config";

export class AppointmentApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const request = async (path, { method = "GET", query, body } = {}) => {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  const queryString = params.toString();
  const token = appointmentConfig.getToken();

  let response;
  try {
    response = await fetch(`${appointmentConfig.apiBaseUrl}appointments/${path}${queryString ? `?${queryString}` : ""}`, {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AppointmentApiError("Could not reach the server. Please check your connection.", 0);
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result?.status) {
    if (response.status === 401) {
      throw new AppointmentApiError("Please log in again to continue.", 401);
    }

    const fallback = response.status === 429 ? "Too many attempts. Please wait a minute and try again." : "Something went wrong. Please try again.";
    throw new AppointmentApiError(result?.message || fallback, response.status);
  }

  return result;
};

const bookablePath = (type, key) => `${encodeURIComponent(type)}/${encodeURIComponent(key)}`;

// Public booking
export const getCalendar = (type, key, month) =>
  request(`${bookablePath(type, key)}/calendar`, { query: { month } }).then((res) => res.data);

export const getSlots = (type, key, date) =>
  request(`${bookablePath(type, key)}/slots`, { query: { date } }).then((res) => res.data);

export const bookAppointment = (type, key, payload) =>
  request(bookablePath(type, key), { method: "POST", body: payload });

// Logged in customer's own bookings
export const getMyAppointments = (query) =>
  request("mine", { query }).then((res) => res.data);

// Owner / admin management
export const getAppointments = (query) =>
  request("manage", { query }).then((res) => res.data);

export const updateAppointmentStatus = (id, status) =>
  request(`manage/${id}/status`, { method: "POST", body: { status } });

export const getSchedule = (scope) =>
  request("manage/schedule", { query: { scope } }).then((res) => res.data);

export const saveSchedule = (scope, payload) =>
  request(`manage/schedule?scope=${scope}`, { method: "PUT", body: payload });
