import { IsEnum, IsInt, Min } from 'class-validator';
import { ProjectState } from '../../entities/project.entity';

export class UpdateProjectStateWsDto {
  @IsInt()
  @Min(1)
  projectId: number;

  @IsEnum(ProjectState)
  state: ProjectState;
}
