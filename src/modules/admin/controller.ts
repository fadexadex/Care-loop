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
  }
}
