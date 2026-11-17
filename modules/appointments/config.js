import Cookies from "js-cookie";

// The only project-specific values in this module: edit these when copying it
export const appointmentConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  getToken: () => Cookies.get("accessToken"),
};
