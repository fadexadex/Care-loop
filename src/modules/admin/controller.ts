import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AdminService } from "./service";
import { generateToken } from "../../utils/jwt";

const adminService = new AdminService();

export class AdminController {
  onBoardAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await adminService.onBoardAdmin(req.body);
      return res.status(StatusCodes.CREATED).json({
        status: "success",
        data: {
          admin,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await adminService.loginAdmin(req.body);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: {
         admin
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }
      
      const stats = await adminService.getDashboardStats(adminId);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }

      const organization = await adminService.updateOrganization(adminId, req.body);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: { organization }
      });
    } catch (error) {
      next(error);
    }
  };

  getOrganization = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }

      const organization = await adminService.getOrganizationDetails(adminId);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: { organization }
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }

      const admin = await adminService.updateAdminProfile(adminId, req.body);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }

      const admin = await adminService.getAdminProfile(adminId);
      return res.status(StatusCodes.OK).json({
        status: "success",
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Admin authentication required"
        });
      }

      await adminService.changePassword(adminId, req.body);
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Password changed successfully"
      });
    } catch (error) {
      next(error);
    }
  };
}
