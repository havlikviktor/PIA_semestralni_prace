import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../../src/modules/project/project.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../../../src/modules/project/entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto } from '../../../src/modules/project/dto/create-project.dto';
import { Language } from '../../../src/modules/user/entities/translator-language.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: Repository<Project>;

  const mockProjectRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
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

      mockProjectRepository.save.mockResolvedValue(expectedProject);

      const result = await service.create(createProjectDto, file);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(expectedProject),
      );
      expect(result).toEqual(expectedProject);
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const result = [{ ProjectId: 1 }];
      mockProjectRepository.find.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['customer', 'translator'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      const result = { ProjectId: 1 };
      mockProjectRepository.findOne.mockResolvedValue(result);

      expect(await service.findOne(1)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ProjectId: 1 },
        relations: ['customer', 'translator'],
      });
    });
  });
});
