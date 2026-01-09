import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectFeedbackEntity } from './entities/project-feedback.entity';
import { Repository } from 'typeorm/repository/Repository';
import { ProjectService } from './project.service';
import { Role } from '../user/entities/user.entity';
import { FeedbackMapper } from './feedback.mapper';
import { FeedbackDomain } from 'src/domain-entites/feedback.domain';
import { ProjectRealtimeService } from './project-realtime.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(ProjectFeedbackEntity)
    private feedbackRepository: Repository<ProjectFeedbackEntity>,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    private readonly realtime: ProjectRealtimeService,
    private readonly feedbackMapper: FeedbackMapper,
  ) {}

  /**
   * Finds feedback for a project (if present).
   */
  async findFeedbackById(projectId: number): Promise<FeedbackDomain | null> {
    const entity = await this.feedbackRepository.findOne({
      where: { projectId: projectId },
    });
    return entity ? this.feedbackMapper.toDomain(entity) : null;
  }

  /**
   * Adds feedback to a project (state + role constraints enforced in domain).
   */
  async addFeedback(
    projectId: number,
    feedbackText: string,
    userId: number,
    userRole: Role,
  ): Promise<FeedbackDomain> {
    const projectDomain = await this.projectService.findProjectById(projectId);
    const feedbackDomain = new FeedbackDomain({
      projectId: projectId,
      text: feedbackText,
    });

    feedbackDomain.checkCreateAccess(projectDomain, userId, userRole);

    const existingFeedback = await this.findFeedbackById(projectId);
    if (existingFeedback) {
      throw new BadRequestException(
        `Feedback for project with ID ${projectId} already exists`,
      );
    }

    const entity = this.feedbackMapper.toEntity(feedbackDomain);
    const savedEntity = await this.feedbackRepository.save(entity);

    const updatedProject = await this.projectService.findProjectById(projectId);
    const listItem = this.projectService.toListItemDto(updatedProject);
    const detail = this.projectService.toDetailDto(updatedProject);

    this.realtime.emitProjectUpdated({
      listItem,
      detail,
      customerId: updatedProject.customer.id,
      translatorId: updatedProject.translator?.id,
    });

    return this.feedbackMapper.toDomain(savedEntity);
  }

  /**
   * Deletes feedback for a project.
   *
   * When `emitUpdate` is not false, emits a project update (best-effort).
   */
  async deleteFeedback(
    projectId: number,
    options?: { emitUpdate?: boolean },
  ): Promise<void> {
    await this.feedbackRepository.delete({ projectId });

    if (options?.emitUpdate === false) {
      return;
    }

    try {
      const updatedProject =
        await this.projectService.findProjectById(projectId);
      const listItem = this.projectService.toListItemDto(updatedProject);
      const detail = this.projectService.toDetailDto(updatedProject);

      this.realtime.emitProjectUpdated({
        listItem,
        detail,
        customerId: updatedProject.customer.id,
        translatorId: updatedProject.translator?.id,
      });
    } catch {
      // Ignore: project may no longer exist or caller will emit its own updates.
    }
  }
}
