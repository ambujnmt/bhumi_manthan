const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import Cookies from "js-cookie";
import { mergeFooter } from "./footerDefaults";

// bhumi--signup
export async function registerUser(payload) {
  try {
    const res = await fetch(`${BASE_URL}register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return {
      status: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// bhumi verifyOtp
export async function verifyOtp(payload) {
  try {
    const res = await fetch(`${BASE_URL}verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return {
      status: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// bhumi resendOtp
export async function resendOtp(payload) {
  try {
    const res = await fetch(`${BASE_URL}resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return {
      status: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// bhumi--login
export async function loginUser(payload) {
  try {
    const res = await fetch(`${BASE_URL}login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return data;
  } catch (error) {
    return {
      status: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// bhumi--logout
export async function logoutApi(token) {
  try {
    const response = await fetch(`${BASE_URL}api/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
}

// bhumi-forgot-password
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(
      `${BASE_URL}forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    return {
      success: response.ok && data.status === true,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("Forgot password API error:", error);

    return {
      success: false,
      status: 0,
      data: {
        message: "Unable to connect to the server. Please try again.",
      },
    };
  }
};

// reset-password
export const resetPassword = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      success: response.ok && data.status === true,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("Reset password API error:", error);

    return {
      success: false,
      status: 0,
      data: {
        message: "Unable to connect to the server. Please try again.",
      },
    };
  }
};

// bhumi--user-admin-profile
// Update own profile: { name, phone } (email can't be changed here)
export const updateProfile = async (payload) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}profile/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.status) {
    const fieldErrors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    const error = new Error(fieldErrors || data?.message || "Unable to update profile.");
    error.errors = data?.errors || {};
    throw error;
  }

  return data;
};

export const getProfile = async () => {
  try {
    const token = Cookies.get("accessToken");

    const response = await fetch(`${BASE_URL}profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    // Caller shows the error (no console.error: Next dev overlay)
    throw error;
  }
};

// bhumi-property-list
export const getProperties = async () => {

  const response = await fetch(`${BASE_URL}properties/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-banner-list (frontend - only active)
// type = page of the banner: home (default), events, plans
export const getBanners = async (type = "home") => {
  const response = await fetch(`${BASE_URL}banners?type=${encodeURIComponent(type)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-youtuber-video-list (frontend - only active)
export const getYoutuberVideos = async () => {
  const response = await fetch(`${BASE_URL}youtuber-videos`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-project-list (frontend - New Launch & Premium Projects)
export const getProjects = async (limit = 5) => {
  const response = await fetch(`${BASE_URL}projects?limit=${limit}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-blog-list (frontend - Real Estate News & Insights)
export const getBlogs = async (limit = 3) => {
  const response = await fetch(`${BASE_URL}blogs?limit=${limit}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-blog-detail (frontend - by slug)
export const getBlogDetail = async (slug) => {
  const response = await fetch(`${BASE_URL}blogs/detail/${slug}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-city-list (frontend - Explore Properties in Popular Indian Cities)
export const getCities = async ({ popular = false, state = "", limit = 100 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });

  if (popular) params.append("popular", "1");
  if (state) params.append("state", state);

  const response = await fetch(`${BASE_URL}cities?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-state-list (frontend)
export const getStates = async (withCities = false) => {
  const response = await fetch(`${BASE_URL}states${withCities ? "?with_cities=1" : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-footer-settings (frontend)
export const getFooter = async () => {
  const response = await fetch(`${BASE_URL}settings/footer`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| CMS pages (Contact Us, Privacy Policy, Terms, FAQs)
| These return { status: false, message } on error instead of throwing,
| because the CMS page components do not use try/catch.
|--------------------------------------------------------------------------
*/

const cmsGet = async (path) => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`CMS fetch error (${path}):`, error);

    return { status: false, message: "Something went wrong. Please try again." };
  }
};

// Contact Us page: address / phone / email from Footer Settings
export const fetchContactSettings = async () => {
  const res = await cmsGet("settings/footer");

  const contact = mergeFooter(res?.status ? res?.data?.footer : null).contact;

  return {
    status: true,
    data: {
      ...contact,
      // ContactUs page adds "&output=embed"
      location_url:
        contact.map_url ||
        (contact.address
          ? `https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}`
          : ""),
    },
  };
};

// Contact Us form submit: { fname, lname, phone, email, message }
export const submitContactForm = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      return { status: false, message: "Too many requests. Please try again in a minute." };
    }

    return data;
  } catch (error) {
    console.error("Contact form error:", error);

    return { status: false, message: "Something went wrong. Please try again." };
  }
};

// Footer "Subscribe" form
export const subscribeNewsletter = async (email) => {
  try {
    const response = await fetch(`${BASE_URL}subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      return { status: false, message: "Too many requests. Please try again in a minute." };
    }

    return data;
  } catch (error) {
    console.error("Subscribe error:", error);

    return { status: false, message: "Something went wrong. Please try again." };
  }
};

// Property detail "Enquire Now" form
export const submitEnquiryForm = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}enquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      return { status: false, message: "Too many requests. Please try again in a minute." };
    }

    return data;
  } catch (error) {
    console.error("Enquiry form error:", error);

    return { status: false, message: "Something went wrong. Please try again." };
  }
};

// Privacy Policy page: { title, content }
export const fetchPrivacyPolicies = async () => cmsGet("settings/page/privacy_policy");

// Terms & Conditions page: { title, content }
export const fetchTerms = async () => cmsGet("settings/page/terms_conditions");

// FAQs page: [{ id, question, answer, status }]
export const fetchFAQs = async () => cmsGet("settings/faqs");

// bhumi-location-detect: visitor location from IP (no browser permission popup)
// { ip, latitude, longitude, city, state, country, timezone, matched_city }
export const detectLocation = async (signal) => {
  const response = await fetch(`${BASE_URL}location/detect`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    throw new Error(data?.message || "Unable to detect location.");
  }

  return data.data;
};

// bhumi-header-settings (frontend)
export const getHeader = async () => {
  const response = await fetch(`${BASE_URL}settings/header`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-nearby-home (website + mobile): { latitude, longitude, radius }
export const getNearbyHome = async ({ latitude, longitude, radius = 50 }) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
    // Home featured: 8 per page with pagination
    featured_limit: "40",
    luxury_limit: "3",
    projects_limit: "5",
    // used as featured list when there is no featured property nearby
    properties_limit: "40",
  });

  const response = await fetch(`${BASE_URL}nearby/home?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// bhumi-featured / luxury properties (frontend home)
// section = featured | luxury. No limit -> full list ("View All").
// location { latitude, longitude, radius } -> only nearby, nearest first (+ distance_km)
export const getHomeSectionProperties = async (section, limit = null, location = null) => {
  const params = new URLSearchParams();

  if (limit) params.set("limit", String(limit));

  if (location?.latitude != null && location?.longitude != null) {
    params.set("latitude", String(location.latitude));
    params.set("longitude", String(location.longitude));
    params.set("radius", String(location.radius ?? 50));
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${BASE_URL}properties/${section}${query}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};


// bhumi-property-detail
export async function getPropertyDetails(id) {
  const response = await fetch(
    `${BASE_URL}properties/detail/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok || result.status !== true) {
    throw new Error(
      result.message
    );
  }

  // { property, similar_properties }
  return result.data;
}
/*
|--------------------------------------------------------------------------
| Property Search (/api/search/*) - city -> locality -> filters
|--------------------------------------------------------------------------
*/

// { a: 1, list: ["x","y"], empty: "" } -> "a=1&list[]=x&list[]=y" (empty values skipped)
// Arrays go as list[] so names with commas ("Sector 54, Golf Course Road") stay whole.
const searchQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && String(item) !== "")
        .forEach((item) => query.append(`${key}[]`, String(item)));
    } else if (value !== undefined && value !== null && String(value) !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

const searchGet = async (path, params = {}, signal) => {
  const query = searchQuery(params);

  const response = await fetch(`${BASE_URL}search/${path}${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    throw new Error(data?.message || "Unable to load search results.");
  }

  return data.data;
};

// cities, tabs, budgets, property_types, bedrooms, furnishing, sort
export const getSearchOptions = (signal) => searchGet("options", {}, signal);

// { city, q, type } -> { localities, projects, builders }
export const getSearchSuggest = (params, signal) => searchGet("suggest", params, signal);

// { city, localities, type } -> { localities: [{ name, properties_count, distance_km }] }
export const getSimilarLocalities = (params, signal) => searchGet("similar-localities", params, signal);

// filters -> { total }
export const getSearchCount = (params, signal) => searchGet("count", params, signal);

// filters + sort + page -> { properties, pagination }
export const searchProperties = (params, signal) => searchGet("properties", params, signal);

// { latitude, longitude, radius, type } -> { city, locality, nearby_localities } (404 = nothing near)
export const getNearMe = (params, signal) => searchGet("near-me", params, signal);

// Fetch project details using project slug
export const getProjectDetails = async (slug) => {
    try {
        if (!slug) {
            throw new Error("Project slug is required.");
        }

        const response = await fetch(
            `${BASE_URL}projects/detail/${encodeURIComponent(slug)}`
        );

        const result = await response.json();

        if (!response.ok || !result.status) {
            throw new Error(
                result.message
            );
        }

        return result.data.project;
    } catch (error) {
        console.error("Get project details error:", error);
        throw error;
    }
};

// Fetch admin events
export const getAdminEvents = async (page = 1, perPage = 10) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(
    `${BASE_URL}admin/events/all?page=${page}&per_page=${perPage}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const result = await response.json();

  if (!response.ok || !result?.status) {
    throw new Error(
      result?.message
    );
  }

  return result;
};

// add event
export const addAdminEvent = async (payload) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}admin/events/add`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload, 
  });

  const result = await response.json();

  if (!response.ok || !result?.status) {
    const validationErrors = result?.errors
      ? Object.values(result.errors).flat().join(" ")
      : "";

    throw new Error(
      validationErrors || result?.message
    );
  }

  return result;
};

// detail event
export const getAdminEventById = async (id) => {
    const token = Cookies.get("accessToken");

    const response = await fetch(
        `${BASE_URL}admin/events/view/${id}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(token
                    ? { Authorization: `Bearer ${token}` }
                    : {}),
            },
        }
    );

    const result = await response.json();

    if (!response.ok || !result?.status) {
        throw new Error(
            result?.message
        );
    }

    return result;
};

// update event 
export const updateAdminEvent = async (id, formData) => {
    const token = Cookies.get("accessToken");

    const response = await fetch(`${BASE_URL}admin/events/update/${id}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result?.status) {
        throw new Error(result?.message);
    }

    return result;
};

// delete event 
export const deleteAdminEvent = async (id) => {
    const token = Cookies.get("accessToken");

    const response = await fetch(`${BASE_URL}admin/events/delete/${id}`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const result = await response.json();

    if (!response.ok || !result?.status) {
        throw new Error(result?.message);
    }

    return result;
};

// Plan API errors -> one message (validation errors joined)
const planApiError = (result) => {
  const validationErrors = result?.errors
    ? Object.values(result.errors).flat().join(" ")
    : "";

  return new Error(validationErrors || result?.message || "Something went wrong.");
};

const planRequest = async (path, options = {}) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}admin/plans/${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result?.status) {
    throw planApiError(result);
  }

  return result;
};

// list plans
export const getAdminPlans = () => planRequest("all");

// Paid / free listing rules: { free_listings_without_plan: number | null (no limit) }
export const getListingRules = () => planRequest("listing-rules");

export const updateListingRules = (payload) =>
  planRequest("listing-rules", { method: "POST", body: JSON.stringify(payload) });

// Festival offer: unlimited listings for all sellers / brokers between two times
// { enabled, title, starts_at, ends_at } (ISO date-times)
export const getListingOffer = () => planRequest("listing-offer");

export const updateListingOffer = (payload) =>
  planRequest("listing-offer", { method: "POST", body: JSON.stringify(payload) });

// add plan
export const addAdminPlan = (payload) =>
  planRequest("add", { method: "POST", body: JSON.stringify(payload) });

// detail plan
export const getAdminPlanById = (id) => planRequest(`view/${id}`);

// update plan
export const updateAdminPlan = (id, payload) =>
  planRequest(`update/${id}`, { method: "POST", body: JSON.stringify(payload) });

// plan image (multipart, sent after add / update)
export const uploadAdminPlanImage = async (id, file) => {
  const token = Cookies.get("accessToken");
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BASE_URL}admin/plans/image/${id}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result?.status) {
    throw planApiError(result);
  }

  return result;
};

export const removeAdminPlanImage = (id) =>
  planRequest(`image/${id}`, { method: "DELETE" });

// delete plan
export const deleteAdminPlan = (id) =>
  planRequest(`delete/${id}`, { method: "DELETE" });

// Property categories (admin): groups (Residential ...) with sub categories
const propertyCategoryRequest = async (path, options = {}) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}admin/property-categories/${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result?.status) {
    throw planApiError(result);
  }

  return result;
};

// list categories
export const getAdminPropertyCategories = () => propertyCategoryRequest("all");

// add group (no parent_id) / sub category (parent_id)
export const addAdminPropertyCategory = (payload) =>
  propertyCategoryRequest("add", { method: "POST", body: JSON.stringify(payload) });

// update category
export const updateAdminPropertyCategory = (id, payload) =>
  propertyCategoryRequest(`update/${id}`, { method: "POST", body: JSON.stringify(payload) });

// delete category (group deletes its sub categories too)
export const deleteAdminPropertyCategory = (id) =>
  propertyCategoryRequest(`delete/${id}`, { method: "DELETE" });

// website property categories (active only)
export const getPropertyCategories = async () => {
  const response = await fetch(`${BASE_URL}property-categories`, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// website events (active only)
// location { latitude, longitude, radius } -> only events near user, nearest first (+ distance_km)
export const getEvents = async (limit = 10, location = null) => {
  const params = new URLSearchParams({ limit: String(limit) });

  if (location?.latitude != null && location?.longitude != null) {
    params.set("latitude", String(location.latitude));
    params.set("longitude", String(location.longitude));
    params.set("radius", String(location.radius ?? 50));
  }

  const response = await fetch(`${BASE_URL}events?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// website event detail (slug or id)
export const getEventDetail = async (slug) => {
  const response = await fetch(`${BASE_URL}events/${slug}`, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// website pricing plans (active only, sorted)
export const getPlans = async () => {
  const response = await fetch(`${BASE_URL}plans`, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message);
  }

  return data;
};

// event form options (types, footfall, highlights)
export const getAdminEventOptions = async () => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}admin/events/options`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const result = await response.json();

  if (!response.ok || !result?.status) {
    throw new Error(result?.message);
  }

  return result;
};


/*
|--------------------------------------------------------------------------
| Wishlist (logged in customer)
|--------------------------------------------------------------------------
*/
const wishlistRequest = async (path, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}wishlist${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("accessToken")}`,
      },
    });

    const result = await response.json();

    return response.ok ? result : { status: false, message: result?.message || "Something went wrong. Please try again." };
  } catch (error) {
    return { status: false, message: "Something went wrong. Please try again." };
  }
};

export const getWishlist = (page = 1) => wishlistRequest(`?page=${page}`);

export const getWishlistIds = () => wishlistRequest("/ids");

export const addToWishlist = (propertyId) =>
  wishlistRequest("/add", { method: "POST", body: JSON.stringify({ property_id: propertyId }) });

export const removeFromWishlist = (propertyId) =>
  wishlistRequest(`/remove/${propertyId}`, { method: "DELETE" });

/*
|--------------------------------------------------------------------------
| Compare (logged in user) - one list per property type, max 3 in each
|--------------------------------------------------------------------------
*/
const compareRequest = async (path, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}compare${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("accessToken")}`,
      },
    });

    const result = await response.json();

    return response.ok ? result : { status: false, message: result?.message || "Something went wrong. Please try again." };
  } catch (error) {
    return { status: false, message: "Something went wrong. Please try again." };
  }
};

export const getCompareList = () => compareRequest("/list");

export const getCompareTable = (propertyType) =>
  compareRequest(`?property_type=${encodeURIComponent(propertyType)}`);

export const addToCompare = (propertyId) =>
  compareRequest("/add", { method: "POST", body: JSON.stringify({ property_id: propertyId }) });

export const removeFromCompare = (propertyId) =>
  compareRequest(`/remove/${propertyId}`, { method: "DELETE" });

/*
|--------------------------------------------------------------------------
| Sellers / brokers with ratings (home section + detail modal)
|--------------------------------------------------------------------------
*/
const agentRequest = async (path, options = {}) => {
  const token = Cookies.get("accessToken");

  try {
    const response = await fetch(`${BASE_URL}agents${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();

    return response.ok ? result : { status: false, message: result?.message || "Something went wrong. Please try again." };
  } catch (error) {
    return { status: false, message: "Something went wrong. Please try again." };
  }
};

// location { latitude, longitude, radius } -> agents near user, else all (top rated first)
export const getNearbyAgents = (location = null, limit = 8) => {
  const params = new URLSearchParams({ limit: String(limit) });

  if (location?.latitude != null && location?.longitude != null) {
    params.set("latitude", String(location.latitude));
    params.set("longitude", String(location.longitude));
    params.set("radius", String(location.radius ?? 50));
  }

  return agentRequest(`/nearby?${params.toString()}`);
};

export const getAgentDetail = (key) => agentRequest(`/${encodeURIComponent(key)}`);

// { rating: 1-5, review?: text } - customer only
export const rateAgent = (key, payload) =>
  agentRequest(`/${encodeURIComponent(key)}/review`, { method: "POST", body: JSON.stringify(payload) });

/*
|--------------------------------------------------------------------------
| Recently viewed properties (customer dashboard "Recent View")
|--------------------------------------------------------------------------
*/
const recentRequest = async (path, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}recently-viewed${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("accessToken")}`,
      },
    });

    const result = await response.json();

    return response.ok ? result : { status: false, message: result?.message || "Something went wrong. Please try again." };
  } catch (error) {
    return { status: false, message: "Something went wrong. Please try again." };
  }
};

export const getRecentlyViewed = (page = 1) => recentRequest(`?page=${page}`);

// Property detail opened by a logged in customer
export const addRecentlyViewed = (propertyId) =>
  recentRequest("/add", { method: "POST", body: JSON.stringify({ property_id: propertyId }) });

export const removeRecentlyViewed = (propertyId) => recentRequest(`/remove/${propertyId}`, { method: "DELETE" });

export const clearRecentlyViewed = () => recentRequest("/clear", { method: "DELETE" });

// bhumi-plan-orders (buy a plan with cash / offline payment, seller / broker)
const planOrderRequest = async (path, method = "GET", body) => {
  const token = Cookies.get("accessToken");

  const response = await fetch(`${BASE_URL}${path}`, {
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

  if (response.status === 429) {
    throw new Error("Too many requests. Please try again in a minute.");
  }

  if (!response.ok || data.status !== true) {
    const error = new Error(data.message || "Something went wrong. Please try again.");
    error.errors = data.errors;
    error.status = response.status;
    throw error;
  }

  return data;
};

// My orders + current listing quota + payment methods
export const getMyPlanOrders = () => planOrderRequest("plan-orders/my");

// payload: { plan_id, payment_method?, payment_reference?, note? }
export const createPlanOrder = (payload) => planOrderRequest("plan-orders", "POST", payload);

export const cancelPlanOrder = (id) => planOrderRequest(`plan-orders/cancel/${id}`, "POST");

// bhumi-my-enquiries (buyer dashboard): property enquiries I sent + how many properties
export const getMyEnquiries = () => planOrderRequest("my-enquiries");

// Sidebar badge: { properties_count, total_enquiries }
export const getMyEnquiryCount = () => planOrderRequest("my-enquiries/count");

// bhumi-property-lookup: home search "Property ID" tab (any city, active only)
export const lookupPropertyById = async (q, signal) => {
  const response = await fetch(`${BASE_URL}properties/lookup?q=${encodeURIComponent(q)}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== true) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data.data?.properties || [];
};
