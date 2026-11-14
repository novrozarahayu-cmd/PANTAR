import type { ReportImage } from "../pages/client/reports/types/reports.types";

export function getReportImages(images?: ReportImage[]) {
  return (images ?? []).filter(
    (image) => image.resource_type === "image" && Boolean(image.url),
  );
}
