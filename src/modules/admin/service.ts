import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.handler";
import { StatusCodes } from "http-status-codes";
import { AdminRepository } from "./repository";
import { LoginDto, onBoardAdminDto } from "./dtos";
import { comparePassword, hashPassword } from "../../utils/bcrypt";
import {sanitizeAdminAndGrantToken} from "../../utils/sanitize";

const adminRepo = new AdminRepository();

export class AdminService {
  onBoardAdmin = async (dto: onBoardAdminDto) => {
    const existingAdmin = await adminRepo.findAdminByEmail(dto.email);
    if (existingAdmin) {
      throw new AppError(
        "An Admin with this email already exists",
        StatusCodes.BAD_REQUEST
      );
    }
    dto.password = await hashPassword(dto.password);
    const admin = await adminRepo.onBoardAdmin(dto);
    return sanitizeAdminAndGrantToken(admin);
  };

  loginAdmin = async (dto: LoginDto) => {
    const admin = await adminRepo.findAdminByEmail(dto.email);
    if (!admin) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }
    const isPasswordValid = comparePassword(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }
    return sanitizeAdminAndGrantToken(admin);
  };
}
