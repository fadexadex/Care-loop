import { PatientController } from "./controller";
import { Router } from "express";
import { adminGuard, authGuard } from "../../middlewares";
import { validateDto } from "../../middlewares";


const patientController = new PatientController();
const router = Router();





export default router;
