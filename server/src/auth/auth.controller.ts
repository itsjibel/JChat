import { Body, Controller, Post, Get, Headers, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Get('checkLoggedIn')
  async checkLoggedIn(@Headers() refreshToken: any, @Res() res: Response) {
    this.authService
      .checkLoggedIn(refreshToken.authorization.split(' ')[1])
      .then((results) => {
        res.send({ success: results ? true : false });
      });
  }

  @Post('refreshAccessToken')
  refreshAccessToken(@Headers() refreshToken: any, @Res() res: Response) {
    this.authService
      .refreshAccessToken(refreshToken.authorization.split(' ')[1])
      .then((result) => {
        res.send({ accessToken: result });
      });
  }
}
