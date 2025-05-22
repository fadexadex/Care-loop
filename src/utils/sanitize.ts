import { Prisma } from "@prisma/client";
import { generateToken } from "./jwt";
type adminType = Omit<Prisma.AdminCreateInput, "organization">;
type doctorType = Omit<Prisma.DoctorCreateInput, "organization" | "invitedBy">;


export const sanitizeAdminAndGrantToken = (data: adminType) => {
  const { password, name, ...adminData } = data;
  return { adminData, token: generateToken(adminData) };
};

export const sanitizeDoctorAndGrantToken = (data: doctorType) => {
  const { password, name, ...doctorData } = data;
  return { doctorData, token: generateToken(doctorData) };
}
