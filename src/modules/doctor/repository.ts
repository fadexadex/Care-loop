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
  async getDoctorDashboard(doctorId: string) {
    // Get doctor details first
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            organizatonLine: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const [
      totalPatients,
      patients,
      activeFollowUps,
      criticalAlerts,
      recentMessages,
      completedFollowUps
    ] = await Promise.all([
      // Total patients count
      prisma.patient.count({
        where: { doctorId }
      }),

      // All patients with basic info
      prisma.patient.findMany({
        where: { doctorId },
        select: {
          id: true,
          name: true,
          phone: true,
          age: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              messages: true,
              followUps: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit to recent 20 patients
      }),

      // Active follow-ups (not completed)
      prisma.followUp.findMany({
        where: {
          doctorId,
          completedAt: null
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true
            }
          }
        },
        orderBy: { scheduledAt: 'asc' }
      }),

      // Critical alerts (critical flag true and not completed)
      prisma.followUp.findMany({
        where: {
          doctorId,
          criticalFlag: true,
          completedAt: null
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true
            }
          }
        },
        orderBy: { scheduledAt: 'asc' }
      }),

      // Recent messages (last 15)
      prisma.message.findMany({
        where: { doctorId },
        include: {
          patient: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      }),

      // Completed follow-ups count
      prisma.followUp.count({
        where: {
          doctorId,
          completedAt: { not: null }
        }
      })
    ]);

    const [todayMessages, weeklyMessages, activePatients] = await Promise.all([
      prisma.message.count({
        where: {
          doctorId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      prisma.message.count({
        where: {
          doctorId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      prisma.patient.count({
        where: {
          doctorId,
          messages: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      })
    ]);    // Construct the end of visit form link
    const endOfVisitFormLink = `${process.env.FRONTEND_URL}/end-of-visit-form/${doctor.slug}`;

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        slug: doctor.slug,
        createdAt: doctor.createdAt,
        endOfVisitFormLink,
        organization: doctor.organization,
        invitedBy: doctor.invitedBy
      },
      stats: {
        totalPatients,
        activePatients,
        activeFollowUps: activeFollowUps.length,
        criticalAlerts: criticalAlerts.length,
        completedFollowUps,
        todayMessages,
        weeklyMessages
      },
      patients,
      activeFollowUps,
      criticalAlerts,
      recentMessages
    };
  }
}
