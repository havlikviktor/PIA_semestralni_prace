import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';
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

    const project = new Project();
    project.customer = { id: createProjectDto.customerId } as User;
    if (createProjectDto.translatorId) {
      project.translator = { id: createProjectDto.translatorId } as User;
    }
    project.languageCode = createProjectDto.languageCode;
    if (file) {
      project.originalFile = file.buffer;
    }

    return this.mapToResponse(await this.projectRepository.save(project));
  }

  private mapToResponse(project: Project) {
  const { ProjectId, languageCode, customer, translator, state } = project;
  return { ProjectId, languageCode, "customer" : customer.name, "translator" : translator ? translator.name : "", state };
}

  private async checkCustomer(customerId: number) {
    const customer = await this.userService.findOne(
      customerId,
    );
    if (!customer) {
      throw new BadRequestException(
        `Customer with ID ${customerId} not found`,
      );
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

  findAll() {
    return this.projectRepository.find({
      relations: ['customer', 'translator'],
    });
  }

  findOne(id: number) {
    return this.projectRepository.findOne({
      where: { ProjectId: id },
      relations: ['customer', 'translator'],
    });
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return this.projectRepository.update(id, updateProjectDto);
  }

  remove(id: number) {
    return this.projectRepository.delete(id);
  }
}
