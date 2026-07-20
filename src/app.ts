import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import objectionRoutes from "./routes/objectionRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import accessRequestRoutes from "./routes/accessRequestRoutes";
import overviewRoutes from "./routes/overviewRoutes";

const app: Application = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/entries", entryRoutes);
app.use("/objections", objectionRoutes);
app.use("/audit-log", auditLogRoutes);
app.use("/access-requests", accessRequestRoutes);
app.use("/overview", overviewRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
