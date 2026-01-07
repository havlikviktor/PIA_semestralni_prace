import { IsEnum } from 'class-validator';
import { ProjectState } from '../entities/project.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectStateDto {
  @ApiProperty({
    description: 'The new state of the project',
    enum: ProjectState,
    example: ProjectState.APPROVED,
  })
  @IsEnum(ProjectState)
  state: ProjectState;
}
