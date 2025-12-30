import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../../src/modules/project/project.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../../../src/modules/project/entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto } from '../../../src/modules/project/dto/create-project.dto';
import { Language } from '../../../src/modules/user/entities/translator-language.entity';
import { UserService } from '../../../src/modules/user/user.service';
import { Role } from '../../../src/modules/user/entities/user.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: Repository<Project>;
  let mockProjectRepository;
  let mockUserService;

  beforeEach(async () => {
    mockProjectRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockUserService = {
      findOne: jest.fn(),
      findTranslator: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repository = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createProjectDto: CreateProjectDto = {
        customerId: 1,
        translatorId: 2,
        languageCode: Language.ENGLISH,
      };
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;
      const expectedProject = {
        customer: { id: 1 },
        translator: { id: 2 },
        languageCode: Language.ENGLISH,
        originalFile: file.buffer,
      };

      mockUserService.findOne.mockImplementation(() =>
        Promise.resolve({ id: 1 }),
      );
      mockUserService.findTranslator.mockResolvedValue({
        id: 2,
        languages: [{ languageCode: Language.ENGLISH }],
      });
      (repository.save as jest.Mock).mockImplementation(() =>
        Promise.resolve(expectedProject),
      );

      const result = await service.create(createProjectDto, file);

      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(expectedProject),
      );
      expect(result).toEqual(expect.objectContaining(expectedProject));
    });
  });

  describe('findAll', () => {
    it('should return an array of projects for customer', async () => {
      const result = [{ ProjectId: 1 }];
      mockProjectRepository.find.mockResolvedValue(result);

      expect(await service.findUserProjects(1, Role.CUSTOMER)).toBe(result);
      expect(repository.find).toHaveBeenCalledWith({
        where: { customer: { id: 1 } },
        relations: ['customer', 'translator'],
      });
    });

    it('should return an array of projects for translator', async () => {
      const result = [{ ProjectId: 1 }];
      mockProjectRepository.find.mockResolvedValue(result);

      expect(await service.findUserProjects(2, Role.TRANSLATOR)).toBe(result);
      expect(repository.find).toHaveBeenCalledWith({
        where: { translator: { id: 2 } },
        relations: ['customer', 'translator'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      const result = { ProjectId: 1 };
      mockProjectRepository.findOne.mockResolvedValue(result);

      expect(await service.findProjectById(1)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ProjectId: 1 },
        relations: ['customer', 'translator'],
      });
    });
  });
});
