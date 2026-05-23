import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
  Put,
  Get,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from './dtos/login-request.dt';
import { Public } from 'src/public.decorator';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateUserRequestDto } from './dtos/update-auth-request.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dtos/forgot-reset-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@ApiTags('Auth')
@Controller('auths')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  @Public()
  async googleAuth(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() signInDto: LoginRequest) {
    return this.authService.signIn(signInDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @Public()
  register(@Body() user: RegisterRequestDto) {
    return this.authService.register(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Headers('Authorization') auth: string) {
    const jwt = auth.replace('Bearer ', '');
    return this.authService.refreshAccessToken(jwt);
  }

  @ApiBearerAuth()
  @Put('profils')
  update(
    @Headers('Authorization') auth: string,
    @Body() user: UpdateUserRequestDto,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.authService.updateUser(jwt, user);
  }

  @ApiBearerAuth()
  @Get('profils')
  getUser(@Headers('Authorization') auth: string) {
    const jwt = auth.replace('Bearer ', '');
    return this.authService.getUser(jwt);
  }

  @ApiBearerAuth()
  @Put('profils/photo')
  @UseInterceptors(FileInterceptor('photo', {
    dest: './uploads/profile-pics',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  updatePhoto(
    @Headers('Authorization') auth: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const jwt = auth.replace('Bearer ', '');
    return this.authService.updateUserPhoto(jwt, file);
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Endpoint temporaire pour récupérer le dernier jeton de réinitialisation (uniquement pour les tests)
  @Get('test/get-last-reset-token')
  @Public()
  getLastResetToken() {
    return { token: this.authService.getLastResetToken() };
  }
}