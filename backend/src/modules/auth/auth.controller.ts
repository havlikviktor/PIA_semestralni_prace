import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { Response } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict. Email already exists.' })
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth.' })
  async googleAuth(@Req() req) {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google login callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with ticket.',
  })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.signToken(user);
    const ticket = this.authService.generateTicket(token, user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}?ticket=${ticket}`);
  }

  @Public()
  @HttpCode(201)
  @Post('ticket')
  @ApiOperation({ summary: 'Exchange ticket for access token' })
  @ApiBody({
    schema: { type: 'object', properties: { ticket: { type: 'string' } } },
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket exchanged successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invalid or expired ticket.' })
  async exchangeTicket(@Body('ticket') ticket: string) {
    return this.authService.exchangeTicket(ticket);
  }
}
