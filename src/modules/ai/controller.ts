import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AIRepository } from "./repository";
import { aiService } from "../../utils/ai-service";
import { twilioService } from "../../utils/twillio";
import EmailService from "../../utils/nodemailer";

const aiRepository = new AIRepository();
const emailService = new EmailService();

export class AIController {
  private async handleHelpTrigger(patient: any, originalMessage: string) {
    try {
      await aiRepository.saveMessage({
        patientId: patient.id,
        doctorId: patient.doctorId,
        direction: "OUTBOUND",
        channel: "WHATSAPP",
        content:
          "We've received your help request. A healthcare professional will reach out shortly.",
        status: "SENT",
      });

      await emailService.sendDoctorNotification({
        doctorEmail: patient.doctor.email,
        doctorName: patient.doctor.name,
        patientName: patient.name,
        patientId: patient.id,
        organizationName: patient.doctor.organization.name,
        message: originalMessage,
        urgentFlag: true,
      });

      return "We've received your help request. A healthcare professional will reach out shortly.";
    } catch (error) {
      console.error("Error handling help trigger:", error);

      await aiRepository.saveMessage({
        patientId: patient.id,
        doctorId: patient.doctorId,
        direction: "OUTBOUND",
        channel: "WHATSAPP",
        content:
          "I understand you need help. Please contact your healthcare provider directly for immediate assistance.",
        status: "SENT",
      });

      return "I understand you need help. Please contact your healthcare provider directly for immediate assistance.";
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { From, Body, MessageSid } = req.body;

      if (!From || !Body) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Missing required fields: From or Body",
        });
      }

      const phoneNumber = From.replace("whatsapp:", "");
      const patient = await aiRepository.findPatientByPhone(phoneNumber);

      console.log(patient);

      if (!patient) {
        setImmediate(async () => {
          try {
            await twilioService.sendWhatsAppMessage(
              phoneNumber,
              "Thank you for your message. We couldn't find your patient record. Please contact your healthcare provider directly."
            );
          } catch (error) {
            console.error("Error sending unknown patient response:", error);
          }
        });
        return res.status(StatusCodes.OK).json({
          status: "success",
          message: "Processing message",
        });
      }
      setImmediate(async () => {
        try {
          await aiRepository.saveMessage({
            patientId: patient.id,
            doctorId: patient.doctorId,
            direction: "INBOUND",
            channel: "WHATSAPP",
            content: Body,
            status: "DELIVERED",
          });
          const normalizedMessage = Body.trim().toLowerCase();
          let responseMessage: string;
          const activeFollowUp = patient.followUps[0];

          if (activeFollowUp?.completedAt) {
            console.log("Active follow-up is already completed.");
            if (["help", "support", "urgent"].includes(normalizedMessage)) {
              await aiRepository.createNewFollowUp(
                patient.id,
                patient.doctorId
              );
              responseMessage = await this.handleHelpTrigger(patient, Body);
            } else {
              await aiRepository.saveMessage({
                patientId: patient.id,
                doctorId: patient.doctorId,
                direction: "OUTBOUND",
                channel: "WHATSAPP",
                content:
                  "This follow-up is already complete. If you need help, reply with 'HELP'.",
                status: "SENT",
              });
              responseMessage =
                "This follow-up is already complete. If you need help, reply with 'HELP'.";
            }
          } else if (
            ["help", "support", "urgent"].includes(normalizedMessage)
          ) {
            responseMessage = await this.handleHelpTrigger(patient, Body);
          } else {
            const previousMessages = await aiRepository.getPatientMessages(
              patient.id,
              8
            );

            console.log("Previous messages:", previousMessages);

            const patientContext = {
              patientName: patient.name,
              doctorName: patient.doctor.name,
              organizationName: patient.doctor.organization.name,
              diagnosis: patient.followUps[0]?.diagnosis || "",
              prescription: patient.followUps[0]?.prescription || "",
              visitSummary: patient.followUps[0]?.visitSummary || "",
              previousMessages: previousMessages.map((msg) => ({
                sender:
                  msg.direction === "INBOUND"
                    ? ("patient" as const)
                    : ("system" as const),
                text: msg.content,
              })),
            };

            console.log("Patient context:", patientContext);

            const aiResponse = await aiService.generateFollowUpMessage(
              patientContext
            );

            console.log("AI Response:", aiResponse);
            responseMessage = aiResponse.message;
            await aiRepository.saveMessage({
              patientId: patient.id,
              doctorId: patient.doctorId,
              direction: "OUTBOUND",
              channel: "WHATSAPP",
              content: aiResponse.message,
              status: "SENT",
            });

            console.log(activeFollowUp)
            if (aiResponse.endOfConversation && activeFollowUp?.id) {
              console.log("I entered end of conversation block");
              await aiRepository.completeFollowUp(activeFollowUp.id);
            }

            if (aiResponse.doctorInterventionRequired) {
              console.log(
                `Doctor intervention required for patient: ${patient.name}`
              );

              await emailService.sendDoctorNotification({
                doctorEmail: patient.doctor.email,
                doctorName: patient.doctor.name,
                patientName: patient.name,
                patientId: patient.id,
                organizationName: patient.doctor.organization.name,
                message: Body,
                urgentFlag: aiResponse.doctorInterventionRequired,
              });
            }
          }

          try {
            await twilioService.sendWhatsAppMessage(
              phoneNumber,
              responseMessage
            );
          } catch (error) {
            console.error("Error sending WhatsApp message:", error);
          }
        } catch (error) {
          console.error("Background processing error:", error);

          try {
            await twilioService.sendWhatsAppMessage(
              phoneNumber,
              "I'm having trouble processing your message right now. Please try again later or contact your healthcare provider directly."
            );
          } catch (twilioError) {
            console.error("Error sending fallback message:", twilioError);
          }
        }
      });

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Message received and processing",
      });
    } catch (error) {
      console.error("Webhook error:", error);
      next(error);
    }
  }
}
