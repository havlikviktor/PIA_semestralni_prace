import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/modules/user/user.controller';
import { UserService } from '../../../src/modules/user/user.service';
import { CreateUserDto } from '../../../src/modules/user/dto/create-user.dto';
import { Role } from '../../../src/modules/user/entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    signup: jest.fn(),
    login: jest.fn(),
    findByRole: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John',
        password: 'pswd',
        email: 'john@example.com',
        role: Role.CUSTOMER,
      };
      const expectedResult = {
        user: { id: 'John', role: Role.CUSTOMER },
        accessToken: 'token',
      };
      mockUserService.signup.mockResolvedValue(expectedResult);

      expect(await controller.create(createUserDto)).toBe(expectedResult);
      expect(service.signup).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('getUsers', () => {
    it('should return users by role', async () => {
      const result = [{ id: 1, role: Role.CUSTOMER }];
      mockUserService.findByRole.mockResolvedValue(result);

      expect(await controller.getUsers(Role.CUSTOMER)).toBe(result);
      expect(service.findByRole).toHaveBeenCalledWith(Role.CUSTOMER);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const result = { id: 1 };
      mockUserService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
