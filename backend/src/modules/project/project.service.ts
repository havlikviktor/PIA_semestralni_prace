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
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileType, Project } from './entities/project.entity';
import { User, Role } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly userService: UserService,
  ) {}

  async create(createProjectDto: CreateProjectDto, file: Express.Multer.File) {
    await this.checkCustomer(createProjectDto.customerId);
    await this.checkTranslator(createProjectDto);

    if (createProjectDto.translatorId === createProjectDto.customerId) {
      throw new BadRequestException(
        `Customer and translator cannot be the same user`,
      );
    }

    const project = new Project();
    project.customer = { id: createProjectDto.customerId } as User;
    if (createProjectDto.translatorId) {
      project.translator = { id: createProjectDto.translatorId } as User;
    }
    project.languageCode = createProjectDto.languageCode;
    if (file) {
      project.originalFile = file.buffer;
      const originalName = file.originalname;
      project.fileSuffix = originalName.substring(
        originalName.lastIndexOf('.'),
      );
    }

    return this.mapToResponse(await this.projectRepository.save(project));
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
  }

  private async checkTranslator(createProjectDto: CreateProjectDto) {
    if (!createProjectDto.translatorId) {
      return;
    }

    const translator = await this.userService.findTranslator(
      createProjectDto.translatorId,
    );
    if (!translator) {
      throw new BadRequestException(
        `Translator with ID ${createProjectDto.translatorId} not found or is not a translator`,
      );
    }
    this.checkTranslatorCompetence(translator, createProjectDto);
  }

  private checkTranslatorCompetence(
    translator: User,
    createProjectDto: CreateProjectDto,
  ) {
    const hasCompetence = translator.languages.some(
      (lang) => lang.languageCode === createProjectDto.languageCode,
    );

    if (!hasCompetence) {
      throw new BadRequestException(
        `Translator with ID ${createProjectDto.translatorId} does not have competence for language ${createProjectDto.languageCode}`,
      );
    }
  }

  async findUserProjects(userId: number, role: Role) {
    const where: any = {};
    if (role === Role.CUSTOMER) {
      where.customer = { id: userId };
    } else if (role === Role.TRANSLATOR) {
      where.translator = { id: userId };
    }

    return this.projectRepository.find({
      where,
      relations: ['customer', 'translator'],
      select: {
        ProjectId: true,
        languageCode: true,
        state: true,
        createdAt: true,
        customer: {
          name: true,
          email: true,
        },
        translator: {
          name: true,
          email: true,
        },
      },
    });
  }

  findProjectById(ProjectId: number) {
    return this.projectRepository.findOne({
      where: { ProjectId },
      relations: ['customer', 'translator'],
      select: {
        languageCode: true,
        state: true,
        createdAt: true,
        customer: {
          name: true,
          email: true,
        },
        translator: {
          name: true,
          email: true,
        },
      },
    });
  }

  async findProjectFiles(projectId: number) {
    return this.projectRepository.findOne({
      where: { ProjectId: projectId },
      relations: ['customer', 'translator'],
      select: {
        ProjectId: true,
        originalFile: true,
        translatedFile: true,
        fileSuffix: true,
        customer: {
          id: true,
        },
        translator: {
          id: true,
        },
      },
    });
  }

  async getProjectFile(
    projectId: number,
    userId: number,
    role: Role,
    fileType: FileType,
  ) {
    const project = await this.findProjectFiles(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    this.checkProjectAccess(project, userId, role);
    return this.selectCorrectFile(project, fileType);
    
  }

selectCorrectFile(project: Project, fileType: FileType) {
  let buffer : Buffer;

  if (fileType === FileType.TRANSLATED) {
    if (!project.translatedFile) {
      throw new NotFoundException(`File for project with ID ${project.ProjectId} is not translated yet`);
    }
    buffer = project.translatedFile;
  } else if (fileType === FileType.ORIGINAL) {
    buffer = project.originalFile;
  }
  else {
    throw new BadRequestException(`Invalid file type requested: ${fileType}`);
  }

  return {
    buffer,
    filename: `${fileType.toString()}_file.${project.fileSuffix}`,
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

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return this.projectRepository.update(id, updateProjectDto);
  }

  remove(id: number) {
    return this.projectRepository.delete(id);
  }
}
