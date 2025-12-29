import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MultipartValidationPipe } from '../../pipes/multipart-validation.pipe';
import { FileValidationInterceptor } from './interceptors/File-validation.interceptor';
import { PostgresErrorCode } from '../database/postgres-error-codes.enum';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('originalFile'), FileValidationInterceptor)
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new MultipartValidationPipe()) createProjectDto: CreateProjectDto) 
  {
    await this.checkTranslator(createProjectDto);
    
    try {
      const project = await this.projectService.create(createProjectDto, file);
      if (project) {
       const { ProjectId, languageCode, customer, translator, state } = project;
       return { ProjectId, languageCode, customer, translator, state };
      } 
    }
    catch (error) {
      if (error?.code === PostgresErrorCode.ForeignKeyViolation) {
        throw new BadRequestException(
          'Referenced user (customer or translator) does not exist.',
        );
      }
      throw error;
    }
  }

  private async checkTranslator(createProjectDto: CreateProjectDto) {
    if (!createProjectDto.translatorId) {
      return
    }

    const translator = await this.userService.findTranslator(createProjectDto.translatorId);
    if (!translator) {
      throw new BadRequestException(
        `Translator with ID ${createProjectDto.translatorId} not found or is not a translator`,
      );
    }
    this.checkTranslatorCompetence(translator, createProjectDto);
  }

  private checkTranslatorCompetence(translator: User, createProjectDto: CreateProjectDto) {
     const hasCompetence = translator.languages.some(
        (lang) => lang.languageCode === createProjectDto.languageCode,
      );

      if (!hasCompetence) {
        throw new BadRequestException(
          `Translator with ID ${createProjectDto.translatorId} does not have competence for language ${createProjectDto.languageCode}`,
        );
      }
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectService.findOne(+id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const result = await this.projectService.update(+id, updateProjectDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.projectService.findOne(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.projectService.remove(+id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
