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
  HttpCode,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectStateDto } from './dto/update-project-state.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MultipartValidationPipe } from '../../pipes/multipart-validation.pipe';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { Response } from 'express';
import { FileType } from './entities/project.entity';

import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';
import { ProjectMapper } from './project.mapper';
import { FeedbackMapper } from './feedback.mapper';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly feedbackService: FeedbackService,
    private readonly projectMapper: ProjectMapper,
    private readonly feedbackMapper: FeedbackMapper,
  ) {}

  @Post()
  @HttpCode(204)
  @UseInterceptors(FileInterceptor('originalFile'))
  async create(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body(new MultipartValidationPipe()) createProjectDto: CreateProjectDto,
  ) {
     await this.projectService.create(createProjectDto, file);
  }

  @Get()
  async findAll(@Request() req) {
    return this.projectService.findUserProjects(req.user.sub, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const projectDomain = await this.projectService.findProjectById(+id);
    return this.projectMapper.toDetailDto(projectDomain);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('translatedFile'))
  async uploadTranslatedFile(
    @Param('id') id: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Request() req,
  ) {
    const domain = await this.projectService.uploadTranslatedFile(
      +id,
      req.user.sub,
      req.user.role,
      file,
    );
    return this.projectMapper.toDetailDto(domain);
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
    const encodedFilename = encodeURIComponent(fileData.filename);
    const asciiFilename = fileData.filename.replace(/[^\x00-\x7F]/g, '_');

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
    });

    res.send(fileData.buffer);
  }

  @Post(':id/feedback')
  async addFeedback(
    @Param('id') id: string,
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() req,
  ) {
    const domain = await this.feedbackService.addFeedback(
      +id,
      createFeedbackDto.text,
      req.user.sub,
      req.user.role,
    );
    return this.feedbackMapper.toResponseDto(domain);
  }

  @Patch(':id')
  async updateState(
    @Param('id') id: string,
    @Body() updateProjectStateDto: UpdateProjectStateDto,
    @Request() req,
  ) {
    const domain = await this.projectService.updateState(
      +id,
      req.user.sub,
      req.user.role,
      updateProjectStateDto.state,
    );
    return this.projectMapper.toDetailDto(domain);
  }
}
