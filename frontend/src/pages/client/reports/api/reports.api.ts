import { api } from "../../../../config/api.ts";
import type {
  CreateReportPayload,
  CreateReportResponse,
} from "../types/reports.types.ts";

import type {
  GetReportsParams,
  GetReportSummaryParams,
  ReportListResponse,
  ReportSummaryResponse,
} from "../types/reports.types.ts";

export const createReport = async (
  payload: CreateReportPayload,
): Promise<CreateReportResponse> => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("type", payload.type);
  formData.append("severity", payload.severity);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));

  payload.images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await api.post<CreateReportResponse>("/reports", formData);

  return response.data;
};

export const getReports = async (
  params: GetReportsParams = {},
): Promise<ReportListResponse> => {
  const response = await api.get<ReportListResponse>("/reports", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 9,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });

  return response.data;
};

export const getReportSummary = async (
  params: GetReportSummaryParams = {},
): Promise<ReportSummaryResponse> => {
  const response = await api.get<ReportSummaryResponse>("/reports/summary", {
    params: params.status ? { status: params.status } : {},
  });

  return response.data;
};

export const getReportProgress = async (reportId: string) => {
  const response = await api.get(`/reports/${reportId}/progress`);
  return response.data;
};
