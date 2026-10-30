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
export const getBanners = async () => {
  const response = await fetch(`${BASE_URL}banners`, {
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
    featured_limit: "4",
    luxury_limit: "3",
    projects_limit: "5",
    properties_limit: "4",
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

// add plan
export const addAdminPlan = (payload) =>
  planRequest("add", { method: "POST", body: JSON.stringify(payload) });

// detail plan
export const getAdminPlanById = (id) => planRequest(`view/${id}`);

// update plan
export const updateAdminPlan = (id, payload) =>
  planRequest(`update/${id}`, { method: "POST", body: JSON.stringify(payload) });

// delete plan
export const deleteAdminPlan = (id) =>
  planRequest(`delete/${id}`, { method: "DELETE" });

// website events (active only)
export const getEvents = async (limit = 10) => {
  const response = await fetch(`${BASE_URL}events?limit=${limit}`, {
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
