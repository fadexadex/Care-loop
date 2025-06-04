import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

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

  async sendMail(
    to: string | string[],
    subject: string,
    text?: string,
    html?: string
  ) {
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

  async sendDoctorNotification(dto: {
    doctorEmail: string;
    doctorName: string;
    patientName: string;
    patientId: string;
    organizationName: string;
    message: string;
    urgentFlag: boolean;
  }) {
    const subject = dto.urgentFlag
      ? `🚨 URGENT: Patient ${dto.patientName} Requires Your Attention`
      : `Patient Update: ${dto.patientName} Sent a Message`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${
          dto.urgentFlag
            ? '<div style="background-color: #ff4444; color: white; padding: 10px; border-radius: 5px; margin-bottom: 20px;"><strong>🚨 URGENT ATTENTION REQUIRED</strong></div>'
            : ""
        }
        <h2 style="color: #4CAF50;">Patient Message Notification</h2>
        <p>Dear Dr. ${dto.doctorName},</p>
        <p>Your patient <strong>${
          dto.patientName
        }</strong> has sent a message that ${
      dto.urgentFlag
        ? "requires your immediate attention"
        : "you may want to review"
    }.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p><strong>Patient Message:</strong></p>
          <p style="font-style: italic;">"${dto.message}"</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL}/dashboard/patients/${
      dto.patientId
    }" style="display: inline-block; padding: 12px 24px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
            View Patient Dashboard
          </a>
        </p>
        <p>Organization: <strong>${dto.organizationName}</strong></p>
        <p>Best regards,<br/><strong>Careloop AI Assistant</strong></p>
      </div>
    `;
    await this.sendMail(dto.doctorEmail, subject, undefined, html);
  }
}

export default EmailService;
