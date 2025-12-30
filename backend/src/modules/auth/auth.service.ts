import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  signToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });
  }
}
