import { api } from "../../../config/api";
import type {
  ReportItem,
  ReportListResponse,
  ReportStatus,
  ReportSummaryResponse,
  ValidationStatus,
} from "../../client/reports/types/reports.types";

export type AdminProgress = {
  _id: string;
  report: string;
  title: string;
  description: string;
  status: string;
  type: string;
  cost: string;
  images: string[];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminProgressResponse = {
  success: boolean;
  message: string;
  data: AdminProgress[];
  meta: { reportStatus: ReportStatus; totalItems: number };
};

export async function getAdminReports(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ReportStatus;
    severity?: string;
    today?: boolean;
    validation?: ValidationStatus;
  } = {},
) {
  const response = await api.get<ReportListResponse>("/reports", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.today ? { today: params.today } : {}),
      ...(params.validation ? { validation: params.validation } : {}),
    },
  });
  return response.data;
}

export async function getAdminReportById(reportId: string) {
  const response = await api.get(`/reports/${reportId}`);
  return response.data.data;
}

export async function getAdminReportSummary() {
  const response = await api.get<ReportSummaryResponse>("/reports/summary");
  return response.data;
}

export type ValidationStatusStat = {
  total: number;
  status: ValidationStatus;
};

export type ValidationStatsResponse = {
  success: boolean;
  message: string;
  data: {
    byStatus: ValidationStatusStat[];
    byAi?: {
      total: number;
      status: string | null;
    }[];
    aiEnabled?: boolean;
    aiMode?: string;
    models?: string[];
  };
};

export async function getValidationStats(): Promise<ValidationStatsResponse> {
  const response = await api.get<ValidationStatsResponse>("/validation/stats");
  return response.data;
}

export type ProcessValidationResponse = {
  success: boolean;
  message: string;
  data?: unknown;
};

export async function processValidationQueue(
  limit: number = 5,
): Promise<ProcessValidationResponse> {
  const response = await api.get<ProcessValidationResponse>(
    "/validation/process",
    {
      params: { limit },
      timeout: 30000,
    },
  );
  return response.data;
}

export type UpdateValidationPayload = {
  decision: "approved" | "rejected" | "duplicate";
  note?: string;
  duplicateOf?: string;
};

export async function updateAdminReportValidation(
  reportId: string,
  payload: UpdateValidationPayload,
) {
  const response = await api.patch(`/reports/${reportId}/validation`, payload);
  return response.data;
}

export async function getAdminReportProgress(reportId: string) {
  const response = await api.get<AdminProgressResponse>(
    `/reports/${reportId}/progress`,
  );
  return response.data;
}

export type UpdateReportPayload = {
  title: string;
  description: string;
  severity: ReportItem["severity"];
  status: ReportStatus;
  latitude: number;
  type: string;
  longitude: number;
  images?: File[];
  removeImages: string[];
};

export async function updateAdminReport(
  reportId: string,
  payload: UpdateReportPayload,
) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("severity", payload.severity);
  formData.append("type", payload.type);
  formData.append("status", payload.status);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  payload.images?.forEach((image) => formData.append("images", image));
  formData.append("removeImages", JSON.stringify(payload.removeImages));
  const response = await api.put(`/reports/${reportId}`, formData);
  return response.data;
}

export type ProgressPayload = {
  title: string;
  description: string;
  status: string;
  cost: string;
  images?: File[];
};

export async function createAdminProgress(
  reportId: string,
  payload: ProgressPayload,
) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("status", payload.status);
  formData.append("cost", payload.cost);
  payload.images?.forEach((image) => formData.append("images", image));
  const response = await api.post(`/reports/${reportId}/progress`, formData);
  return response.data;
}

export async function updateAdminProgress(
  progressId: string,
  payload: ProgressPayload,
) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("status", payload.status);
  formData.append("cost", payload.cost);
  payload.images?.forEach((image) => formData.append("images", image));
  const response = await api.put(`/progress/${progressId}`, formData);
  return response.data;
}

export async function deleteAdminReport(reportId: string) {
  const response = await api.delete(`/reports/${reportId}`);
  return response.data;
}

export async function deleteAdminProgress(progressId: string) {
  const response = await api.delete(`/progress/${progressId}`);
  return response.data;
}
