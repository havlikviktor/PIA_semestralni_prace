import { ApiProperty } from '@nestjs/swagger';
import { Language } from '../../user/entities/translator-language.entity';
import { ProjectState } from '../entities/project.entity';
import { ProjectFeedbackResponseDto } from './project-feedback-response.dto';

export class ProjectUserInfoDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User name', example: 'Jane Doe' })
  name: string;

  @ApiProperty({ description: 'User email', example: 'jane@example.com' })
  email: string;
}

export class ProjectDetailDto {
  @ApiProperty({ description: 'Project ID', example: 123 })
  ProjectId: number;

  @ApiProperty({ description: 'Target language code', enum: Language })
  languageCode: Language;

  @ApiProperty({ description: 'Project state', enum: ProjectState })
  state: ProjectState;

  @ApiProperty({
    description: 'When the project was created',
    type: String,
    format: 'date-time',
    example: '2026-01-09T12:34:56.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: 'Original filename', example: 'document.docx' })
  fileName: string;

  @ApiProperty({
    description: 'Customer info (if assigned)',
    type: ProjectUserInfoDto,
    nullable: true,
  })
  customer: ProjectUserInfoDto | null;

  @ApiProperty({
    description: 'Translator info (if assigned)',
    type: ProjectUserInfoDto,
    nullable: true,
  })
  translator: ProjectUserInfoDto | null;

  @ApiProperty({
    description: 'Feedback for the project (if any)',
    type: ProjectFeedbackResponseDto,
    nullable: true,
  })
  feedback: ProjectFeedbackResponseDto | null;

  @ApiProperty({
    description: 'Whether a translated file exists',
    required: false,
    example: true,
  })
  hasTranslatedFile?: boolean;
}
