import { IsInt, Min } from 'class-validator';

export class ProjectIdDto {
  @IsInt()
  @Min(1)
  projectId: number;
}
