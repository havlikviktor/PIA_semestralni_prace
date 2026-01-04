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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query('role') role?: Role) {
    return this.userService.findByRole(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
  
  @HttpCode(204)
  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
     await this.userService.updateRole(+id, updateUserRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
