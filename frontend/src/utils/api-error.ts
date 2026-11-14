import axios from "axios";

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.code === "ECONNABORTED") {
    return "Permintaan terlalu lama. Silakan coba kembali.";
  }

  if (!error.response) {
    return "Tidak dapat terhubung ke server. Periksa koneksi atau server backend.";
  }

  return fallback;
};
