const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL belum dikonfigurasi.");
}

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
} as const;
