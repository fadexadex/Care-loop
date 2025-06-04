import { Prisma } from "@prisma/client";
import { generateToken } from "./jwt";
type adminType = Omit<Prisma.AdminCreateInput, "organization">;
type doctorType = Omit<Prisma.DoctorCreateInput, "organization" | "invitedBy">;


export const sanitizeAdminAndGrantToken = (data: adminType) => {
  const { password, ...adminData } = data;
  return { 
    admin: adminData, 
    token: generateToken(adminData) 
  };
};

export const sanitizeDoctorAndGrantToken = (data: doctorType) => {
  const { password, ...doctorData } = data;
  const endOfVisitFormLink = `${process.env.FRONTEND_URL}/end-of-visit-form/${doctorData.slug}`;
  
  return { 
    doctor: {
      ...doctorData,
      endOfVisitFormLink
    }, 
    token: generateToken(doctorData) 
  };
}
