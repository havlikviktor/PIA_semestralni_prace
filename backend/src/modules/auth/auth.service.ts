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

@Injectable()
export class AuthService {
  private pendingTickets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  signToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });
  }

  generateTicket(token: string): string {
    const ticket = uuidv4();
    this.pendingTickets.set(ticket, token);
    // Ticket expires in 2 minutes
    setTimeout(() => this.pendingTickets.delete(ticket), 2 * 60 * 1000);
    return ticket;
  }

  exchangeTicket(ticket: string): { accessToken: string } {
    const token = this.pendingTickets.get(ticket);
    if (!token) {
      throw new NotFoundException('Invalid or expired ticket');
    }
    this.pendingTickets.delete(ticket);
    return { accessToken: token };
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    const token = this.signToken(user);
    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.signToken(user);
    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }
}
