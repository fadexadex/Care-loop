import { Queue, Worker } from "bullmq";
import dotenv from "dotenv";
import { prisma } from "./db";
import { twilioService } from "./twillio.js";

dotenv.config();

const redisConnection = {
  password: process.env.REDIS_PASSWORD || "",
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

class FollowUpSchedulerService {
  private followUpQueue: Queue;

  constructor() {
    this.followUpQueue = new Queue("follow-up-messages", {
      connection: redisConnection,
    });
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
            include: {
              patient: true,
              doctor: true,
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
  private async sendFollowUpMessage(followUp: any) {
    try {
      const { patient } = followUp;
      console.log(
        `Processing follow-up message for patient: ${patient.firstName} ${patient.lastName}`
      );
      console.log(`Follow-up type: ${followUp.type}`);
      console.log(
        `Scheduled at: ${new Date(followUp.scheduledAt).toLocaleString()}`
      );

      const message = `Hello ${patient.firstName}! This is a scheduled follow-up message from your healthcare provider. Please contact us if you have any questions.`;

      await twilioService.sendFollowUpMessage(patient.phoneNumber, message);

      console.log(
        `Successfully sent WhatsApp message to ${patient.phoneNumber}`
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
