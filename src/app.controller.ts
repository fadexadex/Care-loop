import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "./middlewares";
import adminRoutes from "./modules/admin/routes";
import doctorRoutes from "./modules/doctor/routes";
import patientRoutes from "./modules/patient/routes";
import aiRoutes from "./modules/ai/routes";

dotenv.config();

export class Server {
  private app: express.Application;
  private port: number;
  private apiRouter: express.Router;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.apiRouter = express.Router();  
  }

  private enableMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(errorHandler);
  }
  private setUpRootRoute() {
    this.app.get("/", (req, res) => {
      res.json({ message: "Careloop API is running" });
    });    this.apiRouter.use("/admin", adminRoutes);
    this.apiRouter.use("/doctor", doctorRoutes);
    this.apiRouter.use("/patient", patientRoutes);
    this.apiRouter.use("/ai", aiRoutes);
    this.app.use("/api/v1", this.apiRouter);
    this.app.use(errorHandler);
  }

  public startApp() {
    this.enableMiddlewares();
    this.setUpRootRoute();
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}
