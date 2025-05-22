import { AppError } from "../../middlewares/error.handler";
import { StatusCodes } from "http-status-codes";
import { CreateDoctorDto, CreateInviteDto, LoginDto } from "./dtos";
import { generateInviteToken } from "../../utils/generate.invite";
import { DoctorRepository } from "./repository";
import { comparePassword, hashPassword } from "../../utils/bcrypt";
import { sanitizeDoctorAndGrantToken } from "../../utils/sanitize";
import { generateDoctorSlug } from "../../utils/generate.slug";

const doctorRepository = new DoctorRepository();

export class DoctorService {
  async createAndSendInvite(dto: CreateInviteDto) {
    const isExistingInvite = await doctorRepository.findValidInvite(dto.doctorEmail);
    if (isExistingInvite) {
      throw new AppError(
        "An unexpired invite already exists for this email, wait till the invite expires before sending a new one",
        StatusCodes.BAD_REQUEST
      );
    }
    dto.token = generateInviteToken();

    return doctorRepository.createInvite(dto);
  }

  async verifyToken(token: string) {
    const invite = await doctorRepository.findToken(token);
    if (!invite || invite.status !== "PENDING") {
      throw new AppError(
        "Invalid, expired, or already used token",
        StatusCodes.UNAUTHORIZED
      );
    }
    return invite;
  }

  async createDoctor(dto: CreateDoctorDto) {
    const invite = await doctorRepository.findToken(dto.token);
    if (!invite || invite.status !== "PENDING" || invite.doctorEmail !== dto.email) {
      throw new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED);
    }
    dto.password = await hashPassword(dto.password);
    dto.slug = generateDoctorSlug(dto.name);
    const doctor = await doctorRepository.createDoctor(dto);
    await doctorRepository.markedTokenAsUsed(dto.token);

    return sanitizeDoctorAndGrantToken(doctor);
  }

  async loginDoctor(dto: LoginDto) {
    const doctor = await doctorRepository.findDoctorByEmail(dto.email);
    if (!doctor) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }
    const isPasswordValid = comparePassword(dto.password, doctor.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }
    return sanitizeDoctorAndGrantToken(doctor);
  }

  async getDoctorBySlug(slug: string) {
    const doctor = await doctorRepository.getDoctorBySlug(slug);
    if (!doctor) {
      throw new AppError("Doctor not found", StatusCodes.NOT_FOUND);
    }
    return doctor;
  }
}
