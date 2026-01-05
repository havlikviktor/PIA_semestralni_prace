import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AuthService {
  private pendingTickets = new Map<string, { token: string; user: any }>();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  signToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      name: user.name,
      role: user.role,
    });
  }

  generateTicket(token: string, user: any): string {
    const ticket = uuidv4();
    this.pendingTickets.set(ticket, { token, user });
    setTimeout(() => this.pendingTickets.delete(ticket), 2 * 60 * 1000);
    return ticket;
  }

  exchangeTicket(ticket: string): { accessToken: string; user: any } {
    const data = this.pendingTickets.get(ticket);
    if (!data) {
      throw new NotFoundException('Invalid or expired ticket');
    }
    this.pendingTickets.delete(ticket);
    return {
      accessToken: data.token,
      user: {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        email: data.user.email,
        newUser: data.user.newUser,
      },
    };
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    const token = this.signToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        newUser: true,
      },
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('User with this email does not exist');
    }

    await this.checkCredentials(user, loginDto);

    const token = this.signToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async checkCredentials(user: User, loginDto: LoginDto) {
    if (!user.password) {
      throw new UnauthorizedException(
        'User registered via Google, no password set',
      );
    }

    const isPasswordValid = await this.encryptionService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials, wrong password');
    }
  }
}
