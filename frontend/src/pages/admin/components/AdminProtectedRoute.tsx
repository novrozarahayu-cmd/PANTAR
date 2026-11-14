import { Navigate, Outlet } from "react-router";
import {
    getAdminToken,
    getAdminUser,
} from "../utils/auth-storage";

export default function AdminProtectedRoute() {
    const token = getAdminToken();
    const user = getAdminUser();

    if (!token || !user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (user.role !== "admin" || !user.isActive) {
        return <Navigate to="/403" replace />;
    }

    return <Outlet />;
}