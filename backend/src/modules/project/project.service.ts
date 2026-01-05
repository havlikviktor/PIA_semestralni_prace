import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { FileType, Project, ProjectState } from './entities/project.entity';
import { User, Role } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ProjectFeedback } from './entities/project-feedback.entity';
import { EmailService } from '../email/email.service';
import { Language } from '../user/entities/translator-language.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectFeedback)
    private feedbackRepository: Repository<ProjectFeedback>,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async create(createProjectDto: CreateProjectDto, file: Express.Multer.File) {
    const customer = await this.checkCustomer(createProjectDto.customerId);

    const project = this.initializeProject(customer, createProjectDto, file);
    const assignedTranslator = await this.assignTranslator(
      project,
      createProjectDto.languageCode,
    );

    const savedProject = await this.projectRepository.save(project);

    await this.sendProjectNotifications(
      savedProject,
      assignedTranslator,
      customer,
    );

    return this.mapToResponse(savedProject);
  }

  private initializeProject(
    customer: User,
    dto: CreateProjectDto,
    file: Express.Multer.File,
  ): Project {
    const project = new Project();
    project.customer = customer;
    project.languageCode = dto.languageCode;

    if (file) {
      project.originalFile = file.buffer;
      const originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      project.fileName = originalName;
      project.fileSuffix = originalName.substring(
        originalName.lastIndexOf('.'),
      );
    }

    return project;
  }

  private async assignTranslator(
    project: Project,
    languageCode: Language,
  ): Promise<User | null> {
    const bestTranslator = await this.userService.findCapableTranslator(
      languageCode,
    );

    if (bestTranslator) {
      project.translator = bestTranslator;
      project.state = ProjectState.ASSIGNED;
      return bestTranslator;
    } else {
      project.state = ProjectState.CLOSED;
      return null;
    }
  }

  private async sendProjectNotifications(
    project: Project,
    translator: User | null,
    customer: User,
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

  private mapToResponse(project: Project) {
    const { languageCode, customer, translator, state } = project;
    return {
      languageCode,
      customer: customer.name,
      translator: translator ? translator.name : '',
      state,
    };
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
    this.checkProjectAccess(project!, userId, role);

    if (role !== Role.TRANSLATOR) {
      throw new ForbiddenException(
        'Only translators can upload translated files',
      );
    }

    if (project!.state !== ProjectState.ASSIGNED) {
      throw new BadRequestException(
        'Project must be in ASSIGNED state to upload translated file',
      );
    }

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

  async mapHasTranslatedFile(projects: Project[]): Promise<Project[]> {
    const projectIds = projects.map((p) => p.ProjectId);

    const projectsWithFiles = await this.projectRepository
      .createQueryBuilder('project')
      .select('project.ProjectId', 'id')
      .where('project.ProjectId IN (:...ids)', { ids: projectIds })
      .andWhere('project.translatedFile IS NOT NULL')
      .getRawMany();

    const projectsWithFilesSet = new Set(projectsWithFiles.map((p) => p.id));

    return projects.map((project) => ({
      ...project,
      hasTranslatedFile: projectsWithFilesSet.has(project.ProjectId),
    }));
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

    return this.mapHasTranslatedFile(projects);
  }

  async findProjectById(ProjectId: number) {
    const project = await this.projectRepository.findOne({
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

    if (!project) {
      throw new NotFoundException(`Project with ID ${ProjectId} not found`);
    }
    return {
      ...project,
      hasTranslatedFile: await this.hasTranslatedFile(ProjectId),
    };
  }

  async findProjectFiles(projectId: number) {
    const project = await this.projectRepository.findOne({
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

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return project;
  }

  async getProjectFile(
    projectId: number,
    userId: number,
    role: Role,
    fileType: FileType,
  ) {
    const project = await this.findProjectFiles(projectId);

    this.checkProjectAccess(project, userId, role);
    return this.selectCorrectFile(project, fileType);
  }

  selectCorrectFile(project: Project, fileType: FileType) {
    let buffer: Buffer;

    if (fileType === FileType.TRANSLATED) {
      if (!project.translatedFile) {
        throw new NotFoundException(
          `File for project with ID ${project.ProjectId} is not translated yet`,
        );
      }
      buffer = project.translatedFile;
    } else if (fileType === FileType.ORIGINAL) {
      buffer = project.originalFile;
    } else {
      throw new BadRequestException(`Invalid file type requested: ${fileType}`);
    }

    return {
      buffer,
      filename:
        fileType === FileType.TRANSLATED
          ? `translated_${project.fileName}`
          : project.fileName,
      mimeType: 'application/octet-stream',
    };
  }

  checkProjectAccess(project: Project, userId: number, role: Role) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }
    if (role === Role.CUSTOMER && project.customer.id !== userId) {
      throw new ForbiddenException(
        `You do not have access to this project customer id ${project.customer.id} vs your ${userId}`,
      );
    }
    if (role === Role.TRANSLATOR && project.translator?.id !== userId) {
      throw new ForbiddenException(
        `You do not have access to this project translator id ${project.translator?.id} vs your ${userId}`,
      );
    }
  }

  async checkProjectStateEditAccess(
    project: Project,
    userId: number,
    role: Role,
    newState: ProjectState,
  ) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }

    this.checkProjectAccess(project, userId, role);
    if (role === Role.TRANSLATOR) {
      this.checkTranslatorStateEdit(project.state, newState);
    } else if (role === Role.CUSTOMER) {
      this.checkCustomerStateEdit(project.state, newState);
    }

    if (
      newState !== ProjectState.CREATED &&
      newState !== ProjectState.ASSIGNED
    ) {
      const hasFile = await this.hasTranslatedFile(project.ProjectId);
      if (!hasFile) {
        throw new BadRequestException(
          `Cannot update project into new state ${newState} without translated file`,
        );
      }
    }
  }

  async checkTranslatorStateEdit(state: ProjectState, newState: ProjectState) {
    if (state !== ProjectState.ASSIGNED) {
      throw new BadRequestException(
        `Project state must be in state ASSIGNED to update`,
      );
    } else if (newState !== ProjectState.COMPLETED) {
      throw new BadRequestException(
        `Translator can only update project state to COMPLETED`,
      );
    }
  }

  async checkCustomerStateEdit(state: ProjectState, newState: ProjectState) {
    if (state !== ProjectState.COMPLETED) {
      throw new BadRequestException(
        `Project state must be in state COMPLETED to update`,
      );
    } else if (
      newState !== ProjectState.REJECTED &&
      newState !== ProjectState.APPROVED
    ) {
      throw new BadRequestException(
        `Customer can only update project state to REJECTED or APPROVED`,
      );
    }
  }

  async updateState(
    projectId: number,
    userId: number,
    userRole: Role,
    newState: ProjectState,
  ) {
    const project = await this.findProjectById(projectId);
    this.checkProjectStateEditAccess(project!, userId, userRole, newState);

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
