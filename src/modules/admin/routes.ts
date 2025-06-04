import { AdminController } from "./controller";
import { Router } from "express";
import { authGuard } from "../../middlewares";
import { LoginDto, onBoardAdminDto, UpdateOrganizationDto, UpdateAdminProfileDto, ChangePasswordDto } from "./dtos";
import { validateDto } from "../../middlewares";


const adminController = new AdminController();
const router = Router();

router.post(
  "/onboard",
  validateDto(onBoardAdminDto),
  adminController.onBoardAdmin
);
router.post("/login", validateDto(LoginDto), adminController.loginAdmin);
router.get("/dashboard", authGuard, adminController.getDashboard);

router.get("/organization", authGuard, adminController.getOrganization);
router.patch("/organization", authGuard, validateDto(UpdateOrganizationDto), adminController.updateOrganization);


router.get("/profile", authGuard, adminController.getProfile);
router.patch("/profile", authGuard, validateDto(UpdateAdminProfileDto), adminController.updateProfile);
router.patch("/change-password", authGuard, validateDto(ChangePasswordDto), adminController.changePassword);

export default router;
