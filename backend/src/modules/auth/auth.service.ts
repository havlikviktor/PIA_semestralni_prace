import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { EncryptionService } from '../encryption/encryption.service';
import { UserDomain } from '../../domain-entites/user.domain';
import { UserMapper } from '../user/user.mapper';
import { UserInfoDto } from '../user/dto/user-info.dto';

@Injectable()
export class AuthService {
  private pendingTickets = new Map<
    string,
    { token: string; user: UserDomain }
  >();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private readonly encryptionService: EncryptionService,
    private readonly userMapper: UserMapper,
  ) {}

  signToken(user: UserDomain): string {
    return this.jwtService.sign({
      sub: user.id,
      name: user.name,
      role: user.role,
    });
  }

  generateTicket(token: string, user: UserDomain): string {
    const ticket = uuidv4();
    const timeout = setTimeout(
      () => this.pendingTickets.delete(ticket),
      2 * 60 * 1000,
    );
    // Prevent keeping the process alive (important for Jest E2E runs)
    (timeout as any).unref?.();

    this.pendingTickets.set(ticket, { token, user });
    return ticket;
  }

  exchangeTicket(ticket: string): { accessToken: string; user: UserInfoDto } {
    const data = this.pendingTickets.get(ticket);
    if (!data) {
      throw new NotFoundException('Invalid or expired ticket');
    }
    this.pendingTickets.delete(ticket);
    return {
      accessToken: data.token,
      user: this.userMapper.toDto(data.user),
    };
  }

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; user: UserInfoDto }> {
    const userDomain = this.userMapper.toDomainFromCreateDto(createUserDto);
    const user = await this.userService.create(userDomain);

    const token = this.signToken(user);
    return {
      user: this.userMapper.toDto(user),
      accessToken: token,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: UserInfoDto }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('User with this email does not exist');
    }

    await this.checkCredentials(user, loginDto);

    const token = this.signToken(user);
    return {
      user: this.userMapper.toDto(user),
      accessToken: token,
    };
  }

  async checkCredentials(user: UserDomain, loginDto: LoginDto) {
    user.checkHasPassword();

    const isPasswordValid = await this.encryptionService.compare(
      loginDto.password,
      user.password!,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials, wrong password');
    }
  }
}
