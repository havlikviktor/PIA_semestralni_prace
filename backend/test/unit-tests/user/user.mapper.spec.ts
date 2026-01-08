import { UserMapper } from '../../../src/modules/user/user.mapper';
import { Role } from '../../../src/modules/user/entities/user.entity';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  it('toDomain maps entity fields and languages', () => {
    const entity: any = {
      id: 1,
      name: 'A',
      email: 'a@b.c',
      password: 'p',
      googleId: 'g',
      role: Role.CUSTOMER,
      languages: [{ languageCode: 'en' }, { languageCode: 'cs' }],
    };

    const domain = mapper.toDomain(entity);

    expect(domain.id).toBe(1);
    expect(domain.email).toBe('a@b.c');
    expect(domain.languages).toEqual(['en', 'cs']);
  });

  it('toEntity maps domain fields and creates TranslatorLanguage entities', () => {
    const domain: any = {
      id: 2,
      name: 'B',
      email: 'b@b.c',
      password: undefined,
      googleId: undefined,
      role: Role.TRANSLATOR,
      languages: ['en'],
    };

    const entity = mapper.toEntity(domain);

    expect(entity.id).toBe(2);
    expect(entity.password).toBeNull();
    expect(entity.googleId).toBeNull();
    expect(entity.languages).toHaveLength(1);
    expect(entity.languages[0].languageCode).toBe('en');
    expect(entity.languages[0].translator).toBe(entity);
  });

  it('toDomainFromCreateDto sets customer role', () => {
    const domain = mapper.toDomainFromCreateDto({
      name: 'N',
      email: 'e',
      password: 'p',
    } as any);
    expect(domain.role).toBe(Role.CUSTOMER);
  });

  it('toDto maps basic info and defaults isNewUser', () => {
    const dto = mapper.toDto({
      id: 1,
      name: 'A',
      role: Role.CUSTOMER,
      email: 'a@b.c',
    } as any);
    expect(dto).toEqual({
      id: 1,
      name: 'A',
      role: Role.CUSTOMER,
      email: 'a@b.c',
      isNewUser: false,
    });
  });
});
