import { api } from "../../../config/api";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export async function loginAdmin(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", payload);

  return response.data;
}
