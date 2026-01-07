import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  HttpCode,
  Req,
} from '@nestjs/common';
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

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully.',
    type: UserInfoDto,
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
    @Req() req,
  ) {
    return this.userService.updateRole(+id, req.user.role, updateUserRoleDto);
  }
}
