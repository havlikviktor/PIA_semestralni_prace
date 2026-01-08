import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UserService } from '../../../src/modules/user/user.service';
import { EncryptionService } from '../../../src/modules/encryption/encryption.service';
import { UserMapper } from '../../../src/modules/user/user.mapper';

describe('AuthService', () => {
  const jwtService = {
    sign: jest.fn(() => 'signed.jwt.token'),
  } as unknown as JwtService;

  const userService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  } as unknown as UserService;

  const encryptionService = {
    compare: jest.fn(),
  } as unknown as EncryptionService;

  const userMapper = {
    toDto: jest.fn((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    })),
    toDomainFromCreateDto: jest.fn((dto: any) => dto),
  } as unknown as UserMapper;

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UserService, useValue: userService },
        { provide: EncryptionService, useValue: encryptionService },
        { provide: UserMapper, useValue: userMapper },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('signToken signs expected payload', () => {
    const user = { id: 1, name: 'A', role: 'customer' } as any;

    const token = service.signToken(user);

    expect(token).toBe('signed.jwt.token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      name: 'A',
      role: 'customer',
    });
  });

  it('generateTicket + exchangeTicket returns token+user and invalidates ticket', () => {
    jest.useFakeTimers();
    const user = { id: 1, email: 'a@b.c', name: 'A', role: 'customer' } as any;

    const ticket = service.generateTicket('tok', user);
    const exchanged = service.exchangeTicket(ticket);

    expect(exchanged).toEqual({
      accessToken: 'tok',
      user: { id: 1, email: 'a@b.c', name: 'A', role: 'customer' },
    });

    expect(() => service.exchangeTicket(ticket)).toThrow(NotFoundException);

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('exchangeTicket throws NotFoundException for invalid ticket', () => {
    expect(() => service.exchangeTicket('nope')).toThrow(NotFoundException);
  });

  it('login throws UnauthorizedException when user does not exist', async () => {
    (userService.findByEmail as any).mockResolvedValue(null);

    await expect(
      service.login({ email: 'x@y.z', password: 'pw' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns accessToken and user dto when credentials valid', async () => {
    const user = {
      id: 1,
      email: 'x@y.z',
      name: 'X',
      role: 'customer',
      password: 'hashed',
      checkHasPassword: jest.fn(),
    } as any;

    (userService.findByEmail as any).mockResolvedValue(user);
    (encryptionService.compare as any).mockResolvedValue(true);

    const result = await service.login({
      email: 'x@y.z',
      password: 'pw',
    } as any);

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user).toEqual({
      id: 1,
      email: 'x@y.z',
      name: 'X',
      role: 'customer',
    });
    expect(encryptionService.compare).toHaveBeenCalledWith('pw', 'hashed');
  });

  it('checkCredentials throws UnauthorizedException when password invalid', async () => {
    const user = { password: 'hashed', checkHasPassword: jest.fn() } as any;
    (encryptionService.compare as any).mockResolvedValue(false);

    await expect(
      service.checkCredentials(user, { password: 'pw' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
