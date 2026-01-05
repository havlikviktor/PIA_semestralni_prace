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
  
  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
     return this.userService.updateRole(+id, updateUserRoleDto);
    }
}