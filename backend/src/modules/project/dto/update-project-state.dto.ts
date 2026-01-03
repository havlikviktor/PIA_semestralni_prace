import { IsEnum } from 'class-validator';
import { ProjectState } from '../entities/project.entity';

export class UpdateProjectStateDto {
  @IsEnum(ProjectState)
  state: ProjectState;
}
