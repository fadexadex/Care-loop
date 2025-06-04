import { AppError } from "../../middlewares/error.handler";
import { StatusCodes } from "http-status-codes";
import { AdminRepository } from "./repository";
import { LoginDto, onBoardAdminDto, UpdateOrganizationDto, UpdateAdminProfileDto, ChangePasswordDto } from "./dtos";
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
  getDashboardStats = async (adminId: string) => {
    const stats = await adminRepo.getDashboardStats(adminId);
    return stats;
  };

  updateOrganization = async (adminId: string, dto: UpdateOrganizationDto) => {
    if (!dto.name && !dto.organizatonLine) {
      throw new AppError("At least one field must be provided", StatusCodes.BAD_REQUEST);
    }
    return await adminRepo.updateOrganization(adminId, dto);
  };

  getOrganizationDetails = async (adminId: string) => {
    const organization = await adminRepo.getOrganizationDetails(adminId);
    if (!organization) {
      throw new AppError("Organization not found", StatusCodes.NOT_FOUND);
    }
    return organization;
  };

  updateAdminProfile = async (adminId: string, dto: UpdateAdminProfileDto) => {
    if (!dto.name && !dto.email) {
      throw new AppError("At least one field must be provided", StatusCodes.BAD_REQUEST);
    }
    try {
      return await adminRepo.updateAdminProfile(adminId, dto);
    } catch (error: any) {
      if (error.message === "Email already in use") {
        throw new AppError("Email already in use", StatusCodes.CONFLICT);
      }
      throw error;
    }
  };

  getAdminProfile = async (adminId: string) => {
    const admin = await adminRepo.getAdminProfile(adminId);
    if (!admin) {
      throw new AppError("Admin not found", StatusCodes.NOT_FOUND);
    }
    return admin;
  };

  changePassword = async (adminId: string, dto: ChangePasswordDto) => {
    const admin = await adminRepo.findAdminByEmail("");
    const adminWithPassword = await adminRepo.getAdminProfile(adminId);
    
    if (!adminWithPassword) {
      throw new AppError("Admin not found", StatusCodes.NOT_FOUND);
    }

    const adminFull = await adminRepo.findAdminByEmail(adminWithPassword.email);
    if (!adminFull) {
      throw new AppError("Admin not found", StatusCodes.NOT_FOUND);
    }

    const isCurrentPasswordValid = comparePassword(dto.currentPassword, adminFull.password);
    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", StatusCodes.UNAUTHORIZED);
    }

    const hashedNewPassword = await hashPassword(dto.newPassword);
    return await adminRepo.changeAdminPassword(adminId, hashedNewPassword);
  };
}
