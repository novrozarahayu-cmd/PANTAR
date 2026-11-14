
import express from "express";
import cors from "cors";
import path from "path";
import os from "os";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportRoutes from "./routes/report.routes.js";
import routeRoutes from "./routes/route.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import validationRoutes from "./routes/validation.routes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import { success } from "./utils/responseFormatter.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/uploads", express.static(path.join(os.tmpdir(), "uploads")));

// Pastikan database siap sebelum route API dijalankan.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

app.get("/", (_req, res) =>
    success(res, { message: "PANTAR API berjalan" }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api", progressRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
