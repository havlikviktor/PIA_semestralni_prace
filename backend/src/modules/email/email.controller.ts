import {
  Controller,
  Post,
  Body,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { Role } from '../user/entities/user.entity';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Request() req, @Body() sendEmailDto: SendEmailDto) {
    const user = req.user;
    if (user.role !== Role.ADMINISTRATOR) {
      throw new ForbiddenException('Only administrators can send emails');
    }

    await this.emailService.sendEmail(
      sendEmailDto.to,
      sendEmailDto.subject,
      sendEmailDto.text,
    );

    return { message: 'Email sent successfully' };
  }
}
