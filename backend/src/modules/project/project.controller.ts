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
  Request,
  Res,
  ParseEnumPipe,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MultipartValidationPipe } from '../../pipes/multipart-validation.pipe';
import { FileValidationInterceptor } from './interceptors/File-validation.interceptor';
import { Response } from 'express';
import { FileType } from './entities/project.entity';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseInterceptors(FileInterceptor('originalFile'), FileValidationInterceptor)
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new MultipartValidationPipe()) createProjectDto: CreateProjectDto,
  ) {
    return await this.projectService.create(createProjectDto, file);
  }

  @Get()
  findAll(@Request() req) {
    return this.projectService.findUserProjects(req.user.sub, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectService.findProjectById(+id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  @Get(':id/file')
  async getFile(
    @Param('id') projectId: number,
    @Request() req,
    @Query('type', new ParseEnumPipe(FileType, { optional: true }))
    type: FileType = FileType.ORIGINAL,
    @Res() res: Response,
  ) {
    const fileData = await this.projectService.getProjectFile(
      projectId,
      req.user.sub,
      req.user.role,
      type,
    );
    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
    });

    res.send(fileData.buffer);
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
    return this.projectService.findProjectById(+id);
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
