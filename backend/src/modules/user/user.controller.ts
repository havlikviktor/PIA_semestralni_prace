import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { EmailExistsInterceptor } from './interceptors/email-exists.interceptor';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @UseInterceptors(EmailExistsInterceptor)
  @Post('signup')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);

    const token = this.authService.signToken(user);

    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.authService.signToken(user);
    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }

  @Get()
  async getUsers(@Query('role') role?: Role) {
    return this.userService.findByRole(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
