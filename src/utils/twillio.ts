import twilio from 'twilio';

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
    fromNumber: string
  ): Promise<void> {
    try {
      const formattedTo = this.formatWhatsAppNumber(to);
      const formattedFrom = this.formatWhatsAppNumber(fromNumber);

      const messageResponse = await this.client.messages.create({
        body: message,
        from: formattedFrom,
        to: formattedTo
      });

      console.log(`WhatsApp message sent successfully. SID: ${messageResponse.sid}`);
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw new Error(`WhatsApp message failed: ${error}`);
    }
  }

  private formatWhatsAppNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (!cleanNumber.startsWith('1') && cleanNumber.length === 10) {
      return `whatsapp:+1${cleanNumber}`;
    }
    
    if (!cleanNumber.startsWith('+')) {
      return `whatsapp:+${cleanNumber}`;
    }
    
    return `whatsapp:${cleanNumber}`;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      return lookup.phoneNumber !== null;
    } catch (error) {
      console.error('Phone number validation failed:', error);
      return false;
    }
  }

}

export const twilioService = new TwilioService();