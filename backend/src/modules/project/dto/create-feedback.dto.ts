import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'The feedback text',
    example: 'Great translation!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
