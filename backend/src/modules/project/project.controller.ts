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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('projects')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create a new project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Project creation data',
    type: CreateProjectDto,
  })
  @ApiResponse({
    status: 204,
    description: 'The project has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid file or data.',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity. File too large or missing.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body(new MultipartValidationPipe()) createProjectDto: CreateProjectDto,
  ) {
    await this.projectService.create(createProjectDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user projects' })
  @ApiResponse({ status: 200, description: 'Return list of projects.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Request() req) {
    return this.projectService.findUserProjects(req.user.sub, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Return project details.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string) {
    const projectDomain = await this.projectService.findProjectById(+id);
    return this.projectMapper.toDetailDto(projectDomain);
  }

  @Post(':id/file')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('translatedFile'))
  @ApiOperation({ summary: 'Upload translated file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        translatedFile: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Not allowed to upload.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable Entity. File too large or missing.' })
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
  @ApiOperation({ summary: 'Download project file' })
  @ApiQuery({ name: 'type', enum: FileType, required: false })
  @ApiResponse({ status: 200, description: 'File downloaded successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Not allowed to access file.',
  })
  @ApiResponse({ status: 404, description: 'File or Project not found.' })
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
  @ApiOperation({ summary: 'Add feedback to project' })
  @ApiResponse({ status: 201, description: 'Feedback added successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Must be in state APPROVED or REJECTED to create feedback' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only customer and admin can add feedback.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
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
  @ApiOperation({ summary: 'Update project state' })
  @ApiResponse({
    status: 200,
    description: 'Project state updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid state transition.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Not allowed to change state.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
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
