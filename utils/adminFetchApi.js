// Admin panel APIs (/api/admin/*) - need the logged-in admin token
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import Cookies from "js-cookie";

// bhumi-getallusers
export const getUsers = async (deleted = false) => {
  try {
    const token = Cookies.get("accessToken");

    const res = await fetch(`${BASE_URL}admin/users/all${deleted ? "?deleted=1" : ""}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    return data;
  } catch (error) {
    console.error("Users fetch error:", error);

    return {
      status: false,
      users: [],
    };
  }
};

// bhumi-user-detail
export const getUserDetail = async (id) => {
  try {
    const token = Cookies.get("accessToken");

    const res = await fetch(
      `${BASE_URL}admin/users/detail/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    return data;
  } catch (error) {
    console.error("User detail fetch error:", error);

    return {
      status: false,
      data: {
        user: null,
      },
    };
  }
};

// bhumi--user--update
export const updateUser = async (id, payload) => {
  try {
    const token = Cookies.get("accessToken");

    const res = await fetch(`${BASE_URL}admin/users/update/${id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message);
    }

    return data;
  } catch (error) {
    console.error("Update user error:", error);

    return {
      status: false,
      message: error.message,
    };
  }
};

// Delete User
export const deleteUser = async (userId) => {
  try {
    const token = Cookies.get("accessToken");

    const response = await fetch(
      `${BASE_URL}admin/users/delete/${userId}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Delete user API error:", error);
    throw error;
  }
};

// Permanent Delete User (with all related data)
export const permanentDeleteUser = async (userId) => {
  try {
    const token = Cookies.get("accessToken");

    const response = await fetch(
      `${BASE_URL}admin/users/permanent-delete/${userId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Permanent delete user API error:", error);
    throw error;
  }
};

// bhumi- create property
export async function createProperty(formData) {
    try {
        const token =
            Cookies.get("accessToken") ||
            Cookies.get("token");

        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        const response = await fetch(
            `${BASE_URL}admin/properties/add`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.status !== true) {
            const validationErrors = result.errors
                ? Object.values(result.errors).flat().join(" ")
                : "";

            throw new Error(
                validationErrors ||
                result.message
            );
        }

        return result;
    } catch (error) {
        throw new Error(
            error.message
        );
    }
}

// bhumi-admin-property-list (active + inactive)
export const getAdminProperties = async (deleted = false) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/properties/all${deleted ? "?deleted=1" : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-property-detail (admin)
export const getPropertyDetail = async (propertyId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(
    `${BASE_URL}admin/properties/detail/${propertyId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message
    );
  }

  return data;
};

// bhumi-property-update
export const updateProperty = async (propertyId, formData) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response
    = await fetch(`${BASE_URL}admin/properties/update/${propertyId}`,

      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        }, body: formData,
      });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // show field errors (e.g. "image must be 200 KB or smaller") instead of "Validation failed."
    const validationErrors = data?.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data?.message);
  }

  return data;
};

