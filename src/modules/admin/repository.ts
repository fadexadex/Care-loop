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

  async getDashboardStats(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { organizationId: true }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }    const [
      totalDoctors,
      doctors,
      totalPatients,
      activePatients,
      totalMessages,
      recentMessages,
      criticalFollowUps,
      pendingInvites,
      acceptedInvites,
      completedFollowUps,
      activeFollowUps
    ] = await Promise.all([
      prisma.doctor.count({
        where: { organizationId: admin.organizationId }
      }),
        prisma.doctor.findMany({
        where: { organizationId: admin.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          slug: true,
          createdAt: true,
          _count: {
            select: {
              patients: true,
              messages: true,
              followUps: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.patient.count({
        where: { doctor: { organizationId: admin.organizationId } }
      }),
      
      prisma.patient.count({
        where: {
          doctor: { organizationId: admin.organizationId },
          messages: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      
      prisma.message.count({
        where: { doctor: { organizationId: admin.organizationId } }
      }),
      
      prisma.message.findMany({
        where: { doctor: { organizationId: admin.organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } }
        }
      }),
      
      prisma.followUp.findMany({
        where: {
          doctor: { organizationId: admin.organizationId },
          criticalFlag: true,
          completedAt: null
        },
        include: {
          patient: { select: { name: true, phone: true } },
          doctor: { select: { name: true } }
        },
        orderBy: { scheduledAt: 'asc' }
      }),
        prisma.invite.findMany({
        where: {
          organizationId: admin.organizationId,
          status: 'PENDING'
        },
        select: {
          id: true,
          doctorEmail: true,
          doctorName: true,
          token: true,
          createdAt: true,
          expiresAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.invite.findMany({
        where: {
          organizationId: admin.organizationId,
          status: 'USED'
        },
        select: {
          id: true,
          doctorEmail: true,
          doctorName: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.followUp.count({
        where: {
          doctor: { organizationId: admin.organizationId },
          completedAt: { not: null }
        }
      }),
      
      prisma.followUp.count({
        where: {
          doctor: { organizationId: admin.organizationId },
          completedAt: null
        }
      })
    ]);

    const todayMessages = await prisma.message.count({
      where: {
        doctor: { organizationId: admin.organizationId },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const organizationInfo = await prisma.organization.findUnique({
      where: { id: admin.organizationId },
      select: { name: true, organizatonLine: true }
    });    return {
      organization: organizationInfo,
      stats: {
        totalDoctors,
        totalPatients,
        activePatients,
        totalMessages,
        todayMessages,
        pendingInvites: pendingInvites.length,
        completedFollowUps,
        activeFollowUps
      },
      doctors,
      recentMessages,
      criticalAlerts: criticalFollowUps,
      invites: {
        pending: pendingInvites,
        used: acceptedInvites
      }
    };
  }

  async updateOrganization(adminId: string, updateData: { name?: string; organizatonLine?: string }) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { organizationId: true }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    return prisma.organization.update({
      where: { id: admin.organizationId },
      data: updateData,
      select: {
        id: true,
        name: true,
        organizatonLine: true,
        createdAt: true
      }
    });
  }

  async getOrganizationDetails(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { organizationId: true }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    return prisma.organization.findUnique({
      where: { id: admin.organizationId },
      select: {
        id: true,
        name: true,
        organizatonLine: true,
        createdAt: true,
        _count: {
          select: {
            doctors: true,
            admins: true,
            invites: true
          }
        }
      }
    });
  }

  async updateAdminProfile(adminId: string, updateData: { name?: string; email?: string }) {
    if (updateData.email) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: adminId }
        }
      });

      if (existingAdmin) {
        throw new Error("Email already in use");
      }
    }

    return prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            organizatonLine: true
          }
        }
      }
    });
  }

  async getAdminProfile(adminId: string) {
    return prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            organizatonLine: true
          }
        }
      }
    });
  }

  async changeAdminPassword(adminId: string, hashedPassword: string) {
    return prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
      select: { id: true }
    });
  }
}
