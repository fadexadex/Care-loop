import { prisma } from "../../utils/db";
import { CreatePatientAndFollowupDto } from "./dtos";
import FollowUpSchedulerService from "../../utils/followup-scheduler";

const followUpScheduler = new FollowUpSchedulerService();

export class PatientRepository {
  async createPatientAndFollowUp(dto: CreatePatientAndFollowupDto) {
    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: dto.patient,
      });

      const followUp = await tx.followUp.create({
        data: {
          ...dto.followUp,
          patientId: patient.id,
        },
      });
      console.log(followUp.scheduledAt)
      console.log(new Date().toISOString())
      const delay =
        new Date(followUp.scheduledAt).getTime() - new Date().getTime();

      console.log(delay)

      await followUpScheduler.scheduleFollowUpMessage(
        followUp.id,
        patient.id,
        patient.doctorId,
        followUp.scheduledAt,
        delay
      );

      return {
        patient,
        followUp,
      };
    });
  }

  async findPatientById(id: string) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
        },
        followUps: true,
      },
    });
  }

  async findPatientsByDoctor(doctorId: string) {
    return prisma.patient.findMany({
      where: { doctorId },
      include: {
        followUps: {
          orderBy: {
            scheduledAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getPatientDetails(patientId: string, doctorId: string) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId, 
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
        followUps: {
          orderBy: {
            scheduledAt: "desc",
          },
        },
        _count: {
          select: {
            messages: true,
            followUps: true,
          },
        },
      },
    });

    if (!patient) {
      return null;
    }

    const [recentMessages, upcomingFollowUps, completedFollowUps] = await Promise.all([
      prisma.message.count({
        where: {
          patientId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          },
        },
      }),
      prisma.followUp.count({
        where: {
          patientId,
          completedAt: null,
          scheduledAt: {
            gte: new Date(),
          },
        },
      }),
      prisma.followUp.count({
        where: {
          patientId,
          completedAt: { not: null },
        },
      }),
    ]);

    return {
      ...patient,
      stats: {
        totalMessages: patient._count.messages,
        totalFollowUps: patient._count.followUps,
        recentMessages,
        upcomingFollowUps,
        completedFollowUps,
      },
    };
  }
}
