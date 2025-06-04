import twilio from "twilio";

export class TwilioService {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    this.client = twilio(accountSid, authToken);
  }
  async sendWhatsAppMessage(
    to: string,
    message: string,
    from: string = process.env.TWILIO_WHATSAPP_FROM || ""
  ): Promise<string> {
    if (!to || to.trim() === "") {
      throw new Error("Recipient phone number is required");
    }

    if (!message || message.trim() === "") {
      throw new Error("Message content is required");
    }

    if (!from || from.trim() === "") {
      throw new Error("Twilio WhatsApp sender number not configured");
    }

    try {
      console.log(
        `Sending WhatsApp message to ${to} from ${from}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
      );

      const formattedTo = this.formatWhatsAppNumber(to);
      const formattedFrom = this.formatWhatsAppNumber(from);

      const messageResponse = await this.client.messages.create({
        body: message,
        from: formattedFrom,
        to: formattedTo,
      });

      console.log(
        `WhatsApp message sent successfully. SID: ${messageResponse.sid}, Status: ${messageResponse.status}`
      );

      return messageResponse.sid;
    } catch (error: any) {
      console.error("Failed to send WhatsApp message:", {
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo,
        to,
        from
      });
      
      // Provide more specific error messages based on Twilio error codes
      if (error.code === 21211) {
        throw new Error("Invalid WhatsApp number format");
      } else if (error.code === 21614) {
        throw new Error("WhatsApp number is not valid or verified");
      } else if (error.code === 20003) {
        throw new Error("Authentication failed - check Twilio credentials");
      }
      
      throw new Error(`WhatsApp message failed: ${error.message}`);
    }
  }

  private formatWhatsAppNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.trim() === "") {
      throw new Error("Phone number is required and cannot be empty");
    }

    return phoneNumber.startsWith("whatsapp:")
      ? phoneNumber
      : `whatsapp:${phoneNumber}`;
  }
}

export const twilioService = new TwilioService();
