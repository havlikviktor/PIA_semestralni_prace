import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProjectFeedback } from "./entities/project-feedback.entity";
import { Repository } from "typeorm/repository/Repository";
import { Project, ProjectState } from "./entities/project.entity";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { ProjectService } from "./project.service";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(ProjectFeedback)
    private feedbackRepository: Repository<ProjectFeedback>,
    private readonly projectService: ProjectService,
  ) {}

    async addFeedback(
      projectId: number,
      createFeedbackDto: CreateFeedbackDto,
      userId: number,
    ) {
      const project = await this.projectService.findProjectById(projectId);
      this.checkProjectFeedbackAccess(project!, userId);
  
      const feedback = this.feedbackRepository.create({
        projectId: projectId,
        text: createFeedbackDto.text,
      });
  
      return this.feedbackRepository.save(feedback);
    }
  
    checkProjectFeedbackAccess(project: Project, userId: number) {
      if (project.state !== ProjectState.APPROVED) {
        throw new BadRequestException(
          `Feedback can only be added to approved projects`,
        );
      }
  
      if (project.customer.id !== userId) {
        throw new ForbiddenException(
          `Only the customer of the project can add feedback`,
        );
      }
  
      if (project.feedback) {
        throw new BadRequestException(`Feedback for this project already exists`);
      }
    }
  
}