import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  FileType,
  ProjectEntity,
  ProjectState,
} from './entities/project.entity';
import { UserEntity, Role } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ProjectFeedbackEntity } from './entities/project-feedback.entity';
import { EmailService } from '../email/email.service';
import { Language } from '../user/entities/translator-language.entity';
import { UserDomain } from 'src/domain-entites/user.domain';
import { ProjectMapper } from './project.mapper';
import { ProjectDomain } from 'src/domain-entites/project.domain';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectFeedbackEntity)
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly projectMapper: ProjectMapper,
  ) {}

  async create(createProjectDto: CreateProjectDto, file: Express.Multer.File) {
    const customerDomain = await this.checkCustomer(
      createProjectDto.customerId,
    );
    const projectDomain =
      this.projectMapper.toDomainFromCreateDto(createProjectDto);
    projectDomain.addOriginalFile(file);
    projectDomain.addCustomer(customerDomain);

    const assignedTranslatorDomain = await this.assignTranslator(
      projectDomain,
      createProjectDto.languageCode,
    );

    const projectEntity = this.projectMapper.toEntity(projectDomain);
    const savedProjectEntity = await this.projectRepository.save(projectEntity);
    const savedProjectDomain = this.projectMapper.toDomain(savedProjectEntity);

    await this.sendProjectNotifications(
      savedProjectDomain,
      assignedTranslatorDomain,
      customerDomain,
    );
  }

  private async assignTranslator(
    project: ProjectDomain,
    languageCode: Language,
  ): Promise<UserDomain | null> {
    const bestTranslatorDomain =
      await this.userService.findCapableTranslator(languageCode);

    if (bestTranslatorDomain) {
      project.translator = bestTranslatorDomain;
      project.state = ProjectState.ASSIGNED;
      return bestTranslatorDomain;
    } else {
      project.state = ProjectState.CLOSED;
      return null;
    }
  }

  private async sendProjectNotifications(
    project: ProjectDomain,
    translator: UserDomain | null,
    customer: UserDomain,
  ) {
    if (project.state === ProjectState.ASSIGNED && translator?.email) {
      await this.emailService.sendProjectAssignedEmail(
        translator.email,
        project.fileName,
      );
    } else if (project.state === ProjectState.CLOSED) {
      await this.emailService.sendProjectClosedNoTranslatorEmail(
        customer.email,
        project.fileName,
      );
    }
  }

  private async checkCustomer(customerId: number) {
    const customer = await this.userService.findOne(customerId);
    if (!customer) {
      throw new BadRequestException(`Customer with ID ${customerId} not found`);
    }
    return customer;
  }

  async uploadTranslatedFile(
    projectId: number,
    userId: number,
    role: Role,
    file: Express.Multer.File,
  ) {
    const project = await this.findProjectById(projectId);
    project.canUploadTranslatedFile(userId, role);

    await this.projectRepository.update(projectId, {
      translatedFile: file.buffer,
    });
    return this.findProjectById(projectId);
  }

  async hasTranslatedFile(projectId: number): Promise<boolean> {
    const count = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.ProjectId = :projectId', { projectId })
      .andWhere('project.translatedFile IS NOT NULL')
      .getCount();
    return count > 0;
  }

  async mapHasTranslatedFile(
    projects: ProjectEntity[],
  ): Promise<ProjectDomain[]> {
    const projectIds = projects.map((p) => p.ProjectId);

    const projectsWithFiles = await this.projectRepository
      .createQueryBuilder('project')
      .select('project.ProjectId', 'id')
      .where('project.ProjectId IN (:...ids)', { ids: projectIds })
      .andWhere('project.translatedFile IS NOT NULL')
      .getRawMany();

    const projectsWithFilesSet = new Set(projectsWithFiles.map((p) => p.id));

    return projects.map((projectEntity) =>
      this.projectMapper.toDomain(
        projectEntity,
        projectsWithFilesSet.has(projectEntity.ProjectId),
      ),
    );
  }

  async findUserProjects(userId: number, role: Role) {
    const where: any = {};
    if (role === Role.CUSTOMER) {
      where.customer = { id: userId };
    } else if (role === Role.TRANSLATOR) {
      where.translator = { id: userId };
    }

    const projects = await this.projectRepository.find({
      where,
      relations: ['feedback'],
      select: {
        ProjectId: true,
        languageCode: true,
        state: true,
        fileName: true,
        createdAt: true,
        feedback: {
          createdAt: true,
        },
      },
    });

    if (projects.length === 0) {
      return [];
    }

    const domains = await this.mapHasTranslatedFile(projects);
    return domains.map((d) => this.projectMapper.toDto(d));
  }

  async findProjectById(ProjectId: number) {
    const projectEntity = await this.projectRepository.findOne({
      where: { ProjectId },
      relations: ['customer', 'translator', 'feedback'],
      select: {
        ProjectId: true,
        languageCode: true,
        state: true,
        createdAt: true,
        fileName: true,
        fileSuffix: true,
        customer: {
          id: true,
          name: true,
          email: true,
        },
        translator: {
          id: true,
          name: true,
          email: true,
        },
        feedback: {
          text: true,
          createdAt: true,
        },
      },
    });

    if (!projectEntity) {
      throw new NotFoundException(`Project with ID ${ProjectId} not found`);
    }

    const hasFile = await this.hasTranslatedFile(ProjectId);
    return this.projectMapper.toDomain(projectEntity, hasFile);
  }

  async findProjectFiles(projectId: number) {
    const projectEntity = await this.projectRepository.findOne({
      where: { ProjectId: projectId },
      relations: ['customer', 'translator'],
      select: {
        ProjectId: true,
        originalFile: true,
        translatedFile: true,
        fileSuffix: true,
        fileName: true,
        customer: {
          id: true,
        },
        translator: {
          id: true,
        },
      },
    });

    if (!projectEntity) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return this.projectMapper.toDomain(projectEntity);
  }

  async getProjectFile(
    projectId: number,
    userId: number,
    role: Role,
    fileType: FileType,
  ) {
    const project = await this.findProjectFiles(projectId);

    project.checkAccess(userId, role);
    return project.getFile(fileType);
  }

  async updateState(
    projectId: number,
    userId: number,
    userRole: Role,
    newState: ProjectState,
  ) {
    const project = await this.findProjectById(projectId);
    project.checkStateEditAccess(userId, userRole, newState);

    await this.projectRepository.update(projectId, { state: newState });

    if (newState === ProjectState.COMPLETED && project?.customer?.email) {
      await this.emailService.sendProjectCompletedEmail(
        project.customer.email,
        project.fileName,
      );
    }

    return this.findProjectById(projectId);
  }

  remove(id: number) {
    return this.projectRepository.delete(id);
  }
}
