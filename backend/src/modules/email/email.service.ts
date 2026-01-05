import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT || '1025'),
      ignoreTLS: true,
    });
  }

  async sendProjectAssignedEmail(to: string, projectName: string) {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'New Project Assigned',
      text: `You have been assigned to a new project: ${projectName}. Please log in to the system to view details.`,
      html: `<p>You have been assigned to a new project: <strong>${projectName}</strong>.</p><p>Please log in to the system to view details.</p>`,
    });
  }

  async sendProjectCompletedEmail(to: string, projectName: string) {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'Project Completed',
      text: `Your project ${projectName} has been completed by the translator. Please log in to review and download the translated file.`,
      html: `<p>Your project <strong>${projectName}</strong> has been completed by the translator.</p><p>Please log in to review and download the translated file.</p>`,
    });
  }

  async sendProjectClosedNoTranslatorEmail(to: string, projectName: string) {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'Project Closed - No Translator Found',
      text: `We regret to inform you that no suitable translator was found for your project: ${projectName}. The project has been closed.`,
      html: `<p>We regret to inform you that no suitable translator was found for your project: <strong>${projectName}</strong>.</p><p>The project has been closed.</p>`,
    });
  }

  async sendEmail(to: string | string[], subject: string, text: string) {
    const recipients = Array.isArray(to) ? to : [to];

    await Promise.all(
      recipients.map((recipient) =>
        this.transporter.sendMail({
          from: '"PIA Translation System" <noreply@pia.com>',
          to: recipient,
          subject,
          text,
          html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
        }),
      ),
    );
  }
}
