import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { Role } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

interface JwtPayload {
  sub: number;
  role: Role;
  name?: string;
}

export interface WsUser {
  sub: number;
  role: Role;
  name: string;
}

@Injectable()
export class WsJwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake as any)?.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const queryToken = (client.handshake as any)?.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    const headerAuth = client.handshake.headers?.authorization;
    if (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')) {
      return headerAuth.slice('Bearer '.length);
    }

    return null;
  }

  async authenticate(client: Socket): Promise<WsUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.role !== payload.role) {
      throw new UnauthorizedException('User role has changed');
    }

    return {
      sub: payload.sub,
      role: user.role,
      name: user.name,
    };
  }
}
