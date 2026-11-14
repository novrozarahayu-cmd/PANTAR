export type ReportSeverity = "ringan" | "sedang" | "berat";
export type TypeReport =
  | "jalan"
  | "lampu-jalan"
  | "trotoar"
  | "halte"
  | "taman"
  | "lainnya";

export interface CreateReportPayload {
  title: string;
  description: string;
  severity: ReportSeverity | "";
  latitude: number;
  longitude: number;
  type: TypeReport | "";
  images: File[];
}

export const initialPengaduanForm: CreateReportPayload = {
  title: "",
  description: "",
  severity: "",
  latitude: 3.587576,
  longitude: 98.642247,
  type: "",
  images: [],
};

export interface CreateReportResponse {
  message?: string;
  data?: {
    id?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type ReportStatus =
  | "menunggu"
  | "diverifikasi"
  | "diproses"
  | "selesai"
  | "ditolak";

export type ValidationStatus =
  | "auto_verified"
  | "flagged"
  | "duplicate"
  | "needs_review"
  | "approved"
  | "rejected"
  | "pending";

export interface ReportValidationCheck {
  code: string;
  label: string;
  impact?: number;
  detail?: string | null;
  hard?: string;
}

export interface ReportValidationAI {
  status?: string | null;
  attempts?: number;
  model?: string | null;
  lockedAt?: string | null;
  error?: string | null;
  damageVisible?: boolean | null;
  suggestedType?: string | null;
  suggestedSeverity?: string | null;
  matchesDescription?: boolean | null;
  isScreenshot?: boolean | null;
  isUnrelated?: boolean | null;
  confidence?: number | null;
  reason?: string | null;
  checkedAt?: string | null;
}

export interface ReportValidationReview {
  decision?: string | null;
  by?: string | null;
  at?: string | null;
  note?: string | null;
}

export interface ReportValidation {
  status: ValidationStatus;
  trustScore?: number;
  duplicateOf?: string | null;
  duplicateCount?: number;
  checkedAt?: string;
  checks?: ReportValidationCheck[];
  ai?: ReportValidationAI;
  review?: ReportValidationReview;
}

export interface ReportImage {
  _id: string;
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  original_filename: string;
}

export interface ReportItem {
  _id: string;
  title: string;
  description: string;
  address: string;
  street?: string;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  severity: ReportSeverity;
  status: ReportStatus;
  type: string;
  images: ReportImage[];
  cost: string | number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  validation?: ReportValidation;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  success: boolean;
  message: string;
  data: ReportItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ReportSummaryItem {
  total: number;
  name: string;
}

type ReportTypeSummary = {
  type: string;
  total: number;
};

export interface ReportSummaryData {
  statusSummary: {
    total: number;
    status: ReportStatus;
  }[];
  severitySummary: {
    total: number;
    severity: ReportSeverity;
  }[];
  typeSummary: ReportTypeSummary[];
  street: ReportSummaryItem[];
  village: ReportSummaryItem[];
  district: ReportSummaryItem[];
  regency: ReportSummaryItem[];
  province: ReportSummaryItem[];
}

export interface ReportSummaryResponse {
  success: boolean;
  message: string;
  data: ReportSummaryData;
  meta: {
    groupBy: string | null;
    totalReports: number;
  };
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  search?: string;
}

export interface GetReportSummaryParams {
  status?: ReportStatus;
}
