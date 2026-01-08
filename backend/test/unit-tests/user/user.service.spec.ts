import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../../src/modules/user/user.service';
import {
  UserEntity,
  Role,
} from '../../../src/modules/user/entities/user.entity';
import { LanguageService } from '../../../src/modules/user/language.service';
import { EncryptionService } from '../../../src/modules/encryption/encryption.service';
import { UserMapper } from '../../../src/modules/user/user.mapper';

describe('UserService', () => {
  const userRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const languageService = {
    updateTranslatorLanguages: jest.fn(),
  } as unknown as LanguageService;

  const encryptionService = {
    hash: jest.fn(),
    compare: jest.fn(),
  } as unknown as EncryptionService;

  const userMapper = {
    toEntity: jest.fn((x) => x),
    toDomain: jest.fn((x) => x),
    toDto: jest.fn((x) => ({ id: x.id, role: x.role })),
  } as unknown as UserMapper;

  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
        { provide: LanguageService, useValue: languageService },
        { provide: EncryptionService, useValue: encryptionService },
        { provide: UserMapper, useValue: userMapper },
      ],
    }).compile();

    service = moduleRef.get(UserService);
  });

  it('create throws ConflictException when email exists', async () => {
    (userRepository.findOne as any).mockResolvedValue({ id: 1 });

    await expect(
      service.create({ email: 'x@y.z' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateRole forbids setting administrator role by non-admin requester', async () => {
    await expect(
      service.updateRole(1, Role.CUSTOMER, { role: Role.ADMINISTRATOR } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updateRole calls LanguageService when setting translator', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 1, role: Role.TRANSLATOR } as any);

    await service.updateRole(1, Role.ADMINISTRATOR, {
      role: Role.TRANSLATOR,
      languages: ['en'],
    } as any);

    expect(languageService.updateTranslatorLanguages).toHaveBeenCalled();
    expect(userRepository.update).toHaveBeenCalledWith(1, {
      role: Role.TRANSLATOR,
    });
  });

  it('updateRole throws NotFoundException when user not found after update', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(null);

    await expect(
      service.updateRole(1, Role.ADMINISTRATOR, { role: Role.CUSTOMER } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
