import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: 'List of recipient email addresses', example: ['user@example.com'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  to: string[];

  @ApiProperty({ description: 'Subject of the email', example: 'Welcome!' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Body text of the email', example: 'Hello, welcome to our platform.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}