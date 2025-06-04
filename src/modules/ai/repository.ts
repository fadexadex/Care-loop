import { prisma } from "../../utils/db";

interface SaveMessageDto {
  patientId: string;
  doctorId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: "WHATSAPP" | "SMS";
  content: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
}

export class AIRepository {
  async findPatientByPhone(phoneNumber: string) {
    return prisma.patient.findFirst({
      where: {
        phone: phoneNumber,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        followUps: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            diagnosis: true,
            prescription: true,
            visitSummary: true,
            completedAt: true,
          },
        },
      },
    });
  }

  async saveMessage(dto: SaveMessageDto) {
    return prisma.message.create({
      data: dto,
    });
  }

  async getPatientMessages(patientId: string, limit: number = 10) {
    return prisma.message.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        direction: true,
        content: true,
        createdAt: true,
      },
    });
  }


  async completeFollowUp(followUpId: string) {
    return prisma.followUp.update({
      where: { id: followUpId },
      data: { completedAt: new Date() },
    });
  }

  async createNewFollowUp(patientId: string, doctorId: string) {
    const scheduledAt = new Date(Date.now() + 60 * 1000);

    return prisma.followUp.create({
      data: {
        patientId,
        doctorId,
        scheduledAt,
        visitSummary: "General check-in follow-up",
        diagnosis: "Follow-up consultation",
        prescription: "As previously prescribed",
        doctorNotes: "Patient requested continued support",
        notes: "Automated follow-up created from help request",
        criticalFlag: false,
      },
    });
  }
}
