import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  /**
   * Initializes the mail transporter using configured host/port.
   */
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST') || 'localhost',
      port: this.configService.getOrThrow<number>('MAIL_PORT') || 1025,
      ignoreTLS: true,
    });
  }

  /**
   * Notifies a translator about a newly assigned project.
   */
  async sendProjectAssignedEmail(
    to: string,
    projectName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'New Project Assigned',
      text: `You have been assigned to a new project: ${projectName}. Please log in to the system to view details.`,
      html: `<p>You have been assigned to a new project: <strong>${projectName}</strong>.</p><p>Please log in to the system to view details.</p>`,
    });
  }

  /**
   * Notifies a customer that their project is completed.
   */
  async sendProjectCompletedEmail(
    to: string,
    projectName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'Project Completed',
      text: `Your project ${projectName} has been completed by the translator. Please log in to review and download the translated file.`,
      html: `<p>Your project <strong>${projectName}</strong> has been completed by the translator.</p><p>Please log in to review and download the translated file.</p>`,
    });
  }

  /**
   * Notifies a customer that the project was closed due to no available translator.
   */
  async sendProjectClosedNoTranslatorEmail(
    to: string,
    projectName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: '"PIA Translation System" <noreply@pia.com>',
      to,
      subject: 'Project Closed - No Translator Found',
      text: `We regret to inform you that no suitable translator was found for your project: ${projectName}. The project has been closed.`,
      html: `<p>We regret to inform you that no suitable translator was found for your project: <strong>${projectName}</strong>.</p><p>The project has been closed.</p>`,
    });
  }

  /**
   * Sends a generic email message to one or more recipients.
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
  ): Promise<void> {
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
