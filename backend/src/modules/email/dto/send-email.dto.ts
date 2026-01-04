import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  to: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
