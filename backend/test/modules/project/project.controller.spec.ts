import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../src/modules/project/project.controller';
import { ProjectService } from '../../../src/modules/project/project.service';
import { UserService } from '../../../src/modules/user/user.service';
import { CreateProjectDto } from '../../../src/modules/project/dto/create-project.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgresErrorCode } from '../../../src/modules/database/postgres-error-codes.enum';
import { Role } from '../../../src/modules/user/entities/user.entity';
import { Language } from '../../../src/modules/user/entities/translator-language.entity';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import {
  Project,
  ProjectState,
} from '../../../src/modules/project/entities/project.entity';
import { FileValidationInterceptor } from '../../../src/modules/project/interceptors/File-validation.interceptor';
import {
  UnprocessableEntityException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { of } from 'rxjs';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: ProjectService;
  let interceptor: FileValidationInterceptor;

  const mockProjectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [ProjectController],
      providers: [
        FileValidationInterceptor,
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
    interceptor = module.get<FileValidationInterceptor>(
      FileValidationInterceptor,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      customerId: 1,
      translatorId: 2,
      languageCode: Language.ENGLISH,
    };
    const file = { buffer: Buffer.from('test') } as Express.Multer.File;

    it('should create a project successfully', async () => {
      const mockProject = {
        ProjectId: 1,
        ...createProjectDto,
        state: ProjectState.CREATED,
      };

      mockProjectService.create.mockResolvedValue(mockProject);

      const result = await controller.create(file, createProjectDto);

      expect(projectService.create).toHaveBeenCalledWith(
        createProjectDto,
        file,
      );
      expect(result).toEqual({
        ProjectId: 1,
        languageCode: Language.ENGLISH,
        state: ProjectState.CREATED,
      });
    });

    it('should throw BadRequestException if translator not found', async () => {
      mockProjectService.create.mockRejectedValue(new BadRequestException());

      await expect(controller.create(file, createProjectDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if translator lacks competence', async () => {
      mockProjectService.create.mockRejectedValue(new BadRequestException());

      await expect(controller.create(file, createProjectDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on ForeignKeyViolation', async () => {
      mockProjectService.create.mockRejectedValue(new BadRequestException());

      await expect(controller.create(file, createProjectDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    describe('file validation', () => {
      it('should throw UnprocessableEntityException if file is not attached', () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({ file: undefined }),
          }),
        } as ExecutionContext;
        const next = { handle: () => of(null) } as CallHandler;

        expect(() => interceptor.intercept(context, next)).toThrow(
          UnprocessableEntityException,
        );
      });

      it('should throw BadRequestException if file size is zero', () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({ file: { size: 0 } }),
          }),
        } as ExecutionContext;
        const next = { handle: () => of(null) } as CallHandler;

        expect(() => interceptor.intercept(context, next)).toThrow(
          BadRequestException,
        );
      });

      it('should throw UnprocessableEntityException if file is too big', () => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({ file: { size: 10 * 1024 * 1024 } }), // 10MB
          }),
        } as ExecutionContext;
        const next = { handle: () => of(null) } as CallHandler;

        expect(() => interceptor.intercept(context, next)).toThrow(
          UnprocessableEntityException,
        );
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const result = [{ ProjectId: 1 }];
      mockProjectService.findAll.mockResolvedValue(result);
      const req = { user: { sub: 1, role: Role.CUSTOMER } };

      expect(await controller.findAll(req)).toBe(result);
      expect(projectService.findAll).toHaveBeenCalledWith(1, Role.CUSTOMER);
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      const result = { ProjectId: 1 };
      mockProjectService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
