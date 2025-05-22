import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { PatientService } from "./service";

const patientService = new PatientService();

export class PatientController {

}
