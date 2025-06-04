import { DoctorController } from "./controller";
import { Router } from "express";
import { adminGuard, authGuard } from "../../middlewares";
import { CreateDoctorDto, CreateInviteDto, LoginDto  } from "./dtos";
import { validateDto } from "../../middlewares";


const doctorController = new DoctorController();
const router = Router();

router.post(
  "/invite",
  authGuard,
  adminGuard,
  validateDto(CreateInviteDto),
  doctorController.createAndSendInvite
);

router.get(
  "/verify-token/:token",
  doctorController.verifyToken
);

router.post(
  "/create-doctor/:token",
  validateDto(CreateDoctorDto),
  doctorController.createDoctor
);

router.post(
  "/login",
  validateDto(LoginDto),
  doctorController.loginDoctor
);

router.get(
  "/:slug",
  doctorController.getDoctorBySlug
);

router.get(
  "/dashboard/stats",
  authGuard,
  doctorController.getDoctorDashboard
);



export default router;
