import { prisma } from "../../utils/db";
import { CreateDoctorDto, CreateInviteDto } from "./dtos";

export class DoctorRepository {
  createInvite(dto: CreateInviteDto) {
    return prisma.invite.create({
      data: dto,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  findToken(token: string) {
    return prisma.invite.findUnique({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  createDoctor(dto: CreateDoctorDto) {
    const { token, ...doctorData } = dto;
    return prisma.doctor.create({ data: doctorData });
  }

  findDoctorByEmail(email: string) {
    return prisma.doctor.findUnique({
      where: {
        email,
      },
    });
  }

  getDoctorBySlug(slug: string) {
    return prisma.doctor.findUnique({
      where: {
      slug,
      },
      select: {
      id: true,
      name: true,
      },
    });
  }

  markedTokenAsUsed(token: string) {
    return prisma.invite.update({
      where: {
        token,
      },
      data: {
        status: "USED",
      },
    });
  }

  findValidInvite(doctorEmail: string) {
    return prisma.invite.findUnique({
      where: {
        doctorEmail,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }
}
