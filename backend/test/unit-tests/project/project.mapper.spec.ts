import { ProjectMapper } from '../../../src/modules/project/project.mapper';
import { Role } from '../../../src/modules/user/entities/user.entity';
import { ProjectState } from '../../../src/modules/project/entities/project.entity';

describe('ProjectMapper', () => {
  const userMapper = {
    toDomain: jest.fn((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    })),
    toEntity: jest.fn((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    })),
  } as any;

  const feedbackMapper = {
    toDomain: jest.fn((f) => ({
      projectId: f.projectId,
      text: f.text,
      createdAt: f.createdAt,
    })),
    toResponseDto: jest.fn((f) => ({ text: f.text, createdAt: f.createdAt })),
  } as any;

  let mapper: ProjectMapper;

  beforeEach(() => {
    jest.clearAllMocks();
    mapper = new ProjectMapper(userMapper, feedbackMapper);
  });

  it('toDomain maps entity including customer/translator/feedback', () => {
    const entity: any = {
      ProjectId: 1,
      languageCode: 'en',
      fileName: 'f',
      originalFile: Buffer.from('x'),
      translatedFile: null,
      state: ProjectState.CREATED,
      createdAt: new Date(),
      customer: { id: 10, name: 'C', email: 'c@x', role: Role.CUSTOMER },
      translator: { id: 20, name: 'T', email: 't@x', role: Role.TRANSLATOR },
      feedback: { projectId: 1, text: 'ok', createdAt: new Date() },
    };

    const domain = mapper.toDomain(entity, true);

    expect(domain.ProjectId).toBe(1);
    expect(domain.hasTranslatedFile).toBe(true);
    expect(userMapper.toDomain).toHaveBeenCalledTimes(2);
    expect(feedbackMapper.toDomain).toHaveBeenCalledTimes(1);
  });

  it('toEntity maps customer/translator via UserMapper', () => {
    const domain: any = {
      ProjectId: 2,
      languageCode: 'cs',
      fileName: 'f',
      originalFile: Buffer.from('x'),
      translatedFile: null,
      state: ProjectState.CREATED,
      customer: { id: 1 },
      translator: { id: 2 },
    };

    const entity = mapper.toEntity(domain);

    expect(entity.ProjectId).toBe(2);
    expect(userMapper.toEntity).toHaveBeenCalledTimes(2);
  });

  it('toDomainFromCreateDto sets CREATED state', () => {
    const domain = mapper.toDomainFromCreateDto({ languageCode: 'en' } as any);
    expect(domain.state).toBe(ProjectState.CREATED);
  });

  it('toDto includes feedback response', () => {
    const createdAt = new Date();
    const dto = mapper.toDto({
      ProjectId: 1,
      languageCode: 'en',
      state: ProjectState.CREATED,
      fileName: 'f',
      createdAt,
      hasTranslatedFile: false,
      feedback: { text: 'x', createdAt },
    } as any);

    expect(dto.feedback).toEqual({ text: 'x', createdAt });
    expect(feedbackMapper.toResponseDto).toHaveBeenCalled();
  });
});
