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
}
