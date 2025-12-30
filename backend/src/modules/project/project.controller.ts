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
  NotFoundException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MultipartValidationPipe } from '../../pipes/multipart-validation.pipe';
import { FileValidationInterceptor } from './interceptors/File-validation.interceptor';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseInterceptors(FileInterceptor('originalFile'), FileValidationInterceptor)
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new MultipartValidationPipe()) createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectService.create(createProjectDto, file);
    const { ProjectId, languageCode, customer, translator, state } = project;
    return { ProjectId, languageCode, customer, translator, state };
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
