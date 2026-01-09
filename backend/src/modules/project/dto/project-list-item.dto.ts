import { ApiProperty } from '@nestjs/swagger';
import { Language } from '../../user/entities/translator-language.entity';
import { ProjectState } from '../entities/project.entity';
import { ProjectFeedbackResponseDto } from './project-feedback-response.dto';

export class ProjectListItemDto {
  @ApiProperty({ description: 'Project ID', example: 123 })
  ProjectId: number;

  @ApiProperty({ description: 'Target language code', enum: Language })
  languageCode: Language;

  @ApiProperty({ description: 'Project state', enum: ProjectState })
  state: ProjectState;

  @ApiProperty({ description: 'Original filename', example: 'document.docx' })
  fileName: string;

  @ApiProperty({
    description: 'When the project was created',
    type: String,
    format: 'date-time',
    example: '2026-01-09T12:34:56.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Whether a translated file exists',
    required: false,
    example: true,
  })
  hasTranslatedFile?: boolean;

  @ApiProperty({
    description: 'Feedback for the project (if any)',
    type: ProjectFeedbackResponseDto,
    nullable: true,
  })
  feedback: ProjectFeedbackResponseDto | null;
}
