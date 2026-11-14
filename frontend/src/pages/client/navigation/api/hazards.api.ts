import type { RoadHazardsResponse } from "../types/hazards.types";
import { api } from "../../../../config/api";

export async function getRoadHazards(): Promise<RoadHazardsResponse> {
  const response = await api.get<RoadHazardsResponse>("/routes/hazards");

  return response.data;
}
