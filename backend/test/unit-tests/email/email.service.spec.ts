import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from '../../../src/modules/email/email.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (nodemailer.createTransport as unknown as jest.Mock).mockReturnValue({
      sendMail,
    });
  });

  it('creates transporter using MAIL_HOST and MAIL_PORT', () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'MAIL_HOST') return 'mailhog';
        if (key === 'MAIL_PORT') return 1025;
        throw new Error('unexpected');
      }),
    } as unknown as ConfigService;

    const service = new EmailService(config);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'mailhog', port: 1025, ignoreTLS: true }),
    );
  });

  it('sendEmail sends to all recipients', async () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'MAIL_HOST') return 'mailhog';
        if (key === 'MAIL_PORT') return 1025;
        throw new Error('unexpected');
      }),
    } as unknown as ConfigService;

    const service = new EmailService(config);

    await service.sendEmail(['a@a.com', 'b@b.com'], 'Sub', 'Line1\nLine2');

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'a@a.com',
        subject: 'Sub',
        text: 'Line1\nLine2',
        html: expect.stringContaining('Line1<br>Line2'),
      }),
    );
  });

  it('sendProjectAssignedEmail calls sendMail', async () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'MAIL_HOST') return 'mailhog';
        if (key === 'MAIL_PORT') return 1025;
        throw new Error('unexpected');
      }),
    } as unknown as ConfigService;

    const service = new EmailService(config);

    await service.sendProjectAssignedEmail('x@y.z', 'proj');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'x@y.z',
        subject: 'New Project Assigned',
      }),
    );
  });
});
