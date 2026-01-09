import { Injectable } from '@nestjs/common';
import { ProjectFeedbackEntity } from './entities/project-feedback.entity';
import { FeedbackDomain } from '../../domain-entites/feedback.domain';
import { ProjectFeedbackResponseDto } from './dto/project-feedback-response.dto';

@Injectable()
export class FeedbackMapper {
  toDomain(entity: ProjectFeedbackEntity): FeedbackDomain {
    return new FeedbackDomain({
      projectId: entity.projectId,
      text: entity.text,
      createdAt: entity.createdAt,
    });
  }

  // i found it useless to have function that maps from dto to domain only for one field
  // toDomainFromCreateDto() {}

  toEntity(domain: FeedbackDomain): ProjectFeedbackEntity {
    const entity = new ProjectFeedbackEntity();
    entity.projectId = domain.projectId;
    entity.text = domain.text;
    return entity;
  }

  toResponseDto(domain: FeedbackDomain): ProjectFeedbackResponseDto {
    return {
      text: domain.text,
      createdAt: domain.createdAt,
    };
  }
}
