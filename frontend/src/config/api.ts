import axios from "axios";
import { env } from "./env";
import { getAdminToken } from "../pages/admin/utils/auth-storage";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      if (window.location.pathname !== "/403") {
        window.location.assign("/403");
      }
    }

    return Promise.reject(error);
  },
);
