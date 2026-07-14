import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import treasuryRoutes from "./routes/treasuryRoutes";
import objectionRoutes from "./routes/objectionRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import accessRequestRoutes from "./routes/accessRequestRoutes";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/entries", entryRoutes);
app.use("/treasury", treasuryRoutes);
app.use("/objections", objectionRoutes);
app.use("/audit-log", auditLogRoutes);
app.use("/access-requests", accessRequestRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
