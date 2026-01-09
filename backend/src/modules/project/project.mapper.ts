import { Injectable } from '@nestjs/common';
import { ProjectEntity } from './entities/project.entity';
import { ProjectDomain } from '../../domain-entites/project.domain';
import { CreateProjectDto } from './dto/create-project.dto';
import { UserMapper } from '../user/user.mapper';
import { ProjectState } from './entities/project.entity';
import { FeedbackMapper } from './feedback.mapper';
import { ProjectListItemDto } from './dto/project-list-item.dto';
import { ProjectDetailDto } from './dto/project-detail.dto';

@Injectable()
export class ProjectMapper {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly feedbackMapper: FeedbackMapper,
  ) {}

  toDomain(entity: ProjectEntity, hasTranslatedFile?: boolean): ProjectDomain {
    const domain = new ProjectDomain({
      ProjectId: entity.ProjectId,
      languageCode: entity.languageCode,
      fileName: entity.fileName,
      originalFile: entity.originalFile,
      translatedFile: entity.translatedFile,
      state: entity.state,
      createdAt: entity.createdAt,
      hasTranslatedFile: hasTranslatedFile,
    });

    if (entity.customer) {
      domain.customer = this.userMapper.toDomain(entity.customer);
    }

    if (entity.translator) {
      domain.translator = this.userMapper.toDomain(entity.translator);
    }

    if (entity.feedback) {
      domain.feedback = this.feedbackMapper.toDomain(entity.feedback);
    }

    return domain;
  }

  toEntity(domain: ProjectDomain): ProjectEntity {
    const entity = new ProjectEntity();
    entity.ProjectId = domain.ProjectId;
    entity.languageCode = domain.languageCode;
    entity.fileName = domain.fileName;
    entity.originalFile = domain.originalFile;
    entity.translatedFile = domain.translatedFile;
    entity.state = domain.state;

    if (domain.customer) {
      entity.customer = this.userMapper.toEntity(domain.customer);
    }

    if (domain.translator) {
      entity.translator = this.userMapper.toEntity(domain.translator);
    }

    return entity;
  }

  toDomainFromCreateDto(dto: CreateProjectDto): ProjectDomain {
    const domain = new ProjectDomain({
      languageCode: dto.languageCode,
      state: ProjectState.CREATED,
    });

    return domain;
  }

  toDto(domain: ProjectDomain): ProjectListItemDto {
    return {
      ProjectId: domain.ProjectId,
      languageCode: domain.languageCode,
      state: domain.state,
      fileName: domain.fileName,
      createdAt: domain.createdAt,
      hasTranslatedFile: domain.hasTranslatedFile,
      feedback: domain.feedback
        ? this.feedbackMapper.toResponseDto(domain.feedback)
        : null,
    };
  }

  toDetailDto(domain: ProjectDomain): ProjectDetailDto {
    return {
      ProjectId: domain.ProjectId,
      languageCode: domain.languageCode,
      state: domain.state,
      createdAt: domain.createdAt,
      fileName: domain.fileName,
      customer: domain.customer
        ? {
            id: domain.customer.id,
            name: domain.customer.name,
            email: domain.customer.email,
          }
        : null,
      translator: domain.translator
        ? {
            id: domain.translator.id,
            name: domain.translator.name,
            email: domain.translator.email,
          }
        : null,
      feedback: domain.feedback
        ? this.feedbackMapper.toResponseDto(domain.feedback)
        : null,
      hasTranslatedFile: domain.hasTranslatedFile,
    };
  }
}
