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
import { FeedbackService } from '../../../src/modules/project/feedback.service';
import { ProjectRealtimeService } from '../../../src/modules/project/project-realtime.service';

describe('ProjectService', () => {
  const repo = {
    save: jest.fn(async (x) => x),
    update: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(async (x) => x),
    createQueryBuilder: jest.fn(),
  };

  const feedbackService = {
    deleteFeedback: jest.fn(),
  } as unknown as FeedbackService;

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
    toDetailDto: jest.fn((x) => x),
  } as unknown as ProjectMapper;

  const realtime = {
    emitProjectCreated: jest.fn(),
    emitProjectUpdated: jest.fn(),
    emitProjectStateChanged: jest.fn(),
  } as unknown as ProjectRealtimeService;

  let service: ProjectService;

  beforeEach(async () => {
    jest.clearAllMocks();

    service = new ProjectService(
      repo as any,
      feedbackService as any,
      userService as any,
      emailService as any,
      projectMapper as any,
      realtime as any,
    );
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

  it('updateState deletes feedback when setting COMPLETED (admin)', async () => {
    const projectDomain: any = {
      ProjectId: 1,
      state: ProjectState.APPROVED,
      customer: { email: 'cust@x' },
      fileName: 'file',
      languageCode: 'en',
      checkStateEditAccess: jest.fn(),
      planStateUpdate: jest.fn(() => ({
        deleteFeedback: true,
        deleteTranslatedFile: false,
        findNewTranslator: false,
      })),
    };

    jest
      .spyOn(service as any, 'findProjectById')
      .mockResolvedValueOnce(projectDomain)
      .mockResolvedValueOnce({
        ...projectDomain,
        state: ProjectState.COMPLETED,
      });

    const res = await service.updateState(
      1,
      999,
      Role.ADMINISTRATOR,
      ProjectState.COMPLETED,
    );

    expect(projectDomain.checkStateEditAccess).toHaveBeenCalledWith(
      999,
      Role.ADMINISTRATOR,
      ProjectState.COMPLETED,
    );
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ProjectId: 1, state: ProjectState.COMPLETED }),
    );
    expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(1, {
      emitUpdate: false,
    });
    expect(emailService.sendProjectCompletedEmail).toHaveBeenCalledWith(
      'cust@x',
      'file',
    );
    expect(res.state).toBe(ProjectState.COMPLETED);
  });

  it('updateState on ASSIGNED clears translatedFile, deletes feedback, and reassigns translator when available (admin)', async () => {
    const projectDomain: any = {
      ProjectId: 1,
      state: ProjectState.APPROVED,
      customer: { email: 'cust@x' },
      fileName: 'file',
      languageCode: 'en',
      checkStateEditAccess: jest.fn(),
      planStateUpdate: jest.fn(() => ({
        deleteFeedback: true,
        deleteTranslatedFile: true,
        findNewTranslator: true,
      })),
    };

    (userService.findCapableTranslator as any).mockResolvedValue({ id: 55 });

    jest
      .spyOn(service as any, 'findProjectById')
      .mockResolvedValueOnce(projectDomain)
      .mockResolvedValueOnce({
        ...projectDomain,
        state: ProjectState.ASSIGNED,
        translator: { id: 55 },
        hasTranslatedFile: false,
      });

    await service.updateState(
      1,
      999,
      Role.ADMINISTRATOR,
      ProjectState.ASSIGNED,
    );

    expect(userService.findCapableTranslator).toHaveBeenCalledWith('en');
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        ProjectId: 1,
        state: ProjectState.ASSIGNED,
        translatedFile: null,
        translator: { id: 55 },
      }),
    );
    expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(1, {
      emitUpdate: false,
    });
    expect(emailService.sendProjectCompletedEmail).not.toHaveBeenCalled();
  });

  it('updateState on ASSIGNED closes project when no translator available (admin)', async () => {
    const projectDomain: any = {
      ProjectId: 1,
      state: ProjectState.APPROVED,
      customer: { email: 'cust@x' },
      fileName: 'file',
      languageCode: 'en',
      checkStateEditAccess: jest.fn(),
      planStateUpdate: jest.fn(() => ({
        deleteFeedback: true,
        deleteTranslatedFile: true,
        findNewTranslator: true,
      })),
    };

    (userService.findCapableTranslator as any).mockResolvedValue(null);

    jest
      .spyOn(service as any, 'findProjectById')
      .mockResolvedValueOnce(projectDomain)
      .mockResolvedValueOnce({
        ...projectDomain,
        state: ProjectState.CLOSED,
        translator: null,
        hasTranslatedFile: false,
      });

    const res = await service.updateState(
      1,
      999,
      Role.ADMINISTRATOR,
      ProjectState.ASSIGNED,
    );

    expect(userService.findCapableTranslator).toHaveBeenCalledWith('en');
    expect(repo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        ProjectId: 1,
        state: ProjectState.CLOSED,
        translatedFile: null,
        translator: null,
      }),
    );
    expect(res.state).toBe(ProjectState.CLOSED);
  });
});
