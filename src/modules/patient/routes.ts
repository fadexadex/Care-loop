import { PatientController } from "./controller";
import { Router } from "express";
import { authGuard, doctorGuard } from "../../middlewares";
import { CreatePatientAndFollowupDto } from "./dtos";
import { validateDto } from "../../middlewares";

const patientController = new PatientController();
const router = Router();

router.post(
  '/create-patient-and-followup',
  // authGuard,
  // doctorGuard,
  validateDto(CreatePatientAndFollowupDto),
  patientController.createPatientAndFollowUp
);

router.get(
  '/:id',
  authGuard,
  patientController.getPatientById
);

router.get(
  '/doctor/my-patients',
  authGuard,
  doctorGuard,
  patientController.getPatientsByDoctor
);

export default router;
