import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from '../../../src/modules/project/project.service';
import {
  ProjectEntity,
  ProjectState,
} from '../../../src/modules/project/entities/project.entity';
import { UserService } from '../../../src/modules/user/user.service';
import { EmailService } from '../../../src/modules/email/email.service';
import { ProjectMapper } from '../../../src/modules/project/project.mapper';
import { Role } from '../../../src/modules/user/entities/user.entity';

describe('ProjectService', () => {
  const repo = {
    save: jest.fn(async (x) => x),
    update: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const userService = {
    findOne: jest.fn(),
    findCapableTranslator: jest.fn(),
  } as unknown as UserService;

  const emailService = {
    sendProjectAssignedEmail: jest.fn(),
    sendProjectClosedNoTranslatorEmail: jest.fn(),
    sendProjectCompletedEmail: jest.fn(),
  } as unknown as EmailService;

  const projectMapper = {
    toDomainFromCreateDto: jest.fn(),
    toEntity: jest.fn((x) => x),
    toDomain: jest.fn((x) => x),
    toDto: jest.fn((x) => x),
  } as unknown as ProjectMapper;

  let service: ProjectService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(ProjectEntity), useValue: repo },
        { provide: UserService, useValue: userService },
        { provide: EmailService, useValue: emailService },
        { provide: ProjectMapper, useValue: projectMapper },
      ],
    }).compile();

    service = moduleRef.get(ProjectService);
  });

  it('create sends assigned email when translator found', async () => {
    (userService.findOne as any).mockResolvedValue({
      id: 10,
      email: 'cust@x',
      role: Role.CUSTOMER,
    });
    (userService.findCapableTranslator as any).mockResolvedValue({
      id: 20,
      email: 'tr@x',
      role: Role.TRANSLATOR,
    });

    const projectDomain: any = {
      fileName: 'file',
      state: ProjectState.CREATED,
      addOriginalFile: jest.fn(),
      addCustomer: jest.fn(),
      customer: { email: 'cust@x' },
      translator: null,
    };

    (projectMapper.toDomainFromCreateDto as any).mockReturnValue(projectDomain);
    (projectMapper.toDomain as any).mockImplementation((x: any) => x);

    await service.create(
      { customerId: 10, languageCode: 'en', fileName: 'file' } as any,
      {
        buffer: Buffer.from('x'),
        originalname: 'x',
      } as any,
    );

    expect(emailService.sendProjectAssignedEmail).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('create sends closed email when no translator found', async () => {
    (userService.findOne as any).mockResolvedValue({
      id: 10,
      email: 'cust@x',
      role: Role.CUSTOMER,
    });
    (userService.findCapableTranslator as any).mockResolvedValue(null);

    const projectDomain: any = {
      fileName: 'file',
      state: ProjectState.CREATED,
      addOriginalFile: jest.fn(),
      addCustomer: jest.fn(),
      customer: { email: 'cust@x' },
      translator: null,
    };

    (projectMapper.toDomainFromCreateDto as any).mockReturnValue(projectDomain);
    (projectMapper.toDomain as any).mockImplementation((x: any) => x);

    await service.create(
      { customerId: 10, languageCode: 'en', fileName: 'file' } as any,
      {
        buffer: Buffer.from('x'),
        originalname: 'x',
      } as any,
    );

    expect(emailService.sendProjectClosedNoTranslatorEmail).toHaveBeenCalled();
  });

  it('findProjectById throws NotFoundException when missing', async () => {
    (repo.findOne as any).mockResolvedValue(null);

    await expect(service.findProjectById(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