// bhumi-property-geocode (latitude/longitude from address)
export const geocodeAddress = async ({ location, city, state }) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const params = new URLSearchParams({ location, city, state });

  const response = await fetch(
    `${BASE_URL}admin/properties/geocode?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-property-soft-delete
export const deleteProperty = async (propertyId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(
    `${BASE_URL}admin/properties/delete/${propertyId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-banner-list (active + inactive)
export const getAdminBanners = async () => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/banners/all`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-banner-create / update (formData)
export const saveBanner = async (formData, bannerId = null) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const url = bannerId
    ? `${BASE_URL}admin/banners/update/${bannerId}`
    : `${BASE_URL}admin/banners/add`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-banner-delete
export const deleteBanner = async (bannerId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/banners/delete/${bannerId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-project-list
export const getAdminProjects = async () => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/projects/all`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-project-create / update (formData)
export const saveProject = async (formData, projectId = null) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const url = projectId
    ? `${BASE_URL}admin/projects/update/${projectId}`
    : `${BASE_URL}admin/projects/add`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-project-delete
export const deleteProject = async (projectId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/projects/delete/${projectId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-blog-list
export const getAdminBlogs = async () => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/blogs/all`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-blog-detail
export const getAdminBlogDetail = async (blogId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/blogs/detail/${blogId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-blog-create / update (formData)
export const saveBlog = async (formData, blogId = null) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const url = blogId
    ? `${BASE_URL}admin/blogs/update/${blogId}`
    : `${BASE_URL}admin/blogs/add`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-blog-delete
export const deleteBlog = async (blogId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/blogs/delete/${blogId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-location (type = "states" | "cities")
export const getAdminLocations = async (type) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${type}/all`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-location-create / update (type = "states" | "cities")
export const saveLocation = async (type, formData, id = null) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const url = id
    ? `${BASE_URL}admin/${type}/update/${id}`
    : `${BASE_URL}admin/${type}/add`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-admin-location-delete (type = "states" | "cities")
export const deleteLocation = async (type, id) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${type}/delete/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-footer-settings
export const getAdminFooter = async () => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/settings/footer`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-footer-update (formData: data JSON, logo, remove_logo)
export const saveFooter = async (formData) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/settings/footer`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-admin-cms-page-update (key = privacy_policy | terms_conditions)
export const savePageSetting = async (key, payload) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/settings/page/${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-admin-faqs-update (faqs: [{ question, answer, status }])
export const saveFaqs = async (faqs) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/settings/faqs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ faqs }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-admin-header-logo-update (formData: logo or remove_logo=1)
export const saveHeaderLogo = async (formData) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/settings/header`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message);
  }

  return data;
};

// bhumi-admin-inbox (type = "contact-messages" | "enquiries")
export const getAdminInbox = async (type) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${type}/all`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-inbox-read (mark read / unread)
export const markInboxRead = async (type, id, isRead = true) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${type}/read/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_read: isRead }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-inbox-delete
export const deleteInboxItem = async (type, id) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${type}/delete/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-inbox-counts (sidebar Messages box)
export const getInboxCounts = async () => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/inbox/counts`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-dashboard (stat cards, chart, recent lists)
export const getDashboard = async (year) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(
    `${BASE_URL}admin/dashboard${year ? `?year=${encodeURIComponent(year)}` : ""}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-cities-by-state (property form City dropdown)
export const getAdminCitiesByState = async (stateId) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(
    `${BASE_URL}admin/cities/all?state=${encodeURIComponent(stateId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-localities (property form Locality / Sector suggestions)
// source = "saved" (localities table, fast) | "online" (OpenStreetMap) | "" (both)
// signal = AbortController signal to cancel old request while typing
export const getAdminLocalities = async (cityId, search = "", source = "", signal) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const params = new URLSearchParams({ city_id: cityId, search });

  if (source) {
    params.set("source", source);
  }

  const response = await fetch(
    `${BASE_URL}admin/localities?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-admin-json-request (roles + staff)
const adminJsonRequest = async (path, method = "GET", body) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";

    throw new Error(validationErrors || data.message || "Something went wrong.");
  }

  return data;
};

// bhumi-admin-roles (list + permission modules)
export const getAdminRoles = () => adminJsonRequest("roles/all");

// bhumi-admin-role-save
export const saveAdminRole = (payload, roleId = null) =>
  adminJsonRequest(roleId ? `roles/update/${roleId}` : "roles/add", "POST", payload);

// bhumi-admin-role-delete
export const deleteAdminRole = (roleId) => adminJsonRequest(`roles/delete/${roleId}`, "DELETE");

// bhumi-admin-staff
export const getAdminStaff = () => adminJsonRequest("staff/all");

// bhumi-admin-staff-save
export const saveAdminStaff = (payload, staffId = null) =>
  adminJsonRequest(staffId ? `staff/update/${staffId}` : "staff/add", "POST", payload);

// bhumi-admin-staff-delete
export const deleteAdminStaff = (staffId) => adminJsonRequest(`staff/delete/${staffId}`, "DELETE");

// bhumi-admin-seo (type = "properties" / "blogs")
export const getSeoItems = (type) => adminJsonRequest(`seo/${type}`);

export const saveSeoItem = (type, id, payload) =>
  adminJsonRequest(`seo/${type}/update/${id}`, "POST", payload);

// bhumi-admin-youtuber-videos
export const getAdminYoutuberVideos = () => adminJsonRequest("youtuber-videos/all");

export const deleteYoutuberVideo = (id) => adminJsonRequest(`youtuber-videos/delete/${id}`, "DELETE");

// formData: youtuber_name, title, video or video_url, thumbnail, sort_order, is_active
export const saveYoutuberVideo = async (formData, id = null) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}admin/youtuber-videos/${id ? `update/${id}` : "add"}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    const validationErrors = data.errors ? Object.values(data.errors).flat().join(" ") : "";

    throw new Error(validationErrors || data.message || "Something went wrong.");
  }

  return data;
};

// bhumi-admin-buyer-export
// Cities that have buyers (profile city + property activity), with counts
export const getBuyerCities = () => adminJsonRequest("buyers/cities");

// Downloads the buyers CSV. params: { user_id } | { city } | {} (all buyers)
export const downloadBuyersCsv = async (params = {}) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();

  const response = await fetch(`${BASE_URL}admin/buyers/export${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "text/csv, application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Download failed. Please try again.");
  }

  // buyers[-id][-city]-YYYY-MM-DD.csv (Content-Disposition is not readable cross-origin)
  const slug = (text) => String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const fileName = [
    "buyers",
    params.user_id && String(params.user_id),
    params.city && slug(params.city),
    new Date().toISOString().slice(0, 10),
  ].filter(Boolean).join("-") + ".csv";

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return fileName;
};

// bhumi-admin-plan-orders (cash / offline plan payments + cash flow)
// filters: { status, method, from, to }
export const getAdminPlanOrders = (filters = {}) => {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();

  return adminJsonRequest(`plan-orders/all${query ? `?${query}` : ""}`);
};

export const getPlanOrderOptions = () => adminJsonRequest("plan-orders/options");

// { user_id, plan_id, amount?, payment_method, payment_reference?, paid_at?, admin_note? }
export const recordPlanPayment = (payload) => adminJsonRequest("plan-orders/add", "POST", payload);

// { payment_method, payment_reference?, paid_at?, admin_note? }
export const markPlanOrderPaid = (id, payload) => adminJsonRequest(`plan-orders/mark-paid/${id}`, "POST", payload);

export const cancelAdminPlanOrder = (id, payload = {}) => adminJsonRequest(`plan-orders/cancel/${id}`, "POST", payload);
