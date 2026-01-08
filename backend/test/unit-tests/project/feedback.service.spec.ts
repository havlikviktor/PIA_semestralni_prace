import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { FeedbackService } from '../../../src/modules/project/feedback.service';
import { ProjectFeedbackEntity } from '../../../src/modules/project/entities/project-feedback.entity';
import { ProjectService } from '../../../src/modules/project/project.service';
import { FeedbackMapper } from '../../../src/modules/project/feedback.mapper';
import { FeedbackDomain } from '../../../src/domain-entites/feedback.domain';

describe('FeedbackService', () => {
  const feedbackRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (x) => x),
  };

  const projectService = {
    findProjectById: jest.fn(),
  } as unknown as ProjectService;

  const feedbackMapper = {
    toDomain: jest.fn((x) => x),
    toEntity: jest.fn((x) => x),
  } as unknown as FeedbackMapper;

  let service: FeedbackService;

  beforeEach(async () => {
    jest.clearAllMocks();

    jest
      .spyOn(FeedbackDomain.prototype, 'checkCreateAccess')
      .mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(ProjectFeedbackEntity),
          useValue: feedbackRepository,
        },
        { provide: ProjectService, useValue: projectService },
        { provide: FeedbackMapper, useValue: feedbackMapper },
      ],
    }).compile();

    service = moduleRef.get(FeedbackService);
  });

  it('findFeedbackById returns null when not found', async () => {
    (feedbackRepository.findOne as any).mockResolvedValue(null);

    const res = await service.findFeedbackById(1);

    expect(res).toBeNull();
  });

  it('addFeedback throws when feedback already exists', async () => {
    (projectService.findProjectById as any).mockResolvedValue({} as any);
    jest.spyOn(service, 'findFeedbackById').mockResolvedValue({} as any);

    await expect(
      service.addFeedback(1, 'text', 1, 'customer' as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('addFeedback saves when no existing feedback', async () => {
    (projectService.findProjectById as any).mockResolvedValue({} as any);
    jest.spyOn(service, 'findFeedbackById').mockResolvedValue(null);

    const res = await service.addFeedback(1, 'text', 1, 'customer' as any);

    expect(feedbackRepository.save).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });
});
