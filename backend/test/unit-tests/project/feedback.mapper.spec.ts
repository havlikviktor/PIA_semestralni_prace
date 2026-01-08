import { FeedbackMapper } from '../../../src/modules/project/feedback.mapper';

describe('FeedbackMapper', () => {
  let mapper: FeedbackMapper;

  beforeEach(() => {
    mapper = new FeedbackMapper();
  });

  it('toDomain maps entity to domain', () => {
    const createdAt = new Date();
    const domain = mapper.toDomain({
      projectId: 1,
      text: 't',
      createdAt,
    } as any);

    expect(domain.projectId).toBe(1);
    expect(domain.text).toBe('t');
    expect(domain.createdAt).toBe(createdAt);
  });

  it('toEntity maps domain to entity', () => {
    const entity = mapper.toEntity({ projectId: 2, text: 'x' } as any);
    expect(entity.projectId).toBe(2);
    expect(entity.text).toBe('x');
  });

  it('toResponseDto maps domain to response dto', () => {
    const createdAt = new Date();
    const dto = mapper.toResponseDto({ text: 'a', createdAt } as any);
    expect(dto).toEqual({ text: 'a', createdAt });
  });
});
