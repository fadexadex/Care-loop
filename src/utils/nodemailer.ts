import nodemailer from "nodemailer";

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.HOST_EMAIL_ADDRESS,
        pass: process.env.HOST_EMAIL_PASSWORD,
      },
    });
  }

  async sendMail(to: string | string[], subject: string, text?: string, html?: string) {
    const mailOptions = {
      from: `Careloop <${process.env.HOST_EMAIL_ADDRESS}>`,
      to,
      subject,
      text: text || "",
      html: html || "",
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({ message: "Mail sent", email: to });
        }
      });
    });
  }

  async sendDoctorInvite(dto: {
    email: string;
    name: string;
    organizationName: string;
    inviteLink: string;
    token: string;
  }) {
    const subject = `You're Invited to Join ${dto.organizationName} on Careloop`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Invitation to Join ${dto.organizationName}</h2>
        <p>Dear Dr. ${dto.name},</p>
        <p>You have been invited by an admin to join <strong>${dto.organizationName}</strong> on Careloop.</p>
        <p>Please click the button below to accept your invite and complete your registration:</p>
        <p>
          <a href="${dto.inviteLink}?token=${dto.token}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
            Accept Invite
          </a>
        </p>
        <p>If the button above does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${dto.inviteLink}?token=${dto.token}</p>
        <p>This invite will expire in 7 days.</p>
        <p>Best regards,<br/><strong>Careloop Team</strong></p>
      </div>
    `;
    await this.sendMail(dto.email, subject, undefined, html);
  }
}

export default EmailService;