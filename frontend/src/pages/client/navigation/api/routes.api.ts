import { api } from "../../../../config/api";
import type { RouteRequest, SafeRouteResponse } from "../types/routes.types";

export const getSafeRoute = async (
  payload: RouteRequest,
): Promise<SafeRouteResponse> => {
  const response = await api.post<SafeRouteResponse>("/routes/safe", payload);

  return response.data;
};
