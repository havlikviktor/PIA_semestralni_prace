import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Role } from './entities/user.entity';
import { UserMapper } from './user.mapper';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Get()
  async getUsers(@Query('role') role?: Role) {
    const users = await this.userService.findByRole(role);
    return users.map((user) => this.userMapper.toDto(user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(+id);
    return user ? this.userMapper.toDto(user) : null;
  }

  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
     return this.userService.updateRole(+id, updateUserRoleDto);
    }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}