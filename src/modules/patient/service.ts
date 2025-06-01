import { AppError } from "../../middlewares/error.handler";
import { StatusCodes } from "http-status-codes";
import { PatientRepository } from "./repository";
import { CreatePatientAndFollowupDto } from "./dtos";

const patientRepository = new PatientRepository();

export class PatientService {

  async createPatientAndFollowUp(dto: CreatePatientAndFollowupDto) {
    if (dto.patient.doctorId !== dto.followUp.doctorId) {
      throw new AppError(
        "Doctor ID must match between patient and follow-up",
        StatusCodes.BAD_REQUEST
      );
    }

    return patientRepository.createPatientAndFollowUp(dto);
  }

  async getPatientById(id: string) {
    const patient = await patientRepository.findPatientById(id);
    if (!patient) {
      throw new AppError("Patient not found", StatusCodes.NOT_FOUND);
    }
    return patient;
  }

  async getPatientsByDoctor(doctorId: string) {
    return patientRepository.findPatientsByDoctor(doctorId);
  }
}
