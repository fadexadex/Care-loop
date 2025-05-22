import { AdminController } from "./controller";
import { Router } from "express";
import { authGuard } from "../../middlewares";
import { LoginDto, onBoardAdminDto } from "./dtos";
import { validateDto } from "../../middlewares";


const adminController = new AdminController();
const router = Router();

router.post(
  "/onboard",
  validateDto(onBoardAdminDto),
  adminController.onBoardAdmin
);
router.post("/login", validateDto(LoginDto), adminController.loginAdmin); 

export default router;
