import { Navigate, Route, Routes } from "react-router";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/client/home/Index";
import ReportPage from "./pages/client/reports/ReportPage";
import NavigasiPage from "./pages/client/navigation/NavigasiPage";
import AdminLoginPage from "./pages/admin/pages/AdminLoginPage";
import AdminProtectedRoute from "./pages/admin/components/AdminProtectedRoute";
import AdminDashboardPage from "./pages/admin/pages/AdminDashboardPage";
import AdminLayout from "./pages/admin/components/AdminLayout";
import AdminReportListPage from "./pages/admin/pages/reports/AdminReportListPage";
import AdminReportDetailPage from "./pages/admin/pages/reports/AdminReportDetailPage";
import ForbiddenPage from "./pages/admin/pages/ForbiddenPage";
import ReportListPage from "./pages/client/reports/ReportListPage";
import ReportDetailPage from "./pages/client/reports/ReportDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/form-pengaduan" element={<ReportPage />} />
        <Route path="/pengaduan" element={<ReportListPage />} />
        <Route
          path="/pengaduan/:reportId/detail"
          element={<ReportDetailPage />}
        />
        <Route path="/navigasi" element={<NavigasiPage />} />
      </Route>

      {/* Halaman autentikasi admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Halaman yang memerlukan sesi admin */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/reports" element={<AdminReportListPage />} />
          <Route path="/admin/reports/:reportId" element={<AdminReportDetailPage />} />
        </Route>
      </Route>

      {/* Halaman akses ditolak */}
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Halaman tidak ditemukan */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}