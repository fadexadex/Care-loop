import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { PatientService } from "./service";

const patientService = new PatientService();

export class PatientController {

  async createPatientAndFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await patientService.createPatientAndFollowUp(req.body);
      return res.status(StatusCodes.CREATED).json({
        status: "success",
        message: "Patient and follow-up created successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "fail",
          message: "Patient ID is required"
        });
      }
      
      const patient = await patientService.getPatientById(id);
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Patient retrieved successfully",
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientsByDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user.id;
      
      const patients = await patientService.getPatientsByDoctor(doctorId);
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Patients retrieved successfully",
        data: patients
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientDetails(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doctorId = req.user?.id;
      
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "fail",
          message: "Patient ID is required"
        });
      }

      if (!doctorId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Doctor authentication required"
        });
      }

      const patient = await patientService.getPatientDetails(id, doctorId);
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Patient details retrieved successfully",
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }
}
