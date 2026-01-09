import {
  Controller,
  Post,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { Role } from '../user/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only administrators can send emails.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async sendEmail(
    @Req() req: ExpressRequest & { user: { role: Role } },
    @Body() sendEmailDto: SendEmailDto,
  ) {
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
