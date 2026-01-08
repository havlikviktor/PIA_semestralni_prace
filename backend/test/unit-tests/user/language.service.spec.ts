import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LanguageService } from '../../../src/modules/user/language.service';
import { TranslatorLanguage } from '../../../src/modules/user/entities/translator-language.entity';

describe('LanguageService', () => {
  const repo = {
    delete: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
  };

  let service: LanguageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LanguageService,
        { provide: getRepositoryToken(TranslatorLanguage), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(LanguageService);
  });

  it('does nothing when user is not translator', async () => {
    const userDomain = {
      id: 1,
      isTranslator: () => false,
      validateLanguages: () => true,
      languages: ['en'],
    } as any;

    await service.updateTranslatorLanguages(userDomain);

    expect(repo.delete).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('replaces translator languages when valid', async () => {
    const userDomain = {
      id: 2,
      isTranslator: () => true,
      validateLanguages: () => true,
      languages: ['en', 'cs'],
    } as any;

    await service.updateTranslatorLanguages(userDomain);

    expect(repo.delete).toHaveBeenCalledWith({ translator: { id: 2 } });
    expect(repo.create).toHaveBeenCalledTimes(2);
    expect(repo.save).toHaveBeenCalledWith([
      { translator: { id: 2 }, languageCode: 'en' },
      { translator: { id: 2 }, languageCode: 'cs' },
    ]);
  });
});
