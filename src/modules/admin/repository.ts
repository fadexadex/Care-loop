import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/db";
import { onBoardAdminDto } from "./dtos";

export class AdminRepository {
  async onBoardAdmin(dto: onBoardAdminDto) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          organizatonLine: dto.organizationLine
        },
      });
      const { organizationName, organizationLine, ...adminData } = dto;
      const admin = await tx.admin.create({
        data: {
          ...adminData,
          organizationId: org.id,
        },
      });
      return admin;
    });
  }

  async findAdminByEmail(email: string) {
    return prisma.admin.findUnique({
      where: {
        email,
      },
    });
  }
}
