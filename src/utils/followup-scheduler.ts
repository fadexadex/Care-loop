import { Queue, Worker } from "bullmq";
import dotenv from "dotenv";
import { prisma } from "./db";
import { twilioService } from "./twillio";
import { AIRepository } from "../modules/ai/repository";

dotenv.config();

interface FollowUpData {
  id: string;
  visitSummary: string | null;
  patientId: string;
  doctorId: string;
  patient: {
    name: string;
    phone: string;
  };
  doctor: {
    name: string;
    organization: {
      name: string;
    } | null;
  };
}

const redisConnection = {
  password: process.env.REDIS_PASSWORD || "",
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

class FollowUpSchedulerService {
  private followUpQueue: Queue;
  private aiRepository: AIRepository;

  constructor() {
    this.followUpQueue = new Queue("follow-up-messages", {
      connection: redisConnection,
    });
    this.aiRepository = new AIRepository();
    this.initializeFollowUpWorker();
  }

  private async initializeFollowUpWorker() {
    new Worker(
      "follow-up-messages",
      async (job) => {
        const { followUpId, patientId, doctorId, scheduledAt } = job.data;

        try {
          const followUp = await prisma.followUp.findUnique({
            where: { id: followUpId },
            select: {
              id: true,
              visitSummary: true,
              patientId: true,
              doctorId: true,
              patient: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              doctor: {
                select: {
                  name: true,
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });
          if (!followUp) {
            console.error(`Follow-up with ID ${followUpId} not found`);
            return;
          }

          await this.sendFollowUpMessage(followUp);
        } catch (error) {
          console.error("Failed to process follow-up message:", error);
          throw error;
        }
      },
      {
        connection: redisConnection,
      }
    );
  }
  private async sendFollowUpMessage(followUp: FollowUpData) {
    try {
      const { patient, doctor } = followUp;

      if (!patient || !patient.phone) {
        console.error("Patient phone number is missing");
        return;
      }
      console.log(`Processing follow-up message for patient: ${patient.name}`);

      const firstName = patient.name.split(" ")[0];
      const organizationName = doctor.organization?.name;
      const visitReason = followUp.visitSummary;

      const currentHour = new Date().getHours();
      let greeting;

      if (currentHour >= 5 && currentHour < 12) {
        greeting = "Good morning";
      } else if (currentHour >= 12 && currentHour < 17) {
        greeting = "Good afternoon";
      } else if (currentHour >= 17 && currentHour < 21) {
        greeting = "Good evening";
      } else {
        greeting = "Hello";
      }

      const message = `${greeting} ${firstName}, this is your virtual health assistant for Dr. ${doctor.name} from ${organizationName}. Just checking in after your recent visit for ${visitReason}. How are you feeling today?`;

      await this.aiRepository.saveMessage({
        patientId: followUp.patientId,
        doctorId: followUp.doctorId,
        direction: "OUTBOUND",
        content: message,
        channel: "WHATSAPP",
        status: "SENT",
      });

      await twilioService.sendWhatsAppMessage(patient.phone, message);

      console.log(
        `Successfully sent WhatsApp message to ${patient.phone} for follow-up ${followUp.id}`
      );
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      throw error;
    }
  }

  async scheduleFollowUpMessage(
    followUpId: string,
    patientId: string,
    doctorId: string,
    scheduledAt: Date,
    delay: number
  ) {
    try {
      await this.followUpQueue.add(
        "send-follow-up-message",
        {
          followUpId,
          patientId,
          doctorId,
          scheduledAt: scheduledAt.toISOString(),
        },
        { delay }
      );

      console.log(
        `Scheduled follow-up message for follow-up ${followUpId} with delay ${delay}ms`
      );
    } catch (error) {
      console.error("Failed to schedule follow-up message:", error);
      throw new Error("Failed to schedule follow-up message");
    }
  }
}

export default FollowUpSchedulerService;
