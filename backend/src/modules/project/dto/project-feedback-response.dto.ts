import { ApiProperty } from '@nestjs/swagger';

export class ProjectFeedbackResponseDto {
  @ApiProperty({
    description: 'The feedback text',
    example: 'Great translation!',
  })
  text: string;

  @ApiProperty({
    description: 'When the feedback was created',
    type: String,
    format: 'date-time',
    example: '2026-01-09T12:34:56.000Z',
  })
  createdAt: Date;
}
