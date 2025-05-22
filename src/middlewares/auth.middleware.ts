import { StatusCodes } from "http-status-codes";
import { AppError } from "./error.handler";
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
      throw new AppError("Token not provided", StatusCodes.UNAUTHORIZED);
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError("Invalid token", StatusCodes.UNAUTHORIZED));
  }
};

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user.role !== "ADMIN") {
      throw new AppError("Not authorized", StatusCodes.FORBIDDEN);
    }
    next();
  } catch (error) {
    next(new AppError("Not authorized", StatusCodes.FORBIDDEN));
  }
};

export const doctorGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user.role !== "DOCTOR") {
      throw new AppError("Not authorized", StatusCodes.FORBIDDEN);
    }
    next();
  } catch (error) {
    next(new AppError("Not authorized", StatusCodes.FORBIDDEN));
  }
}

