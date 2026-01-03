import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectFeedback } from './entities/project-feedback.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Project, ProjectState } from './entities/project.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ProjectService } from './project.service';
import { Role } from '../user/entities/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(ProjectFeedback)
    private feedbackRepository: Repository<ProjectFeedback>,
    private readonly projectService: ProjectService,
  ) {}

  checkProjectFeedbackEditAccess(project: Project, userId: number, role: Role) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }
    this.projectService.checkProjectAccess(project, userId, role);

    if (role === Role.CUSTOMER) {
      if (
        project.state !== ProjectState.APPROVED &&
        project.state !== ProjectState.REJECTED
      ) {
        throw new BadRequestException(
          `Project state must be in state APPROVED or REJECTED to create feedback`,
        );
      }
    } else {
      throw new ForbiddenException(
        `Only administrators and customers can update project feedback`,
      );
    }
  }

  async findFeedbackById(projectId: number) {
    return this.feedbackRepository.findOne({
      where: { projectId: projectId },
    });
  }

  async addFeedback(
    projectId: number,
    feedbackText: string,
    userId: number,
    userRole: Role,
  ) {
    const project = await this.projectService.findProjectById(projectId);
    
    this.checkProjectFeedbackEditAccess(project!, userId, userRole);
    const feedback = await this.findFeedbackById(projectId);

    if (feedback) {
      throw new BadRequestException(
        `Feedback for project with ID ${projectId} already exists`,
      );
    }
    return this.feedbackRepository.save({ projectId, text: feedbackText });
  }
}
