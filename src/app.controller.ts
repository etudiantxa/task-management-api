import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './public.decorator';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('reset-password')
  @Public()
  resetPasswordRedirect(@Query('token') token: string, @Res() res: Response) {
    // Rediriger vers le deep link de l'app mobile
    const deepLink = `myapp://reset-password?token=${token}`;
    return res.redirect(deepLink);
  }
}