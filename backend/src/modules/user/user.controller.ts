import { Controller, Get, Body, Patch, Param, Req } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserMapper } from './user.mapper';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserInfoDto } from './dto/user-info.dto';
import { AuthResponseDto } from '../auth/dto/auth-response.dto';
import { Role } from './entities/user.entity';

type JwtRequest = ExpressRequest & { user: { sub: number; role: Role } };

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: 200,
    description: 'Current user info retrieved successfully.',
    type: UserInfoDto,
  })
  async getMe(@Req() req: JwtRequest) {
    const user = await this.userService.findOne(req.user.sub);
    return this.userMapper.toDto(user!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden, user does not have permission to assign administrator role.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 409,
    description:
      'When changing the user role to translator, languages must be provided.',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Req() req: JwtRequest,
  ) {
    return this.userService.updateRole(+id, req.user.role, updateUserRoleDto);
  }
}
