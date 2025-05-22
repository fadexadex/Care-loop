import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { DoctorService } from "./service";
import EmailService from "../../utils/nodemailer";

const doctorService = new DoctorService();
const emailService = new EmailService();

export class DoctorController {
  async createAndSendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await doctorService.createAndSendInvite(req.body);
      setImmediate(() => {
        emailService.sendDoctorInvite({
          email: invite.doctorEmail,
          name: invite.doctorName,
          organizationName: invite.organization.name,
          inviteLink: `${process.env.FRONTEND_URL}/accept-invite`,
          token: invite.token,
        });
      });
      res
        .status(StatusCodes.CREATED)
        .json({ status: "success", message: "Invite sent successfully" });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      if (!token) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ status: "fail", message: "Token is required" });
      }
      const invite = await doctorService.verifyToken(token);
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Token validated successfully",
        invite,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.token = req.params.token;
      if (!req.body.token) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ status: "fail", message: "Token is required" });
      }
      const doctor = await doctorService.createDoctor(req.body);
      res
        .status(StatusCodes.CREATED)
        .json({
          status: "success",
          message: "Doctor created successfully",
          doctor,
        });
    } catch (error) {
      next(error);
    }
  }

  async loginDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.loginDoctor(req.body);
      res
        .status(StatusCodes.OK)
        .json({ status: "success", message: "Login successful", doctor });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      if (!slug) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ status: "fail", message: "Slug is required" });
      }
      const doctor = await doctorService.getDoctorBySlug(slug);
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Doctor retrieved successfully",
        doctor,
      });
    } catch (error) {
      next(error);
    }
  }
}
