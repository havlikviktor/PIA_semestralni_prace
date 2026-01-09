import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { Role } from '../../user/entities/user.entity';

interface JwtPayload {
  sub: number;
  role: Role;
}

type JwtValidatedUser = {
  sub: number;
  name: string;
  role: Role;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Validates the JWT payload against the current user record.
   */
  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== payload.role) {
      throw new UnauthorizedException('User role has changed');
    }

    return {
      sub: payload.sub,
      name: user.name,
      role: user.role,
    };
  }
}
