import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/modules/user/user.service';
import { EntityManager } from 'typeorm';
import { User, Role } from '../../../src/modules/user/entities/user.entity';
import { TranslatorLanguage } from '../../../src/modules/user/entities/translator-language.entity';
import { CreateUserDto } from '../../../src/modules/user/dto/create-user.dto';
import { UpdateUserDto } from '../../../src/modules/user/dto/update-user.dto';
import { Language } from '../../../src/modules/user/entities/translator-language.entity';
import { AuthService } from '../../../src/modules/auth/auth.service';

describe('UserService', () => {
  let service: UserService;
  let entityManager: EntityManager;

  const mockEntityManager = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuthService = {
    signToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John',
        password: 'pswd',
        email: 'john@example.com',
        role: Role.CUSTOMER,
      };
      const user = { ...createUserDto };
      mockEntityManager.create.mockReturnValue(user);
      mockEntityManager.save.mockResolvedValue(user);

      await service.create(createUserDto);

      expect(entityManager.create).toHaveBeenCalledWith(User, createUserDto);
      expect(entityManager.save).toHaveBeenCalledWith(User, user);
    });
  });

  describe('findByRole', () => {
    it('should find users by role TRANSLATOR with relations', async () => {
      const result = [{ id: 1, role: Role.TRANSLATOR }];
      mockEntityManager.find.mockResolvedValue(result);

      await service.findByRole(Role.TRANSLATOR);

      expect(entityManager.find).toHaveBeenCalledWith(User, {
        where: { role: Role.TRANSLATOR },
        relations: ['languages'],
      });
    });

    it('should find users by other role without relations', async () => {
      const result = [{ id: 1, role: Role.CUSTOMER }];
      mockEntityManager.find.mockResolvedValue(result);

      await service.findByRole(Role.CUSTOMER);

      expect(entityManager.find).toHaveBeenCalledWith(User, {
        where: { role: Role.CUSTOMER },
      });
    });
  });

  describe('findTranslator', () => {
    it('should find a translator with languages', async () => {
      const result = { id: 1, role: Role.TRANSLATOR };
      mockEntityManager.findOne.mockResolvedValue(result);

      await service.findTranslator(1);

      expect(entityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: 1, role: Role.TRANSLATOR },
        relations: ['languages'],
      });
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Jane' };

      await service.update(1, updateUserDto);

      expect(entityManager.update).toHaveBeenCalledWith(User, 1, updateUserDto);
    });

    it('should update languages if provided', async () => {
      const updateUserDto: UpdateUserDto = {
        languages: [{ languageCode: Language.ENGLISH }],
      };

      await service.update(1, updateUserDto);

      expect(entityManager.delete).toHaveBeenCalledWith(TranslatorLanguage, {
        translator: { id: 1 },
      });
      expect(entityManager.save).toHaveBeenCalled();
    });
  });
});
